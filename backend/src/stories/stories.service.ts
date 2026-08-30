import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStoryDto } from './dto/story.dto';

@Injectable()
export class StoriesService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Create ──────────────────────────────────────────────────────────────────

  async create(userId: string, isAdmin: boolean, dto: CreateStoryDto) {
    // Only admin may attach an image
    if (dto.imageUrl && !isAdmin) {
      throw new ForbiddenException('Only admins can attach images to stories.');
    }

    // Duration: admin = 72 h, user = 48 h
    const hours = isAdmin ? 72 : 48;
    const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);

    return this.prisma.story.create({
      data: {
        authorId:    userId,
        textContent: dto.textContent,
        bgColor:     dto.bgColor    ?? '#6366f1',
        textColor:   dto.textColor  ?? '#ffffff',
        fontStyle:   dto.fontStyle  ?? 'normal',
        fontSize:    dto.fontSize   ?? 'large',
        imageUrl:    isAdmin ? (dto.imageUrl ?? null) : null,
        expiresAt,
      },
      include: {
        author: {
          select: { id: true, name: true, handle: true, avatar: true, isAdmin: true },
        },
      },
    });
  }

  // ─── Feed (active stories grouped by author) ──────────────────────────────

  async getFeed(viewerId: string) {
    const now = new Date();

    // All active stories
    const stories = await this.prisma.story.findMany({
      where: { expiresAt: { gt: now } },
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: { id: true, name: true, handle: true, avatar: true, isAdmin: true } },
        views:  { where: { viewerId }, select: { id: true } },
        _count: { select: { views: true } },
      },
    });

    // Group by author
    const map = new Map<string, { author: any; stories: any[] }>();
    for (const s of stories) {
      if (!map.has(s.authorId)) {
        map.set(s.authorId, { author: s.author, stories: [] });
      }
      map.get(s.authorId)!.stories.push({
        ...s,
        viewed: s.views.length > 0,
        viewCount: s._count.views,
      });
    }

    return Array.from(map.values());
  }

  // ─── My own stories ───────────────────────────────────────────────────────

  async getMyStories(userId: string) {
    return this.prisma.story.findMany({
      where: { authorId: userId, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { views: true } } },
    });
  }

  // ─── Mark viewed ─────────────────────────────────────────────────────────

  async markViewed(storyId: string, viewerId: string) {
    const story = await this.prisma.story.findUnique({ where: { id: storyId } });
    if (!story || story.expiresAt < new Date()) {
      throw new NotFoundException('Story not found or expired.');
    }

    await this.prisma.storyView.upsert({
      where:  { storyId_viewerId: { storyId, viewerId } },
      create: { storyId, viewerId },
      update: {},
    });

    return { ok: true };
  }

  // ─── Delete ───────────────────────────────────────────────────────────────

  async delete(storyId: string, userId: string, isAdmin: boolean) {
    const story = await this.prisma.story.findUnique({ where: { id: storyId } });
    if (!story) throw new NotFoundException('Story not found.');
    if (story.authorId !== userId && !isAdmin) {
      throw new ForbiddenException('Not allowed.');
    }

    await this.prisma.story.delete({ where: { id: storyId } });
    return { ok: true };
  }

  // ─── Admin: all stories (including expired) ───────────────────────────────

  async adminGetAll() {
    return this.prisma.story.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: { id: true, name: true, handle: true, isAdmin: true } },
        _count: { select: { views: true } },
      },
    });
  }
}

