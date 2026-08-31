import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

const PUBLIC_USER = {
  id: true, name: true, handle: true, avatar: true,
  bio: true, coverPhoto: true, location: true, institution: true,
  isPublic: true, friends: true, isAdmin: true, createdAt: true,
};

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        ...PUBLIC_USER,
        _count: { select: { followers: true, following: true } },
      },
    });
    if (!user) throw new NotFoundException();
    return {
      ...user,
      followersCount: user._count?.followers ?? 0,
      followingCount: user._count?.following ?? 0,
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.bio !== undefined && { bio: dto.bio }),
        ...(dto.avatar !== undefined && { avatar: dto.avatar }),
        ...(dto.coverPhoto !== undefined && { coverPhoto: dto.coverPhoto }),
        ...(dto.location !== undefined && { location: dto.location }),
        ...(dto.institution !== undefined && { institution: dto.institution }),
        ...(dto.isPublic !== undefined && { isPublic: dto.isPublic }),
      },
      select: {
        ...PUBLIC_USER,
        _count: { select: { followers: true, following: true } },
      },
    });
    return {
      ...user,
      followersCount: user._count?.followers ?? 0,
      followingCount: user._count?.following ?? 0,
    };
  }

  async getProfile(handle: string, requesterId?: string) {
    const user = await this.prisma.user.findUnique({
      where: { handle },
      select: {
        ...PUBLIC_USER,
        _count: { select: { posts: true, followers: true, following: true } },
        followers: requesterId ? { where: { followerId: requesterId }, select: { id: true } } : false,
      },
    });
    if (!user) throw new NotFoundException('User not found');
    const isFollowing = Array.isArray(user.followers) && user.followers.length > 0;
    return {
      ...user,
      followersCount: user._count?.followers ?? 0,
      followingCount: user._count?.following ?? 0,
      isFollowing,
    };
  }

  async toggleFollow(followerId: string, targetUserId: string) {
    if (followerId === targetUserId) {
      throw new BadRequestException('You cannot follow yourself');
    }
    const targetUser = await this.prisma.user.findUnique({ where: { id: targetUserId } });
    if (!targetUser) throw new NotFoundException('User not found');

    const existing = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId: targetUserId,
        },
      },
    });

    if (existing) {
      await this.prisma.follow.delete({
        where: { id: existing.id },
      });
      const followersCount = await this.prisma.follow.count({ where: { followingId: targetUserId } });
      return { following: false, followersCount };
    } else {
      await this.prisma.follow.create({
        data: {
          followerId,
          followingId: targetUserId,
        },
      });
      const followersCount = await this.prisma.follow.count({ where: { followingId: targetUserId } });
      return { following: true, followersCount };
    }
  }

  async getUserPosts(handle: string, userId?: string) {
    const user = await this.prisma.user.findUnique({ where: { handle } });
    if (!user) throw new NotFoundException('User not found');

    const rawPosts = await this.prisma.post.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 30,
      include: {
        user: { select: { id: true, name: true, handle: true, avatar: true, isAdmin: true } },
        _count: { select: { reactions: true, comments: true } },
        reactions: { select: { type: true, userId: true } },
        poll: {
          include: {
            options: { orderBy: { order: 'asc' } },
            votes: userId ? { where: { userId }, select: { pollOptionId: true } } : false,
          },
        },
      },
    });

    return rawPosts.map((p) => {
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
        reactions: myReaction ? [{ type: myReaction.type }] : [],
        reactionCounts,
      };
    });
  }

  async getContacts(userId: string) {
    return this.prisma.user.findMany({
      where: { id: { not: userId } },
      select: { id: true, name: true, handle: true, avatar: true },
      take: 10,
    });
  }

  async searchUsers(query: string, currentUserId: string) {
    if (!query || query.trim().length < 2) return [];
    const q = query.trim();
    return this.prisma.user.findMany({
      where: {
        id: { not: currentUserId },
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { handle: { contains: q, mode: 'insensitive' } },
          { bio: { contains: q, mode: 'insensitive' } },
          { location: { contains: q, mode: 'insensitive' } },
          { institution: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: { id: true, name: true, handle: true, avatar: true, bio: true, friends: true },
      take: 8,
      orderBy: { friends: 'desc' },
    });
  }

  async getUserFriends(handle: string, requesterId?: string) {
    const user = await this.prisma.user.findUnique({
      where: { handle },
      select: { id: true, isPublic: true, name: true },
    });
    if (!user) throw new NotFoundException('User not found');

    const isOwner = requesterId === user.id;

    // Check if requester is already friends with private profile
    let isFriend = false;
    if (requesterId && !isOwner) {
      const friendship = await this.prisma.friendship.findFirst({
        where: {
          OR: [
            { userAId: user.id, userBId: requesterId },
            { userAId: requesterId, userBId: user.id },
          ],
        },
      });
      isFriend = !!friendship;
    }

    if (!user.isPublic && !isOwner && !isFriend) {
      return { isPublic: false, friends: [], userName: user.name };
    }

    const friendships = await this.prisma.friendship.findMany({
      where: {
        OR: [{ userAId: user.id }, { userBId: user.id }],
      },
      include: {
        userA: { select: { id: true, name: true, handle: true, avatar: true, bio: true, friends: true, location: true, institution: true } },
        userB: { select: { id: true, name: true, handle: true, avatar: true, bio: true, friends: true, location: true, institution: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const friendList = friendships.map(f => (f.userAId === user.id ? f.userB : f.userA));
    return { isPublic: true, friends: friendList, userName: user.name };
  }
}

