import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { UsersService } from '../users/users.service';
import { db } from '../db';
import { refreshTokens } from '../db/schema';
import { eq, lt } from 'drizzle-orm';

const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

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
    const accessToken = this.jwtService.sign(payload, { expiresIn: ACCESS_TOKEN_TTL });

    const { refreshTokenPlain } = await this.createRefreshToken(user.id);

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
    let matchedRevoked = false;

    for (const t of tokens) {
      const matches = await bcrypt.compare(refreshTokenPlain, t.tokenHash);
      if (!matches) continue;
      if (t.revoked) {
        matchedRevoked = true;
      } else {
        matchedToken = t;
      }
      break;
    }

    if (matchedRevoked) {
      await this.revokeAllTokens(userId);
      throw new UnauthorizedException('Refresh token reused - all sessions revoked');
    }

    if (!matchedToken) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (new Date(matchedToken.expiresAt) < new Date()) {
      await this.revokeToken(matchedToken.id);
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const freshUser = await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.id, userId),
    });

    if (!freshUser) {
      throw new UnauthorizedException('User not found');
    }

    await this.deleteExpiredTokens();

    await this.revokeToken(matchedToken.id);

    const payload = { sub: freshUser.id, email: freshUser.email, role: freshUser.role };
    const accessToken = this.jwtService.sign(payload, { expiresIn: ACCESS_TOKEN_TTL });
    const { refreshTokenPlain: newRefreshToken } = await this.createRefreshToken(freshUser.id);

    return { accessToken, refreshToken: newRefreshToken };
  }

  async logout(refreshTokenPlain: string, userId: string) {
    const tokens = await db
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.userId, userId));

    for (const t of tokens) {
      if (t.revoked) continue;
      const matches = await bcrypt.compare(refreshTokenPlain, t.tokenHash);
      if (matches) {
        await this.revokeToken(t.id);
        return;
      }
    }
  }

  async bootstrapAdmin(dto: { email: string; password: string; name: string }) {
    const userCount = await this.usersService.count();
    if (userCount > 0) {
      throw new ForbiddenException('Bootstrap already completed');
    }
    return this.usersService.create({ ...dto, role: 'admin' });
  }

  private async createRefreshToken(userId: string) {
    const refreshTokenPlain = randomUUID();
    const hash = await bcrypt.hash(refreshTokenPlain, 10);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

    await db.insert(refreshTokens).values({
      userId,
      tokenHash: hash,
      expiresAt,
    });

    return { refreshTokenPlain, hash };
  }

  private async revokeToken(id: string) {
    await db.update(refreshTokens).set({ revoked: true }).where(eq(refreshTokens.id, id));
  }

  private async revokeAllTokens(userId: string) {
    await db.update(refreshTokens).set({ revoked: true }).where(eq(refreshTokens.userId, userId));
  }

  private async deleteExpiredTokens() {
    await db.delete(refreshTokens).where(lt(refreshTokens.expiresAt, new Date()));
  }
}
