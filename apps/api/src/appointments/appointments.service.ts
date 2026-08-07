import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { db } from '../db';
import { appointments, patients, users } from '../db/schema';
import { eq, and, gte, lte, sql } from 'drizzle-orm';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentPriorityDto } from './dto/update-appointment-priority.dto';
import { AppointmentsGateway } from './appointments.gateway';
import { validateBooking } from './booking-validation';
import {
  generateSlotTimes,
  getDoctorActiveAppointmentsOnDate,
  getDoctorDaySchedules,
  parseDateOnly,
  slotDateTime,
  slotLabel,
  timeOf,
} from './slot-utils';

const ACTIVE_APPOINTMENT_FILTER = sql`${appointments.status} NOT IN ('cancelled', 'no_show')`;

const PRIORITY_RANK = sql`CASE ${appointments.priority}
  WHEN 'emergency' THEN 0
  WHEN 'urgent' THEN 1
  ELSE 2 END`;

const VALID_TRANSITIONS: Record<string, string[]> = {
  booked: ['checked_in', 'cancelled', 'no_show'],
  checked_in: ['in_progress', 'cancelled', 'no_show', 'triaged'],
  triaged: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'triaged'],
  completed: [],
  cancelled: [],
  no_show: [],
};

const ROLE_TRANSITIONS: Record<string, string[]> = {
  booked_checked_in: ['receptionist', 'nurse', 'doctor'],
  checked_in_in_progress: ['doctor', 'nurse'],
  checked_in_triaged: ['nurse'],
  triaged_in_progress: ['doctor'],
  triaged_cancelled: ['receptionist', 'doctor', 'nurse'],
  in_progress_completed: ['doctor'],
  in_progress_triaged: ['doctor'],
  booked_cancelled: ['receptionist', 'doctor', 'nurse'],
  booked_no_show: ['receptionist', 'nurse'],
  checked_in_cancelled: ['receptionist', 'doctor', 'nurse'],
  checked_in_no_show: ['receptionist', 'nurse'],
};

@Injectable()
export class AppointmentsService {
  constructor(private gateway: AppointmentsGateway) {}

