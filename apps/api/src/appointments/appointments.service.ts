import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { db } from '../db';
import { appointments, patients } from '../db/schema';
import { eq, and, gte, lte, inArray } from 'drizzle-orm';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { AppointmentsGateway } from './appointments.gateway';

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
      );
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
      );
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
      .orderBy(appointments.queueNumber);
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

    const [appointment] = await db
      .update(appointments)
      .set({ status: status as any })
      .where(eq(appointments.id, id))
      .returning();

    if (appointment) {
      const updatedQueue = await this.getQueueForDoctor(appointment.doctorId);
      this.gateway.emitQueueUpdate(appointment.doctorId, updatedQueue);
    }

    return appointment;
  }
}
