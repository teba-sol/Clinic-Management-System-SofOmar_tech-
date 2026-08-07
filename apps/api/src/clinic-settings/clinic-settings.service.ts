import { Injectable } from '@nestjs/common';
import { db } from '../db';
import { clinicSettings } from '../db/schema';
import { eq } from 'drizzle-orm';
import { UpdateClinicSettingsDto } from './dto/update-clinic-settings.dto';

@Injectable()
export class ClinicSettingsService {
  async get() {
    const [row] = await db.select().from(clinicSettings).where(eq(clinicSettings.id, 1));
    if (row) return row;

    const [created] = await db.insert(clinicSettings).values({ id: 1 }).returning();
    return created;
  }

  async update(dto: UpdateClinicSettingsDto) {
    await this.get();

    const [updated] = await db
      .update(clinicSettings)
      .set({ ...dto, updatedAt: new Date() })
      .where(eq(clinicSettings.id, 1))
      .returning();

    return updated;
  }
}
