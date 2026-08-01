import { Injectable, NotFoundException } from '@nestjs/common';
import { db } from '../db';
import { diagnosisCodes } from '../db/schema';
import { eq, or, ilike, and } from 'drizzle-orm';
import { CreateDiagnosisCodeDto } from './dto/create-diagnosis-code.dto';
import { UpdateDiagnosisCodeDto } from './dto/update-diagnosis-code.dto';

@Injectable()
export class DiagnosisCodesService {
  async create(dto: CreateDiagnosisCodeDto) {
    const [code] = await db
      .insert(diagnosisCodes)
      .values({
        code: dto.code,
        description: dto.description,
        category: dto.category,
      })
      .returning();
    return code;
  }

  async findAll() {
    return db.select().from(diagnosisCodes).orderBy(diagnosisCodes.code);
  }

  async findActive() {
    return db
      .select()
      .from(diagnosisCodes)
      .where(eq(diagnosisCodes.active, true))
      .orderBy(diagnosisCodes.code);
  }

  async search(query: string) {
    const pattern = `%${query}%`;
    return db
      .select()
      .from(diagnosisCodes)
      .where(
        and(
          eq(diagnosisCodes.active, true),
          or(
            ilike(diagnosisCodes.code, pattern),
            ilike(diagnosisCodes.description, pattern),
            ...(query.length > 2
              ? [ilike(diagnosisCodes.category ?? '', pattern)]
              : []),
          ),
        ),
      )
      .orderBy(diagnosisCodes.code)
      .limit(20);
  }

  async findOne(id: string) {
    const [code] = await db
      .select()
      .from(diagnosisCodes)
      .where(eq(diagnosisCodes.id, id));
    if (!code) throw new NotFoundException('Diagnosis code not found');
    return code;
  }

  async update(id: string, dto: UpdateDiagnosisCodeDto) {
    await this.findOne(id);

    const updateData: Record<string, any> = {};
    if (dto.code !== undefined) updateData.code = dto.code;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.category !== undefined) updateData.category = dto.category;
    if (dto.active !== undefined) updateData.active = dto.active;
    updateData.updatedAt = new Date();

    const [updated] = await db
      .update(diagnosisCodes)
      .set(updateData)
      .where(eq(diagnosisCodes.id, id))
      .returning();
    return updated;
  }
}
