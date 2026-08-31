import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { QueuesService } from '../queues/queues.service';
import {
  CreatePostDto, CreatePollDto, VotePollDto, ReactDto,
  CreateCommentDto, CreateReportDto,
} from './dto/posts.dto';

const FEED_CACHE_TTL = 30; // seconds

function containsLink(text?: string): boolean {
  if (!text) return false;
  const linkRegex = /(https?:\/\/|www\.|\b[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?)/i;
  return linkRegex.test(text);
}

@Injectable()
export class PostsService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private queues: QueuesService,
  ) {}

  private postSelect(userId?: string) {
    return {
      id: true, text: true, mediaUrl: true, mediaType: true,
      explanation: true, featured: true, pinned: true, type: true, createdAt: true,
      user: {
        select: {
          id: true, name: true, handle: true, avatar: true, isAdmin: true,
          _count: { select: { followers: true } },
          followers: userId ? { where: { followerId: userId }, select: { id: true } } : false,
        },
      },
      _count: { select: { reactions: true, comments: true } },
      reactions: { select: { type: true, userId: true } },
      poll: {
        select: {
          id: true, question: true, correctAnswer: true,
          options: { select: { id: true, label: true, votes: true, order: true }, orderBy: { order: 'asc' as const } },
          votes: userId ? { where: { userId }, select: { pollOptionId: true } } : false,
        },
      },
    } as any;
  }

  private formatPostUser(p: any, userId?: string) {
    if (!p) return p;
    const reactionCounts: Record<string, number> = {
      LIKE: 0,
      LOVE: 0,
      HAHA: 0,
      WOW: 0,
      SAD: 0,
    };
    if (Array.isArray(p.reactions)) {
      p.reactions.forEach((r: any) => {
        if (reactionCounts[r.type] !== undefined) {
          reactionCounts[r.type]++;
        }
      });
    }

    const myReaction = userId && Array.isArray(p.reactions)
      ? p.reactions.find((r: any) => r.userId === userId)
      : null;

    return {
      ...p,
      user: p.user ? {
        ...p.user,
        followersCount: p.user._count?.followers ?? 0,
        isFollowing: Array.isArray(p.user.followers) && p.user.followers.length > 0,
      } : p.user,
      reactions: myReaction ? [{ type: myReaction.type }] : [],
      reactionCounts,
    };
  }

  async getFeed(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const cacheKey = `feed:${userId}:${page}:${limit}`;

    if (page === 1) {
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed && Array.isArray(parsed.posts) && parsed.posts.length > 0) {
            return parsed;
          }
        } catch {
          // ignore corrupted cache
        }
      }
    }

    let rawPosts = await this.prisma.post.findMany({
      skip,
      take: limit,
      orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
      select: this.postSelect(userId),
    });

    if (rawPosts.length === 0 && page === 1) {
      await this.prisma.ensureSeedData().catch(() => {});
      rawPosts = await this.prisma.post.findMany({
        skip,
        take: limit,
        orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
        select: this.postSelect(userId),
      });
    }

    const posts = rawPosts.map(p => this.formatPostUser(p, userId));
    const result = { posts, page, limit };
    if (page === 1 && posts.length > 0) {
      await this.redis.set(cacheKey, JSON.stringify(result), FEED_CACHE_TTL);
    }
    return result;
  }

  async createPost(userId: string, dto: CreatePostDto) {
    if (!dto.text && !dto.mediaUrl) {
      throw new BadRequestException('Post must have text or media');
    }
    if (containsLink(dto.text) || containsLink(dto.explanation)) {
      throw new BadRequestException('Links and URLs are not allowed in posts.');
    }
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { isAdmin: true } });
    const post = await this.prisma.post.create({
      data: {
        userId,
        text: dto.text,
        mediaUrl: dto.mediaUrl,
        mediaType: dto.mediaType as any,
        explanation: dto.explanation,
        featured: user?.isAdmin && dto.featured ? true : false,
        pinned: user?.isAdmin && dto.pinned ? true : false,
        type: 'TEXT',
      },
      select: this.postSelect(userId),
    });
    await this.redis.invalidate('feed:*');
    return post;
  }

  async createPoll(userId: string, dto: CreatePollDto) {
    if (
      containsLink(dto.question) ||
      containsLink(dto.explanation) ||
      dto.options.some(opt => containsLink(opt))
    ) {
      throw new BadRequestException('Links and URLs are not allowed in poll questions or options.');
    }
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { isAdmin: true } });
    const post = await this.prisma.post.create({
      data: {
        userId,
        type: 'POLL',
        explanation: dto.explanation,
        featured: user?.isAdmin && dto.featured ? true : false,
        pinned: user?.isAdmin && dto.pinned ? true : false,
        poll: {
          create: {
            question: dto.question,
            correctAnswer: dto.correctAnswer,
            options: {
              create: dto.options.map((label, order) => ({ label, order, votes: 0 })),
            },
          },
        },
      },
      select: this.postSelect(userId),
    });
    await this.redis.invalidate('feed:*');
    return post;
  }

  async votePoll(postId: string, userId: string, dto: VotePollDto) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: { poll: { include: { options: true } } },
    });
    if (!post || post.type !== 'POLL' || !post.poll) {
      throw new NotFoundException('Poll not found');
    }

    const existingVote = await this.prisma.pollVote.findUnique({
      where: { pollId_userId: { pollId: post.poll.id, userId } },
    });
    if (existingVote) {
      throw new BadRequestException('You have already voted on this poll');
    }

    const option = post.poll.options[dto.optionIndex];
    if (!option) {
      throw new BadRequestException('Invalid poll option index');
    }

    await this.prisma.$transaction([
      this.prisma.pollVote.create({
        data: { pollId: post.poll.id, userId, pollOptionId: option.id },
      }),
      this.prisma.pollOption.update({
        where: { id: option.id },
        data: { votes: { increment: 1 } },
      }),
    ]);

    // Queue notification job
    await this.queues.addNotificationJob({ type: 'POLL_VOTE', postId, userId });

    await this.redis.invalidate('feed:*');
    return this.getPostById(postId, userId);
  }

  async reactToPost(postId: string, userId: string, dto: ReactDto) {
    await this.prisma.post.findUniqueOrThrow({ where: { id: postId } });

    const existing = await this.prisma.postReaction.findUnique({
      where: { postId_userId: { postId, userId } },
    });

    if (existing?.type === dto.type) {
      await this.prisma.postReaction.delete({ where: { postId_userId: { postId, userId } } });
    } else if (existing) {
      await this.prisma.postReaction.update({
        where: { postId_userId: { postId, userId } },
        data: { type: dto.type },
      });
    } else {
      await this.prisma.postReaction.create({ data: { postId, userId, type: dto.type } });
    }

    await this.redis.invalidate('feed:*');
    return this.getPostById(postId, userId);
  }

  async addComment(postId: string, userId: string, dto: CreateCommentDto) {
    if (containsLink(dto.text)) {
      throw new BadRequestException('Links and URLs are not allowed in comments.');
    }
    await this.prisma.post.findUniqueOrThrow({ where: { id: postId } });
    const comment = await this.prisma.comment.create({
      data: { postId, userId, text: dto.text },
      include: { user: { select: { id: true, name: true, avatar: true, handle: true } } },
    });
    return comment;
  }

  async getComments(postId: string) {
    return this.prisma.comment.findMany({
      where: { postId },
      include: { user: { select: { id: true, name: true, avatar: true, handle: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async reportPost(postId: string, userId: string, dto: CreateReportDto) {
    await this.prisma.post.findUniqueOrThrow({ where: { id: postId } });
    return this.prisma.report.create({
      data: { postId, userId, reason: dto.reason },
    });
  }

  async getPostById(postId: string, userId?: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: this.postSelect(userId),
    });
    if (!post) throw new NotFoundException('Post not found');
    return this.formatPostUser(post, userId);
  }

  async deletePost(postId: string, userId: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');
    if (post.userId !== userId) throw new BadRequestException('Not your post');
    await this.prisma.post.delete({ where: { id: postId } });
    await this.redis.invalidate('feed:*');
    return { success: true };
  }
}
