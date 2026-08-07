import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { db } from '../db';
import { users } from '../db/schema';
import { eq, sql } from 'drizzle-orm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  async create(dto: CreateUserDto) {
    const existing = await this.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const [newUser] = await db
      .insert(users)
      .values({
        email: dto.email,
        passwordHash,
        name: dto.name,
        phone: dto.phone ?? null,
        role: dto.role as any,
      })
      .returning();

    const { passwordHash: _, ...safeUser } = newUser;
    return safeUser;
  }

  async findByEmail(email: string) {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async findById(id: string) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async updateProfile(id: string, dto: UpdateProfileDto) {
    const [existing] = await db.select().from(users).where(eq(users.id, id));
    if (!existing) {
      throw new NotFoundException('User not found');
    }

    const [updated] = await db
      .update(users)
      .set({
        name: dto.name ?? existing.name,
        phone: dto.phone ?? existing.phone,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();

    const { passwordHash: _, ...safeUser } = updated;
    return safeUser;
  }

  async findAll() {
    const allUsers = await db.select().from(users);
    return allUsers.map(({ passwordHash, ...safe }) => safe);
  }

  async count() {
    const result = await db.select({ count: sql<number>`count(*)::int` }).from(users);
    return result[0]?.count ?? 0;
  }
}
