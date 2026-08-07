import { Controller, Get, Param } from '@nestjs/common';
import { db } from '../db';
import { appointments, patients, users } from '../db/schema';
import { eq, and, sql, inArray } from 'drizzle-orm';

const DISPLAY_STATUSES = ['checked_in', 'triaged', 'in_progress'];

const PRIORITY_RANK = sql`CASE ${appointments.priority}
  WHEN 'emergency' THEN 0
  WHEN 'urgent' THEN 1
  ELSE 2 END`;

@Controller('queue-display')
export class QueueDisplayController {
  @Get()
  async getAll() {
    const rows = await db
      .select({
        id: appointments.id,
        queueNumber: appointments.queueNumber,
        status: appointments.status,
        priority: appointments.priority,
        scheduledAt: appointments.scheduledAt,
        patientFirstName: patients.firstName,
        doctorName: users.name,
        doctorId: users.id,
      })
      .from(appointments)
      .leftJoin(patients, eq(appointments.patientId, patients.id))
      .leftJoin(users, eq(appointments.doctorId, users.id))
      .where(
        and(
          sql`DATE(${appointments.scheduledAt}) = CURRENT_DATE`,
          inArray(appointments.status, DISPLAY_STATUSES as any),
        ),
      )
      .orderBy(appointments.doctorId, PRIORITY_RANK, appointments.queueNumber);

    const grouped: Record<string, { doctorName: string; entries: any[] }> = {};
    for (const row of rows) {
      const key = row.doctorId || 'unknown';
      if (!grouped[key]) {
        grouped[key] = { doctorName: row.doctorName || 'Unknown', entries: [] };
      }
      grouped[key].entries.push({
        id: row.id,
        queueNumber: row.queueNumber,
        status: row.status,
        priority: row.priority,
        patientName: row.patientFirstName || 'Patient',
        scheduledAt: row.scheduledAt,
      });
    }
    return grouped;
  }

  @Get(':doctorId')
  async getByDoctor(@Param('doctorId') doctorId: string) {
    const rows = await db
      .select({
        id: appointments.id,
        queueNumber: appointments.queueNumber,
        status: appointments.status,
        priority: appointments.priority,
        scheduledAt: appointments.scheduledAt,
        patientFirstName: patients.firstName,
        doctorName: users.name,
      })
      .from(appointments)
      .leftJoin(patients, eq(appointments.patientId, patients.id))
      .leftJoin(users, eq(appointments.doctorId, users.id))
      .where(
        and(
          eq(appointments.doctorId, doctorId),
          sql`DATE(${appointments.scheduledAt}) = CURRENT_DATE`,
          inArray(appointments.status, DISPLAY_STATUSES as any),
        ),
      )
      .orderBy(PRIORITY_RANK, appointments.queueNumber);

    return rows.map((r) => ({
      id: r.id,
      queueNumber: r.queueNumber,
      status: r.status,
      priority: r.priority,
      patientName: r.patientFirstName || 'Patient',
      doctorName: r.doctorName || 'Unknown',
      scheduledAt: r.scheduledAt,
    }));
  }
}
