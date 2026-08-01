import { Controller, Get, Post, Body, Param, Query, BadRequestException } from '@nestjs/common';
import { db } from '../db';
import { users, doctorSchedules, appointments, patients } from '../db/schema';
import { eq, and, gte, lte, sql } from 'drizzle-orm';

@Controller('booking')
export class BookingController {
  @Get('doctors')
  async getDoctors() {
    const doctors = await db
      .select({
        id: users.id,
        name: users.name,
      })
      .from(users)
      .where(and(eq(users.role, 'doctor'), eq(users.isActive, true)));
    return doctors;
  }

  @Get('doctors/:doctorId/slots')
  async getSlots(
    @Param('doctorId') doctorId: string,
    @Query('date') dateStr: string,
  ) {
    if (!dateStr) throw new BadRequestException('date query parameter is required');

    const date = new Date(dateStr);
    if (isNaN(date.getTime())) throw new BadRequestException('Invalid date');

    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayOfWeek = days[date.getDay()];

    const schedules = await db
      .select()
      .from(doctorSchedules)
      .where(
        and(
          eq(doctorSchedules.doctorId, doctorId),
          eq(doctorSchedules.dayOfWeek, dayOfWeek as any),
        ),
      );

    if (schedules.length === 0) return [];

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const existingAppts = await db
      .select({ scheduledAt: appointments.scheduledAt })
      .from(appointments)
      .where(
        and(
          eq(appointments.doctorId, doctorId),
          gte(appointments.scheduledAt, startOfDay),
          lte(appointments.scheduledAt, endOfDay),
          sql`${appointments.status} NOT IN ('cancelled', 'no_show')`,
        ),
      );

    const bookedTimes = new Set(
      existingAppts.map((a) => {
        const d = new Date(a.scheduledAt);
        return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
      }),
    );

    const slots: { time: string; label: string }[] = [];

    for (const schedule of schedules) {
      const [startH, startM] = schedule.startTime.split(':').map(Number);
      const [endH, endM] = schedule.endTime.split(':').map(Number);
      const duration = schedule.slotDurationMinutes;

      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;

      for (let m = startMinutes; m + duration <= endMinutes; m += duration) {
        const h = Math.floor(m / 60);
        const min = m % 60;
        const timeStr = `${h.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;

        if (!bookedTimes.has(timeStr)) {
          const label = new Date(0, 0, 0, h, min).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
          });
          slots.push({ time: timeStr, label });
        }
      }
    }

    return slots;
  }

  @Post('appointments')
  async createAppointment(
    @Body()
    body: {
      doctorId: string;
      scheduledAt: string;
      patientFirstName: string;
      patientLastName: string;
      patientPhone: string;
      patientDateOfBirth: string;
    },
  ) {
    const { doctorId, scheduledAt, patientFirstName, patientLastName, patientPhone, patientDateOfBirth } = body;

    if (!doctorId || !scheduledAt || !patientFirstName || !patientLastName || !patientPhone || !patientDateOfBirth) {
      throw new BadRequestException('All fields are required');
    }

    const [doctor] = await db
      .select()
      .from(users)
      .where(and(eq(users.id, doctorId), eq(users.role, 'doctor'), eq(users.isActive, true)));
    if (!doctor) throw new BadRequestException('Doctor not found');

    const date = new Date(scheduledAt);
    if (isNaN(date.getTime())) throw new BadRequestException('Invalid scheduledAt');

    let patient = await db
      .select()
      .from(patients)
      .where(eq(patients.phone, patientPhone))
      .then((rows) => rows[0]);

    if (!patient) {
      const year = new Date().getFullYear();
      const count = await db.select().from(patients).then((r) => r.length);
      const mrn = `MRN-${year}-${(count + 1).toString().padStart(5, '0')}`;

      [patient] = await db
        .insert(patients)
        .values({
          mrn,
          firstName: patientFirstName,
          lastName: patientLastName,
          dateOfBirth: patientDateOfBirth,
          gender: 'other',
          phone: patientPhone,
        })
        .returning();
    }

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const todaysAppts = await db
      .select()
      .from(appointments)
      .where(
        and(
          eq(appointments.doctorId, doctorId),
          gte(appointments.scheduledAt, startOfDay),
          lte(appointments.scheduledAt, endOfDay),
        ),
      );

    const queueNumber = todaysAppts.length + 1;

    const [appointment] = await db
      .insert(appointments)
      .values({
        patientId: patient.id,
        doctorId,
        scheduledAt: date,
        queueNumber,
      })
      .returning();

    return {
      id: appointment.id,
      queueNumber: appointment.queueNumber,
      scheduledAt: appointment.scheduledAt,
      doctorName: doctor.name,
      patientName: `${patient.firstName} ${patient.lastName}`,
      status: appointment.status,
    };
  }

  @Get('appointments/:id')
  async getAppointment(@Param('id') id: string) {
    const [row] = await db
      .select({
        id: appointments.id,
        queueNumber: appointments.queueNumber,
        scheduledAt: appointments.scheduledAt,
        status: appointments.status,
        doctorName: users.name,
        patientFirstName: patients.firstName,
        patientLastName: patients.lastName,
        patientPhone: patients.phone,
      })
      .from(appointments)
      .leftJoin(users, eq(appointments.doctorId, users.id))
      .leftJoin(patients, eq(appointments.patientId, patients.id))
      .where(eq(appointments.id, id));

    if (!row) throw new BadRequestException('Appointment not found');

    return {
      id: row.id,
      queueNumber: row.queueNumber,
      scheduledAt: row.scheduledAt,
      status: row.status,
      doctorName: row.doctorName,
      patientName: `${row.patientFirstName} ${row.patientLastName}`,
      patientPhone: row.patientPhone,
    };
  }
}
