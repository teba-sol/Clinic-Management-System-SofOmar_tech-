import { Injectable, NotFoundException } from '@nestjs/common';
import { db } from '../db';
import { patients } from '../db/schema';
import { eq, sql } from 'drizzle-orm';
import { CreatePatientDto } from './dto/create-patient.dto';

@Injectable()
export class PatientsService {
  private async generateMrn(): Promise<string> {
    const year = new Date().getFullYear();
    const rows = await db
      .select({ mrn: patients.mrn })
      .from(patients)
      .where(sql`${patients.mrn} LIKE ${`MRN-${year}-%`}`);

    let maxSeq = 0;
    for (const row of rows) {
      const match = /^MRN-\d{4}-(\d+)$/.exec(row.mrn);
      if (match) {
        const seq = parseInt(match[1], 10);
        if (seq > maxSeq) maxSeq = seq;
      }
    }
    const next = (maxSeq + 1).toString().padStart(5, '0');
    return `MRN-${year}-${next}`;
  }

  async create(dto: CreatePatientDto) {
    for (let attempt = 0; attempt < 5; attempt++) {
      const mrn = await this.generateMrn();
      try {
        const [patient] = await db
          .insert(patients)
          .values({
            mrn,
            firstName: dto.firstName,
            lastName: dto.lastName,
            dateOfBirth: dto.dateOfBirth,
            gender: dto.gender as any,
            phone: dto.phone,
            email: dto.email,
            address: dto.address,
            bloodGroup: (dto.bloodGroup as any) ?? 'unknown',
            allergies: dto.allergies,
            chronicConditions: dto.chronicConditions,
            emergencyContactName: dto.emergencyContactName,
            emergencyContactPhone: dto.emergencyContactPhone,
          })
          .returning();
        return patient;
      } catch (err) {
        const code = (err as { code?: string })?.code;
        if (code === '23505') continue;
        throw err;
      }
    }
    throw new Error('Could not generate a unique MRN. Please try again.');
  }

  async findAll() {
    return db.select().from(patients);
  }

  async findOne(id: string) {
    const [patient] = await db.select().from(patients).where(eq(patients.id, id));
    if (!patient) throw new NotFoundException('Patient not found');
    return patient;
  }
}
