import { Injectable, NotFoundException } from '@nestjs/common';
import { db } from '../db';
import { patients } from '../db/schema';
import { eq } from 'drizzle-orm';
import { CreatePatientDto } from './dto/create-patient.dto';

@Injectable()
export class PatientsService {
  private async generateMrn(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await db.select().from(patients);
    const next = (count.length + 1).toString().padStart(5, '0');
    return `MRN-${year}-${next}`;
  }

  async create(dto: CreatePatientDto) {
    const mrn = await this.generateMrn();
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
