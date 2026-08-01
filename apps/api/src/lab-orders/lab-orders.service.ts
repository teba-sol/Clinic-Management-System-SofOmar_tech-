import { Injectable, NotFoundException } from '@nestjs/common';
import { db } from '../db';
import { labOrders } from '../db/schema';
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

  async findAll() {
    return db.select().from(labOrders);
  }

  async findPending() {
    return db.select().from(labOrders).where(eq(labOrders.status, 'ordered'));
  }

  async findByPatient(patientId: string) {
    return db.select().from(labOrders).where(eq(labOrders.patientId, patientId));
  }

  async update(id: string, dto: UpdateLabOrderDto) {
    const [existing] = await db.select().from(labOrders).where(eq(labOrders.id, id));
    if (!existing) throw new NotFoundException('Lab order not found');

    const [updated] = await db
      .update(labOrders)
      .set({
        ...(dto.status && { status: dto.status as any }),
        ...(dto.resultText && { resultText: dto.resultText }),
        ...(dto.completedByLabTechId && { completedByLabTechId: dto.completedByLabTechId }),
        updatedAt: new Date(),
      })
      .where(eq(labOrders.id, id))
      .returning();
    return updated;
  }
}
