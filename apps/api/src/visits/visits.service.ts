import { Injectable, NotFoundException } from '@nestjs/common';
import { db } from '../db';
import { visits } from '../db/schema';
import { eq } from 'drizzle-orm';
import { CreateVisitDto } from './dto/create-visit.dto';

@Injectable()
export class VisitsService {
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
    return visit;
  }

  async findByPatient(patientId: string) {
    return db.select().from(visits).where(eq(visits.patientId, patientId));
  }

  async findOne(id: string) {
    const [visit] = await db.select().from(visits).where(eq(visits.id, id));
    if (!visit) throw new NotFoundException('Visit not found');
    return visit;
  }
}
