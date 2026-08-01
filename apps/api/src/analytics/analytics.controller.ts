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
  @Get('revenue')
  @Roles('admin', 'cashier')
  async revenue(@Query('start') startStr?: string, @Query('end') endStr?: string) {
    const start = startStr ? new Date(startStr) : new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endStr ? new Date(endStr) : new Date();

    const rows = await db
      .select({
        date: sql`DATE(${invoices.updatedAt})`,
        total: sql`SUM(${invoices.totalAmount}::numeric)`,
        paid: sql`SUM(CASE WHEN ${invoices.status} IN ('paid','partial') THEN ${invoices.amountPaid}::numeric ELSE 0 END)`,
        pending: sql`SUM(CASE WHEN ${invoices.status} = 'pending' THEN ${invoices.totalAmount}::numeric ELSE 0 END)`,
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
    const start = startStr ? new Date(startStr) : new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endStr ? new Date(endStr) : new Date();

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

  @Get('diagnoses')
  @Roles('admin', 'doctor')
  async diagnoses(@Query('start') startStr?: string, @Query('end') endStr?: string) {
    const start = startStr ? new Date(startStr) : new Date(new Date().setDate(new Date().getDate() - 90));
    const end = endStr ? new Date(endStr) : new Date();

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
