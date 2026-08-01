import { Injectable, NotFoundException } from '@nestjs/common';
import { db } from '../db';
import { prescriptions, patients, users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { generatePrescriptionPdf } from './utils/generate-prescription-pdf';

@Injectable()
export class PrescriptionsService {
  async findAll() {
    return db.select().from(prescriptions).orderBy(prescriptions.createdAt);
  }

  async create(dto: CreatePrescriptionDto) {
    const [prescription] = await db
      .insert(prescriptions)
      .values({
        visitId: dto.visitId,
        patientId: dto.patientId,
        doctorId: dto.doctorId,
        items: dto.items,
      })
      .returning();
    return prescription;
  }

  async generatePdf(id: string): Promise<Buffer> {
    const [prescription] = await db.select().from(prescriptions).where(eq(prescriptions.id, id));
    if (!prescription) throw new NotFoundException('Prescription not found');

    const [patient] = await db.select().from(patients).where(eq(patients.id, prescription.patientId));
    const [doctor] = await db.select().from(users).where(eq(users.id, prescription.doctorId));

    return generatePrescriptionPdf({
      patientName: `${patient.firstName} ${patient.lastName}`,
      doctorName: doctor.name,
      date: new Date(prescription.createdAt).toLocaleDateString(),
      items: prescription.items as any,
    });
  }

  async findByPatient(patientId: string) {
    return db.select().from(prescriptions).where(eq(prescriptions.patientId, patientId));
  }
}
