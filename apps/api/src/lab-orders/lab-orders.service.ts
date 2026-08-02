import { Injectable, NotFoundException } from '@nestjs/common';
import { db } from '../db';
import { labOrders, patients, users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { CreateLabOrderDto } from './dto/create-lab-order.dto';
import { UpdateLabOrderDto } from './dto/update-lab-order.dto';

@Injectable()
export class LabOrdersService {
  async create(dto: CreateLabOrderDto) {
    const [order] = await db
      .insert(labOrders)
      .values({
        patientId: dto.patientId,
        orderedByDoctorId: dto.orderedByDoctorId,
        testType: dto.testType,
      })
      .returning();
    return order;
  }

  private selectWithDetails() {
    return db
      .select({
        id: labOrders.id,
        visitId: labOrders.visitId,
        patientId: labOrders.patientId,
        orderedByDoctorId: labOrders.orderedByDoctorId,
        orderedByDoctorName: users.name,
        testType: labOrders.testType,
        status: labOrders.status,
        resultText: labOrders.resultText,
        resultPdfUrl: labOrders.resultPdfUrl,
        completedByLabTechId: labOrders.completedByLabTechId,
        createdAt: labOrders.createdAt,
        updatedAt: labOrders.updatedAt,
        patient: patients,
      })
      .from(labOrders)
      .leftJoin(patients, eq(labOrders.patientId, patients.id))
      .leftJoin(users, eq(labOrders.orderedByDoctorId, users.id));
  }

  async findAll() {
    return this.selectWithDetails();
  }

  async findPending() {
    return this.selectWithDetails().where(eq(labOrders.status, 'ordered'));
  }

  async findOne(id: string) {
    const [order] = await this.selectWithDetails().where(eq(labOrders.id, id));
    if (!order) throw new NotFoundException('Lab order not found');
    return order;
  }

  async findByPatient(patientId: string) {
    return this.selectWithDetails().where(eq(labOrders.patientId, patientId));
  }

  async update(id: string, dto: UpdateLabOrderDto) {
    const [existing] = await db
      .select()
      .from(labOrders)
      .where(eq(labOrders.id, id));
    if (!existing) throw new NotFoundException('Lab order not found');

    const [updated] = await db
      .update(labOrders)
      .set({
        ...(dto.status && { status: dto.status as any }),
        ...(dto.resultText && { resultText: dto.resultText }),
        ...(dto.completedByLabTechId && {
          completedByLabTechId: dto.completedByLabTechId,
        }),
        updatedAt: new Date(),
      })
      .where(eq(labOrders.id, id))
      .returning();
    return updated;
  }

  async updateResultFile(id: string, resultPdfUrl: string) {
    const [existing] = await db
      .select()
      .from(labOrders)
      .where(eq(labOrders.id, id));
    if (!existing) throw new NotFoundException('Lab order not found');

    const [updated] = await db
      .update(labOrders)
      .set({ resultPdfUrl, updatedAt: new Date() })
      .where(eq(labOrders.id, id))
      .returning();
    return updated;
  }
}
