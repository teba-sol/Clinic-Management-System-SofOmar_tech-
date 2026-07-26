import { Injectable } from '@nestjs/common';
import { db } from '../db';
import { doctorSchedules } from '../db/schema';
import { eq } from 'drizzle-orm';
import { CreateScheduleDto } from './dto/create-schedule.dto';

@Injectable()
export class SchedulesService {
  async create(dto: CreateScheduleDto) {
    const [schedule] = await db
      .insert(doctorSchedules)
      .values({
        doctorId: dto.doctorId,
        dayOfWeek: dto.dayOfWeek as any,
        startTime: dto.startTime,
        endTime: dto.endTime,
        slotDurationMinutes: dto.slotDurationMinutes ?? 20,
      })
      .returning();
    return schedule;
  }

  async findByDoctor(doctorId: string) {
    return db.select().from(doctorSchedules).where(eq(doctorSchedules.doctorId, doctorId));
  }

  async findAll() {
    return db.select().from(doctorSchedules);
  }
}
