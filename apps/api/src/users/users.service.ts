import { Injectable, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { CreateUserDto } from './dto/create-user.dto';

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

  async findAll() {
    const allUsers = await db.select().from(users);
    return allUsers.map(({ passwordHash, ...safe }) => safe);
  }
}