  async create(dto: CreateAppointmentDto) {
    const scheduledDate = new Date(dto.scheduledAt);

    await validateBooking({
      doctorId: dto.doctorId,
      patientId: dto.patientId,
      scheduledAt: scheduledDate,
    });

    const startOfDay = new Date(scheduledDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(scheduledDate);
    endOfDay.setHours(23, 59, 59, 999);

    const todaysAppointments = await db
      .select()
      .from(appointments)
      .where(
        and(
          eq(appointments.doctorId, dto.doctorId),
          gte(appointments.scheduledAt, startOfDay),
          lte(appointments.scheduledAt, endOfDay),
          ACTIVE_APPOINTMENT_FILTER,
        ),
      );

    const queueNumber = todaysAppointments.length + 1;

    const [appointment] = await db
      .insert(appointments)
      .values({
        patientId: dto.patientId,
        doctorId: dto.doctorId,
        scheduledAt: scheduledDate,
        queueNumber,
      })
      .returning();

    const updatedQueue = await this.getQueueForDoctor(dto.doctorId, scheduledDate);
    this.gateway.emitQueueUpdate(dto.doctorId, updatedQueue);

    return appointment;
  }

  async findAll() {
    return db.select().from(appointments);
  }

  async findByPatient(patientId: string) {
    return db.select().from(appointments).where(eq(appointments.patientId, patientId));
  }

  async getAvailableSlots(doctorId: string, dateStr: string) {
    const date = parseDateOnly(dateStr);
    if (!date) throw new BadRequestException('Invalid date, expected YYYY-MM-DD');

    const [doctor] = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.id, doctorId), eq(users.role, 'doctor'), eq(users.isActive, true)));
    if (!doctor) throw new BadRequestException('Doctor not found');

    const windows = await getDoctorDaySchedules(doctorId, date);
    const times = generateSlotTimes(windows);
    const now = Date.now();

    const bookedRows = await getDoctorActiveAppointmentsOnDate(doctorId, date);
    const bookedTimes = new Set(bookedRows.map((a) => timeOf(new Date(a.scheduledAt))));

    return times.map((time) => ({
      time,
      label: slotLabel(time),
      booked: bookedTimes.has(time),
      past: slotDateTime(date, time).getTime() <= now,
    }));
  }

  async getFullQueue(date: Date = new Date()) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return db
      .select()
      .from(appointments)
      .where(
        and(
          gte(appointments.scheduledAt, startOfDay),
          lte(appointments.scheduledAt, endOfDay),
        ),
      )
      .orderBy(PRIORITY_RANK, appointments.queueNumber);
  }

  async getQueueForDoctor(doctorId: string, date: Date = new Date()) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return db
      .select()
      .from(appointments)
      .where(
        and(
          eq(appointments.doctorId, doctorId),
          gte(appointments.scheduledAt, startOfDay),
          lte(appointments.scheduledAt, endOfDay),
        ),
      )
      .orderBy(PRIORITY_RANK, appointments.queueNumber);
  }

  async getQueueWithPatients(doctorId: string, date: Date = new Date()) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return db
      .select({
        id: appointments.id,
        patientId: appointments.patientId,
        doctorId: appointments.doctorId,
        scheduledAt: appointments.scheduledAt,
        queueNumber: appointments.queueNumber,
        status: appointments.status,
        priority: appointments.priority,
        priorityReason: appointments.priorityReason,
        priorityChangedBy: appointments.priorityChangedBy,
        priorityChangedAt: appointments.priorityChangedAt,
        createdAt: appointments.createdAt,
        patient: patients,
      })
      .from(appointments)
      .leftJoin(patients, eq(appointments.patientId, patients.id))
      .where(
        and(
          eq(appointments.doctorId, doctorId),
          gte(appointments.scheduledAt, startOfDay),
          lte(appointments.scheduledAt, endOfDay),
        ),
      )
      .orderBy(PRIORITY_RANK, appointments.queueNumber);
  }

  async updatePriority(
    id: string,
    dto: UpdateAppointmentPriorityDto,
    user?: any,
  ) {
    const [existing] = await db
      .select()
      .from(appointments)
      .where(eq(appointments.id, id));

    if (!existing) throw new BadRequestException('Appointment not found');

    const isRoutine = dto.priority === 'routine';
    const updateData = {
      priority: dto.priority,
      priorityReason: isRoutine ? null : (dto.reason ?? existing.priorityReason),
      priorityChangedBy: isRoutine ? null : (user?.id ?? existing.priorityChangedBy),
      priorityChangedAt: isRoutine ? null : new Date(),
    };

    const [appointment] = await db
      .update(appointments)
      .set(updateData)
      .where(eq(appointments.id, id))
      .returning();

    if (appointment) {
      const updatedQueue = await this.getQueueForDoctor(appointment.doctorId);
      this.gateway.emitQueueUpdate(appointment.doctorId, updatedQueue);
    }

    return appointment;
  }

  async updateStatus(id: string, status: string, userRole?: string) {
    const [existing] = await db
      .select()
      .from(appointments)
      .where(eq(appointments.id, id));

    if (!existing) throw new BadRequestException('Appointment not found');

    const allowed = VALID_TRANSITIONS[existing.status];
    if (!allowed || !allowed.includes(status)) {
      throw new BadRequestException(
        `Cannot transition from '${existing.status}' to '${status}'`,
      );
    }

    if (userRole) {
      const transitionKey = `${existing.status}_${status}`;
      const allowedRoles = ROLE_TRANSITIONS[transitionKey];
      if (allowedRoles && !allowedRoles.includes(userRole)) {
        throw new ForbiddenException(
          `Role '${userRole}' is not allowed to perform this status transition`,
        );
      }
    }

    const updateData: Record<string, unknown> = { status: status as any };
    if (status === 'checked_in') {
      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);
      if (existing.scheduledAt.getTime() > endOfToday.getTime()) {
        throw new BadRequestException('Cannot check in an appointment scheduled for a future day');
      }
      if (!existing.checkedInAt) {
        updateData.checkedInAt = new Date();
      }
    }
    if (status === 'in_progress' && !existing.startedAt) {
      updateData.startedAt = new Date();
    }
    if (existing.status === 'in_progress' && status === 'triaged') {
      updateData.returnedForRecheck = true;
    }

    const [appointment] = await db
      .update(appointments)
      .set(updateData)
      .where(eq(appointments.id, id))
      .returning();

    if (appointment) {
      const updatedQueue = await this.getQueueForDoctor(appointment.doctorId);
      this.gateway.emitQueueUpdate(appointment.doctorId, updatedQueue);
    }

    return appointment;
  }
}
