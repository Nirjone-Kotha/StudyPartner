import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async getDashboardStats() {
    const [totalUsers, totalPosts, featuredPosts, openReports] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.post.count(),
      this.prisma.post.count({ where: { featured: true } }),
      this.prisma.report.count({ where: { status: 'PENDING' } }),
    ]);

    const recentPosts = await this.prisma.post.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true } } },
    });

    return { totalUsers, totalPosts, featuredPosts, openReports, recentPosts };
  }

  async getAllPosts(filter?: string) {
    const where: any = {};
    if (filter === 'featured') where.featured = true;
    if (filter === 'user') where.user = { isAdmin: false };

    return this.prisma.post.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, handle: true, isAdmin: true } },
        _count: { select: { reactions: true, comments: true } },
      },
    });
  }

  async toggleFeatured(postId: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');
    const updated = await this.prisma.post.update({
      where: { id: postId },
      data: { featured: !post.featured },
    });
    await this.redis.invalidate('feed:*');
    return updated;
  }

  async deletePost(postId: string) {
    await this.prisma.post.findUniqueOrThrow({ where: { id: postId } });
    await this.prisma.post.delete({ where: { id: postId } });
    await this.redis.invalidate('feed:*');
    return { success: true };
  }

  async getAllUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true, name: true, handle: true, avatar: true,
        isAdmin: true, friends: true, createdAt: true,
        _count: { select: { posts: true } },
      },
    });
  }

  async getReports() {
    return this.prisma.report.findMany({
      include: {
        post: { select: { id: true, text: true } },
        user: { select: { name: true, handle: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateReportStatus(reportId: string, status: 'REVIEWED' | 'DISMISSED') {
    return this.prisma.report.update({
      where: { id: reportId },
      data: { status },
    });
  }

  async publishFeaturedPost(userId: string, text: string, mediaUrl?: string, mediaType?: string) {
    const post = await this.prisma.post.create({
      data: {
        userId,
        text,
        mediaUrl,
        mediaType: mediaType as any,
        featured: true,
        type: 'TEXT',
      },
    });
    await this.redis.invalidate('feed:*');
    return post;
  }
}
