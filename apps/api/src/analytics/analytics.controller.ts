import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { db } from '../db';
import { invoices, visits, appointments, invoiceItems } from '../db/schema';
import { eq, and, gte, lte, sql } from 'drizzle-orm';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnalyticsController {
  private parseRange(range?: string) {
    const days = range === '7d' ? 7 : 30;
    const start = new Date();
    start.setDate(start.getDate() - days);
    return start;
  }

  private parseDateRange(startStr?: string, endStr?: string, defaultDays = 30) {
    const start = startStr ? new Date(`${startStr}T00:00:00.000`) : new Date(new Date().setDate(new Date().getDate() - defaultDays));
    const end = endStr ? new Date(`${endStr}T23:59:59.999`) : new Date();
    return { start, end };
  }

  @Get('revenue')
  @Roles('admin', 'cashier')
  async revenue(@Query('start') startStr?: string, @Query('end') endStr?: string) {
    const { start, end } = this.parseDateRange(startStr, endStr);

    const rows = await db
      .select({
        date: sql`DATE(${invoices.updatedAt})`,
        total: sql`SUM(${invoices.totalAmount}::numeric)`,
        paid: sql`SUM(CASE WHEN ${invoices.status} IN ('paid','partial') THEN ${invoices.amountPaid}::numeric ELSE 0 END)`,
        pending: sql`SUM(CASE
          WHEN ${invoices.status} = 'pending' THEN ${invoices.totalAmount}::numeric
          WHEN ${invoices.status} = 'partial' THEN (${invoices.totalAmount}::numeric - ${invoices.amountPaid}::numeric)
          ELSE 0 END)`,
        count: sql`COUNT(*)`,
      })
      .from(invoices)
      .where(and(gte(invoices.createdAt, start), lte(invoices.createdAt, end)))
      .groupBy(sql`DATE(${invoices.updatedAt})`)
      .orderBy(sql`DATE(${invoices.updatedAt})`);

    const totals = await db
      .select({
        method: invoices.paymentMethod,
        total: sql`SUM(${invoices.amountPaid}::numeric)`,
        count: sql`COUNT(*)`,
      })
      .from(invoices)
      .where(
        and(
          gte(invoices.createdAt, start),
          lte(invoices.createdAt, end),
          sql`${invoices.status} IN ('paid', 'partial')`,
          sql`${invoices.paymentMethod} IS NOT NULL`,
        ),
      )
      .groupBy(invoices.paymentMethod);

    return { daily: rows, byMethod: totals, period: { start, end } };
  }

  @Get('patient-flow')
  @Roles('admin', 'doctor', 'cashier')
  async patientFlow(@Query('start') startStr?: string, @Query('end') endStr?: string) {
    const { start, end } = this.parseDateRange(startStr, endStr);

    const dailyVisits = await db
      .select({
        date: sql`DATE(${visits.createdAt})`,
        count: sql`COUNT(*)`,
      })
      .from(visits)
      .where(and(gte(visits.createdAt, start), lte(visits.createdAt, end)))
      .groupBy(sql`DATE(${visits.createdAt})`)
      .orderBy(sql`DATE(${visits.createdAt})`);

    const dailyAppointments = await db
      .select({
        date: sql`DATE(${appointments.createdAt})`,
        count: sql`COUNT(*)`,
        checkedIn: sql`COUNT(CASE WHEN ${appointments.status} IN ('checked_in','triaged','in_progress','completed') THEN 1 END)`,
        noShow: sql`COUNT(CASE WHEN ${appointments.status} = 'no_show' THEN 1 END)`,
      })
      .from(appointments)
      .where(and(gte(appointments.createdAt, start), lte(appointments.createdAt, end)))
      .groupBy(sql`DATE(${appointments.createdAt})`)
      .orderBy(sql`DATE(${appointments.createdAt})`);

    const totals = await db
      .select({
        total: sql`COUNT(*)`,
        completed: sql`COUNT(CASE WHEN ${appointments.status} = 'completed' THEN 1 END)`,
        noShow: sql`COUNT(CASE WHEN ${appointments.status} = 'no_show' THEN 1 END)`,
        cancelled: sql`COUNT(CASE WHEN ${appointments.status} = 'cancelled' THEN 1 END)`,
      })
      .from(appointments)
      .where(and(gte(appointments.createdAt, start), lte(appointments.createdAt, end)));

    return { daily: dailyVisits, appointments: dailyAppointments, totals: totals[0], period: { start, end } };
  }

  @Get('patient-volume')
  @Roles('admin')
  async patientVolume(@Query('range') range?: string) {
    const start = this.parseRange(range);

    const rows = await db
      .select({
        date: sql`to_char(${visits.createdAt}::date, 'YYYY-MM-DD')`,
        count: sql`COUNT(*)`,
      })
      .from(visits)
      .where(gte(visits.createdAt, start))
      .groupBy(sql`to_char(${visits.createdAt}::date, 'YYYY-MM-DD')`)
      .orderBy(sql`to_char(${visits.createdAt}::date, 'YYYY-MM-DD')`);

    return rows;
  }

  @Get('revenue-by-service')
  @Roles('admin')
  async revenueByService(@Query('range') range?: string) {
    const start = this.parseRange(range);

    const category = sql`CASE
      WHEN ${invoiceItems.description} ILIKE 'Lab:%' THEN 'Lab'
      WHEN LOWER(${invoiceItems.description}) LIKE '%consult%' THEN 'Consultation'
      ELSE 'Procedures'
    END`;

    const rows = await db
      .select({
        category,
        total: sql`SUM(${invoiceItems.unitPrice}::numeric * ${invoiceItems.quantity})`,
      })
      .from(invoiceItems)
      .innerJoin(invoices, eq(invoiceItems.invoiceId, invoices.id))
      .where(
        and(
          gte(invoices.createdAt, start),
          sql`${invoices.status} != 'cancelled'`,
        ),
      )
      .groupBy(category)
      .orderBy(
        sql`SUM(${invoiceItems.unitPrice}::numeric * ${invoiceItems.quantity}) DESC`,
      );

    return rows;
  }

  @Get('peak-hours')
  @Roles('admin')
  async peakHours(@Query('range') range?: string) {
    const start = this.parseRange(range);

    const hour = sql`EXTRACT(HOUR FROM ${appointments.scheduledAt})::int`;

    const rows = await db
      .select({
        hour,
        count: sql`COUNT(*)`,
      })
      .from(appointments)
      .where(gte(appointments.scheduledAt, start))
      .groupBy(hour)
      .orderBy(hour);

    return rows;
  }

  @Get('diagnoses')
  @Roles('admin', 'doctor')
  async diagnoses(@Query('start') startStr?: string, @Query('end') endStr?: string) {
    const { start, end } = this.parseDateRange(startStr, endStr, 90);

    const rows = await db
      .select({
        code: visits.diagnosisCode,
        description: visits.diagnosisDescription,
        count: sql`COUNT(*)`,
      })
      .from(visits)
      .where(
        and(
          gte(visits.createdAt, start),
          lte(visits.createdAt, end),
          sql`${visits.diagnosisCode} IS NOT NULL`,
          sql`${visits.diagnosisCode} != ''`,
        ),
      )
      .groupBy(visits.diagnosisCode, visits.diagnosisDescription)
      .orderBy(sql`COUNT(*) DESC`)
      .limit(20);

    return { diagnoses: rows, period: { start, end } };
  }
}
