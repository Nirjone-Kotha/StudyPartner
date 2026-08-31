import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateGroupDto, InviteMembersDto, CreateGroupPostDto } from './dto/groups.dto';

function containsLink(text?: string): boolean {
  if (!text) return false;
  const linkRegex = /(https?:\/\/|www\.|\b[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?)/i;
  return linkRegex.test(text);
}

@Injectable()
export class GroupsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  private postSelect(userId?: string) {
    return {
      id: true, text: true, mediaUrl: true, mediaType: true,
      explanation: true, featured: true, pinned: true, type: true, createdAt: true,
      groupId: true,
      group: {
        select: {
          id: true,
          name: true,
          category: true,
          avatar: true,
          isPrivate: true,
          members: userId ? { where: { userId }, select: { role: true } } : false,
        },
      },
      user: { select: { id: true, name: true, handle: true, avatar: true, isAdmin: true } },
      _count: { select: { reactions: true, comments: true } },
      reactions: userId ? { where: { userId }, select: { type: true } } : false,
      savedBy: userId ? { where: { userId }, select: { id: true } } : false,
      poll: {
        select: {
          id: true, question: true, correctAnswer: true,
          options: { select: { id: true, label: true, votes: true, order: true }, orderBy: { order: 'asc' as const } },
          votes: userId ? { where: { userId }, select: { pollOptionId: true } } : false,
        },
      },
    } as any;
  }

  async createGroup(userId: string, dto: CreateGroupDto) {
    const group = await this.prisma.group.create({
      data: {
        name: dto.name,
        description: dto.description,
        category: dto.category || 'General',
        coverImage: dto.coverImage,
        avatar: dto.avatar,
        isPrivate: dto.isPrivate || false,
        creatorId: userId,
        members: {
          create: {
            userId,
            role: 'ADMIN',
          },
        },
      },
      include: {
        creator: { select: { id: true, name: true, handle: true, avatar: true } },
        _count: { select: { members: true, posts: true } },
      },
    });

    return {
      ...group,
      isMember: true,
      myRole: 'ADMIN',
    };
  }

  async getDiscoverGroups(userId: string) {
    const groups = await this.prisma.group.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        creator: { select: { id: true, name: true, handle: true, avatar: true } },
        members: {
          where: { userId },
          select: { role: true },
        },
        _count: { select: { members: true, posts: true } },
      },
    });

    return groups.map(g => ({
      id: g.id,
      name: g.name,
      description: g.description,
      category: g.category,
      coverImage: g.coverImage,
      avatar: g.avatar,
      isPrivate: g.isPrivate,
      createdAt: g.createdAt,
      creator: g.creator,
      membersCount: g._count.members,
      postsCount: g._count.posts,
      isMember: g.members.length > 0,
      myRole: g.members[0]?.role || null,
    }));
  }

  async getMyGroups(userId: string) {
    const memberships = await this.prisma.groupMember.findMany({
      where: { userId },
      include: {
        group: {
          include: {
            creator: { select: { id: true, name: true, handle: true, avatar: true } },
            _count: { select: { members: true, posts: true } },
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    return memberships.map(m => ({
      id: m.group.id,
      name: m.group.name,
      description: m.group.description,
      category: m.group.category,
      coverImage: m.group.coverImage,
      avatar: m.group.avatar,
      isPrivate: m.group.isPrivate,
      createdAt: m.group.createdAt,
      creator: m.group.creator,
      membersCount: m.group._count.members,
      postsCount: m.group._count.posts,
      isMember: true,
      myRole: m.role,
    }));
  }

  async getGroupById(groupId: string, userId: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: {
        creator: { select: { id: true, name: true, handle: true, avatar: true } },
        members: {
          where: { userId },
          select: { role: true },
        },
        _count: { select: { members: true, posts: true } },
      },
    });

    if (!group) throw new NotFoundException('Group not found');

    return {
      id: group.id,
      name: group.name,
      description: group.description,
      category: group.category,
      coverImage: group.coverImage,
      avatar: group.avatar,
      isPrivate: group.isPrivate,
      createdAt: group.createdAt,
      creator: group.creator,
      membersCount: group._count.members,
      postsCount: group._count.posts,
      isMember: group.members.length > 0,
      myRole: group.members[0]?.role || null,
    };
  }

  async joinGroup(groupId: string, userId: string) {
    const group = await this.prisma.group.findUnique({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Group not found');

    const existing = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });
    if (existing) throw new BadRequestException('Already a member of this group');

    await this.prisma.groupMember.create({
      data: {
        groupId,
        userId,
        role: 'MEMBER',
      },
    });

    // Notify group creator
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
    if (group.creatorId !== userId) {
      await this.notifications.createNotification({
        userId: group.creatorId,
        actorId: userId,
        type: 'GROUP_INVITE',
        title: 'New Group Member',
        message: `${user?.name || 'Someone'} joined your group "${group.name}"`,
        targetUrl: `/groups/${group.id}`,
      });
    }

    return this.getGroupById(groupId, userId);
  }

  async leaveGroup(groupId: string, userId: string) {
    const member = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });
    if (!member) throw new BadRequestException('Not a member of this group');

    const group = await this.prisma.group.findUnique({ where: { id: groupId } });
    if (group?.creatorId === userId) {
      const otherMembers = await this.prisma.groupMember.count({ where: { groupId, userId: { not: userId } } });
      if (otherMembers > 0) {
        // Transfer admin role to the oldest member
        const nextAdmin = await this.prisma.groupMember.findFirst({
          where: { groupId, userId: { not: userId } },
          orderBy: { joinedAt: 'asc' },
        });
        if (nextAdmin) {
          await this.prisma.groupMember.update({
            where: { id: nextAdmin.id },
            data: { role: 'ADMIN' },
          });
        }
      }
    }

    await this.prisma.groupMember.delete({
      where: { groupId_userId: { groupId, userId } },
    });

    return { success: true };
  }

  async getGroupMembers(groupId: string) {
    const members = await this.prisma.groupMember.findMany({
      where: { groupId },
      include: {
        user: { select: { id: true, name: true, handle: true, avatar: true, bio: true, friends: true, isAdmin: true } },
      },
      orderBy: [{ role: 'asc' }, { joinedAt: 'asc' }],
    });

    return members.map(m => ({
      id: m.id,
      role: m.role,
      joinedAt: m.joinedAt,
      user: m.user,
    }));
  }

  async inviteMembers(groupId: string, inviterId: string, dto: InviteMembersDto) {
    const group = await this.prisma.group.findUnique({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Group not found');

    const inviter = await this.prisma.user.findUnique({ where: { id: inviterId }, select: { name: true } });

    for (const targetUserId of dto.userIds) {
      const isMember = await this.prisma.groupMember.findUnique({
        where: { groupId_userId: { groupId, userId: targetUserId } },
      });
      if (!isMember) {
        await this.notifications.createNotification({
          userId: targetUserId,
          actorId: inviterId,
          type: 'GROUP_INVITE',
          title: 'Group Invitation',
          message: `${inviter?.name || 'A friend'} invited you to join "${group.name}"`,
          targetUrl: `/groups/${group.id}`,
        });
      }
    }

    return { success: true, count: dto.userIds.length };
  }

  async getGroupPosts(groupId: string, userId: string) {
    const group = await this.prisma.group.findUnique({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Group not found');

    if (group.isPrivate) {
      const isMember = await this.prisma.groupMember.findUnique({
        where: { groupId_userId: { groupId, userId } },
      });
      if (!isMember) throw new ForbiddenException('This group is private. Join to view posts.');
    }

    return this.prisma.post.findMany({
      where: { groupId },
      orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
      select: this.postSelect(userId),
    });
  }

  async createGroupPost(groupId: string, userId: string, dto: CreateGroupPostDto) {
    const group = await this.prisma.group.findUnique({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Group not found');

    const member = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });
    if (!member) throw new ForbiddenException('You must be a member to post in this group');

    if (dto.poll) {
      if (
        containsLink(dto.poll.question) ||
        containsLink(dto.explanation) ||
        dto.poll.options.some(opt => containsLink(opt))
      ) {
        throw new BadRequestException('Links and URLs are not allowed in group posts or polls.');
      }
      const post = await this.prisma.post.create({
        data: {
          userId,
          groupId,
          shareToFeed: dto.shareToFeed ?? false,
          type: 'POLL',
          explanation: dto.explanation,
          poll: {
            create: {
              question: dto.poll.question,
              correctAnswer: dto.poll.correctAnswer,
              options: {
                create: dto.poll.options.map((label, order) => ({ label, order, votes: 0 })),
              },
            },
          },
        },
        select: this.postSelect(userId),
      });
      return post;
    }

    if (containsLink(dto.text) || containsLink(dto.explanation)) {
      throw new BadRequestException('Links and URLs are not allowed in group posts.');
    }

    const post = await this.prisma.post.create({
      data: {
        userId,
        groupId,
        shareToFeed: dto.shareToFeed ?? false,
        text: dto.text,
        mediaUrl: dto.mediaUrl,
        mediaType: dto.mediaType as any,
        explanation: dto.explanation,
        type: 'TEXT',
      },
      select: this.postSelect(userId),
    });

    return post;
  }
}
