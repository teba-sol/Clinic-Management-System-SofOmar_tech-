import { Injectable, NotFoundException } from '@nestjs/common';
import { db } from '../db';
import { visits } from '../db/schema';
import { eq } from 'drizzle-orm';
import { CreateVisitDto } from './dto/create-visit.dto';
import { UpdateVisitDto } from './dto/update-visit.dto';
import { AppointmentsService } from '../appointments/appointments.service';

@Injectable()
export class VisitsService {
  constructor(private appointmentsService: AppointmentsService) {}

  async create(dto: CreateVisitDto) {
    const [visit] = await db
      .insert(visits)
      .values({
        appointmentId: dto.appointmentId,
        patientId: dto.patientId,
        doctorId: dto.doctorId,
        subjective: dto.subjective,
        objective: dto.objective,
        assessment: dto.assessment,
        plan: dto.plan,
        diagnosisCode: dto.diagnosisCode,
        diagnosisDescription: dto.diagnosisDescription,
      })
      .returning();

    const shouldComplete = dto.completeAppointment !== false;
    if (shouldComplete) {
      await this.tryCompleteAppointment(dto.appointmentId);
    }

    return visit;
  }

  async findAll() {
    return db.select().from(visits);
  }

  async findByPatient(patientId: string) {
    return db.select().from(visits).where(eq(visits.patientId, patientId));
  }

  async findOne(id: string) {
    const [visit] = await db.select().from(visits).where(eq(visits.id, id));
    if (!visit) throw new NotFoundException('Visit not found');
    return visit;
  }

  async update(id: string, dto: UpdateVisitDto) {
    const [existing] = await db.select().from(visits).where(eq(visits.id, id));
    if (!existing) throw new NotFoundException('Visit not found');

    const isSameDay =
      new Date(existing.createdAt).toDateString() === new Date().toDateString();

    if (dto.addendum !== undefined && !isSameDay) {
      const [visit] = await db
        .update(visits)
        .set({ addendum: dto.addendum, updatedAt: new Date() })
        .where(eq(visits.id, id))
        .returning();
      return visit;
    }

    if (!isSameDay) {
      const [visit] = await db
        .update(visits)
        .set({ addendum: dto.addendum || existing.addendum, updatedAt: new Date() })
        .where(eq(visits.id, id))
        .returning();
      return visit;
    }

    const updateData: Record<string, any> = { updatedAt: new Date() };
    const fields: (keyof UpdateVisitDto)[] = [
      'subjective', 'objective', 'assessment', 'plan',
      'diagnosisCode', 'diagnosisDescription', 'addendum',
    ];
    for (const field of fields) {
      if (dto[field] !== undefined) {
        updateData[field] = dto[field];
      }
    }

    const [visit] = await db
      .update(visits)
      .set(updateData)
      .where(eq(visits.id, id))
      .returning();

    const shouldComplete = dto.completeAppointment === true;
    if (shouldComplete) {
      await this.tryCompleteAppointment(visit.appointmentId);
    }

    return visit;
  }

  private async tryCompleteAppointment(appointmentId: string) {
    try {
      await this.appointmentsService.updateStatus(
        appointmentId,
        'completed',
        'doctor',
      );
    } catch {
      // appointment may already be completed or not in_progress — ignore
    }
  }
}
