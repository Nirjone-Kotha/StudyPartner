import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SavedService {
  constructor(private prisma: PrismaService) {}

  async getSaved(userId: string) {
    const saved = await this.prisma.savedPost.findMany({
      where: { userId },
      include: {
        post: {
          include: {
            user: { select: { id: true, name: true, handle: true, avatar: true, isAdmin: true } },
            _count: { select: { reactions: true, comments: true } },
            reactions: { where: { userId }, select: { type: true } },
            poll: {
              include: {
                options: { orderBy: { order: 'asc' } },
                votes: { where: { userId }, select: { pollOptionId: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return saved.map(s => s.post);
  }

  async savePost(userId: string, postId: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');
    await this.prisma.savedPost.upsert({
      where: { userId_postId: { userId, postId } },
      create: { userId, postId },
      update: {},
    });
    return { saved: true };
  }

  async unsavePost(userId: string, postId: string) {
    await this.prisma.savedPost.deleteMany({ where: { userId, postId } });
    return { saved: false };
  }

  async isPostSaved(userId: string, postId: string) {
    const s = await this.prisma.savedPost.findUnique({
      where: { userId_postId: { userId, postId } },
    });
    return { saved: !!s };
  }
}
