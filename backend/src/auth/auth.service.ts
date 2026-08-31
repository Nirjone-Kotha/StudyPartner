import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findFirst({
      where: { OR: [{ email: dto.email }, { handle: dto.handle }] },
    });
    if (existing) throw new ConflictException('Email or handle already taken');

    const hash = await bcrypt.hash(dto.password, 12);
    const AV = (seed: string) =>
      `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(seed)}&backgroundColor=EFEAFE,FFE7E0,FFF6DC`;

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        handle: dto.handle,
        password: hash,
        avatar: AV(dto.handle),
      },
      select: { id: true, email: true, name: true, handle: true, avatar: true, isAdmin: true },
    });

    return { user, token: this.sign(user.id, user.email) };
  }

  async login(dto: LoginDto) {
    await this.prisma.ensureSeedData().catch(() => {});

    const identifier = (dto.email || '').trim();
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: identifier, mode: 'insensitive' } },
          { handle: { equals: identifier, mode: 'insensitive' } },
        ],
      },
    });
    if (!user) throw new UnauthorizedException('Invalid email/handle or password');

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid email/handle or password');

    const { password: _, ...safe } = user;
    return { user: safe, token: this.sign(user.id, user.email) };
  }

  private sign(userId: string, email: string) {
    return this.jwt.sign({ sub: userId, email });
  }
}
