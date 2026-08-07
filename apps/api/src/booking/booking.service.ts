import { Injectable, BadRequestException } from '@nestjs/common';
import { db } from '../db';
import { bookingRequests, users } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import { CreateBookingRequestDto } from './dto/create-booking-request.dto';

const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ['contacted', 'converted', 'declined'],
  contacted: ['converted', 'declined'],
  converted: [],
  declined: [],
};

@Injectable()
export class BookingService {
  async create(dto: CreateBookingRequestDto) {
    const preferred = new Date(dto.preferredDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (isNaN(preferred.getTime())) {
      throw new BadRequestException('Invalid preferred date');
    }
    if (preferred.getTime() < today.getTime()) {
      throw new BadRequestException('Preferred date cannot be in the past');
    }

    const [request] = await db
      .insert(bookingRequests)
      .values({
        name: dto.name,
        phone: dto.phone,
        email: dto.email ?? null,
        department: dto.department,
        preferredDate: dto.preferredDate,
        preferredTime: dto.preferredTime,
        doctorId: dto.doctorId ?? null,
        reason: dto.reason ?? null,
      })
      .returning();

    return {
      id: request.id,
      reference: request.id.slice(0, 8),
      name: request.name,
      phone: request.phone,
      department: request.department,
      preferredDate: request.preferredDate,
      preferredTime: request.preferredTime,
      status: request.status,
    };
  }

  async findAll() {
    const rows = await db
      .select({
        id: bookingRequests.id,
        name: bookingRequests.name,
        phone: bookingRequests.phone,
        email: bookingRequests.email,
        department: bookingRequests.department,
        preferredDate: bookingRequests.preferredDate,
        preferredTime: bookingRequests.preferredTime,
        doctorId: bookingRequests.doctorId,
        doctorName: users.name,
        reason: bookingRequests.reason,
        status: bookingRequests.status,
        createdAt: bookingRequests.createdAt,
        updatedAt: bookingRequests.updatedAt,
      })
      .from(bookingRequests)
      .leftJoin(users, eq(bookingRequests.doctorId, users.id))
      .orderBy(desc(bookingRequests.createdAt));

    return rows;
  }

  async updateStatus(id: string, status: string) {
    const [existing] = await db
      .select()
      .from(bookingRequests)
      .where(eq(bookingRequests.id, id));

    if (!existing) throw new BadRequestException('Booking request not found');

    const allowed = VALID_TRANSITIONS[existing.status];
    if (!allowed || !allowed.includes(status)) {
      throw new BadRequestException(
        `Cannot transition from '${existing.status}' to '${status}'`,
      );
    }

    const [updated] = await db
      .update(bookingRequests)
      .set({ status: status as any, updatedAt: new Date() })
      .where(eq(bookingRequests.id, id))
      .returning();

    return updated;
  }
}
