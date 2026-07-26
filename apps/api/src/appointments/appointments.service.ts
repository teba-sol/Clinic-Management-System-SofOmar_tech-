import { Injectable } from '@nestjs/common';
import { db } from '../db';
import { appointments } from '../db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { AppointmentsGateway } from './appointments.gateway';

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
}
