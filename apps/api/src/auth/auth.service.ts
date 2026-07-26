import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { UsersService } from '../users/users.service';
import { db } from '../db';
import { refreshTokens } from '../db/schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });

    const refreshTokenPlain = randomUUID();
    const refreshTokenHash = await bcrypt.hash(refreshTokenPlain, 10);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await db.insert(refreshTokens).values({
      userId: user.id,
      tokenHash: refreshTokenHash,
      expiresAt,
    });

    return {
      accessToken,
      refreshToken: refreshTokenPlain,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async refresh(refreshTokenPlain: string, userId: string) {
    const tokens = await db
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.userId, userId));

    let matchedToken: typeof tokens[number] | null = null;
    for (const t of tokens) {
      if (t.revoked || new Date(t.expiresAt) < new Date()) continue;
      const matches = await bcrypt.compare(refreshTokenPlain, t.tokenHash);
      if (matches) {
        matchedToken = t;
        break;
      }
    }

    if (!matchedToken) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const freshUser = await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.id, userId),
    });

    if (!freshUser) {
      throw new UnauthorizedException('User not found');
    }

    const payload = { sub: freshUser.id, email: freshUser.email, role: freshUser.role };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });

    return { accessToken };
  }
}
