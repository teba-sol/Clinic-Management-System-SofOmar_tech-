import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, BadRequestException } from '@nestjs/common';
import { db } from '../db';
import { users, doctorSchedules, appointments, patients, services } from '../db/schema';
import { eq, and, gte, lte, sql } from 'drizzle-orm';
import { BookingService } from './booking.service';
import { CreateBookingRequestDto } from './dto/create-booking-request.dto';
import { UpdateBookingRequestStatusDto } from './dto/update-booking-request-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { validateBooking } from '../appointments/booking-validation';

@Controller('booking')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Post('requests')
  createRequest(@Body() dto: CreateBookingRequestDto) {
    return this.bookingService.create(dto);
  }

  @Get('requests')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'receptionist')
  findRequests() {
    return this.bookingService.findAll();
  }

  @Patch('requests/:id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'receptionist')
  updateRequestStatus(
    @Param('id') id: string,
    @Body() dto: UpdateBookingRequestStatusDto,
  ) {
    return this.bookingService.updateStatus(id, dto.status);
  }

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

  @Get('stats')
  async getStats() {
    const [doctorCount, patientCount, departmentCount] = await Promise.all([
      db
        .select({ count: sql<number>`COUNT(*)` })
        .from(users)
        .where(and(eq(users.role, 'doctor'), eq(users.isActive, true))),
      db.select({ count: sql<number>`COUNT(*)` }).from(patients),
      db.select({ count: sql<number>`COUNT(*)` }).from(services).where(eq(services.active, true)),
    ]);

    return {
      doctors: Number(doctorCount[0]?.count ?? 0),
      patients: Number(patientCount[0]?.count ?? 0),
      departments: Number(departmentCount[0]?.count ?? 0),
    };
  }

  @Get('staff')
  async getStaff() {
    const staff = await db
      .select({
        id: users.id,
        name: users.name,
        role: users.role,
      })
      .from(users)
      .where(
        and(
          eq(users.isActive, true),
          sql`${users.role} IN ('doctor', 'nurse', 'lab_tech')`,
        ),
      )
      .orderBy(users.name);

    return staff;
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

        if (bookedTimes.has(timeStr)) continue;

        const slotDate = new Date(date);
        slotDate.setHours(h, min, 0, 0);
        if (slotDate.getTime() <= Date.now()) continue;

        const label = new Date(0, 0, 0, h, min).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
        });
        slots.push({ time: timeStr, label });
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

    await validateBooking({
      doctorId,
      patientId: patient.id,
      scheduledAt: date,
    });

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
          sql`${appointments.status} NOT IN ('cancelled', 'no_show')`,
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
