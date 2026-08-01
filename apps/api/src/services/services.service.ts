import { Injectable, NotFoundException } from '@nestjs/common';
import { db } from '../db';
import { services } from '../db/schema';
import { eq } from 'drizzle-orm';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Injectable()
export class ServicesService {
  async create(dto: CreateServiceDto) {
    const [service] = await db
      .insert(services)
      .values({
        name: dto.name,
        category: dto.category,
        defaultPrice: dto.defaultPrice.toString(),
        active: dto.active ?? true,
      })
      .returning();
    return service;
  }

  async findAll() {
    return db.select().from(services).orderBy(services.name);
  }

  async findActive() {
    return db.select().from(services).where(eq(services.active, true)).orderBy(services.name);
  }

  async findOne(id: string) {
    const [service] = await db.select().from(services).where(eq(services.id, id));
    if (!service) throw new NotFoundException('Service not found');
    return service;
  }

  async update(id: string, dto: UpdateServiceDto) {
    await this.findOne(id);

    const updateData: Record<string, any> = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.category !== undefined) updateData.category = dto.category;
    if (dto.defaultPrice !== undefined) updateData.defaultPrice = dto.defaultPrice.toString();
    if (dto.active !== undefined) updateData.active = dto.active;
    updateData.updatedAt = new Date();

    const [updated] = await db
      .update(services)
      .set(updateData)
      .where(eq(services.id, id))
      .returning();
    return updated;
  }
}
