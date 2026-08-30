import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FriendsService {
  constructor(private prisma: PrismaService) {}

  async getSuggestions(userId: string) {
    // All users not yet friends and no pending request
    const [friendships, sentReqs, receivedReqs, blocks] = await Promise.all([
      this.prisma.friendship.findMany({
        where: { OR: [{ userAId: userId }, { userBId: userId }] },
        select: { userAId: true, userBId: true },
      }),
      this.prisma.friendRequest.findMany({
        where: { senderId: userId },
        select: { receiverId: true },
      }),
      this.prisma.friendRequest.findMany({
        where: { receiverId: userId, status: 'PENDING' },
        select: { senderId: true },
      }),
      this.prisma.userBlock.findMany({
        where: { OR: [{ blockerId: userId }, { blockedId: userId }] },
        select: { blockerId: true, blockedId: true },
      }),
    ]);

    const excludeIds = new Set<string>([userId]);
    friendships.forEach(f => { excludeIds.add(f.userAId); excludeIds.add(f.userBId); });
    sentReqs.forEach(r => excludeIds.add(r.receiverId));
    receivedReqs.forEach(r => excludeIds.add(r.senderId));
    blocks.forEach(b => { excludeIds.add(b.blockerId); excludeIds.add(b.blockedId); });

    return this.prisma.user.findMany({
      where: { id: { notIn: [...excludeIds] } },
      select: { id: true, name: true, handle: true, avatar: true, bio: true, friends: true },
      take: 20,
    });
  }

  async getPendingRequests(userId: string) {
    return this.prisma.friendRequest.findMany({
      where: { receiverId: userId, status: 'PENDING' },
      include: {
        sender: { select: { id: true, name: true, handle: true, avatar: true, bio: true, friends: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getSentRequests(userId: string) {
    return this.prisma.friendRequest.findMany({
      where: { senderId: userId, status: 'PENDING' },
      include: {
        receiver: { select: { id: true, name: true, handle: true, avatar: true, bio: true, friends: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getFriends(userId: string) {
    const friendships = await this.prisma.friendship.findMany({
      where: { OR: [{ userAId: userId }, { userBId: userId }] },
      include: {
        userA: { select: { id: true, name: true, handle: true, avatar: true, bio: true, friends: true } },
        userB: { select: { id: true, name: true, handle: true, avatar: true, bio: true, friends: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return friendships.map(f => (f.userAId === userId ? f.userB : f.userA));
  }

  async sendRequest(senderId: string, receiverId: string) {
    if (senderId === receiverId) throw new BadRequestException('Cannot send request to yourself');

    const receiver = await this.prisma.user.findUnique({ where: { id: receiverId } });
    if (!receiver) throw new NotFoundException('User not found');

    // Check block
    const block = await this.prisma.userBlock.findFirst({
      where: {
        OR: [
          { blockerId: receiverId, blockedId: senderId, type: { in: ['FRIEND', 'ALL'] } },
          { blockerId: senderId, blockedId: receiverId, type: { in: ['FRIEND', 'ALL'] } },
        ],
      },
    });
    if (block) {
      if (block.blockerId === receiverId) {
        throw new BadRequestException('Cannot send friend request to this user.');
      } else {
        throw new BadRequestException('You have blocked this user. Unblock first.');
      }
    }

    const existing = await this.prisma.friendship.findFirst({
      where: {
        OR: [
          { userAId: senderId, userBId: receiverId },
          { userAId: receiverId, userBId: senderId },
        ],
      },
    });
    if (existing) throw new BadRequestException('Already friends');

    const existingReq = await this.prisma.friendRequest.findFirst({
      where: {
        OR: [
          { senderId, receiverId },
          { senderId: receiverId, receiverId: senderId },
        ],
        status: 'PENDING',
      },
    });
    if (existingReq) throw new BadRequestException('Friend request already exists');
    const request = await this.prisma.friendRequest.create({
      data: { senderId, receiverId },
      include: {
        receiver: { select: { id: true, name: true, handle: true, avatar: true } },
      },
    });

    // Send notification to receiver
    const sender = await this.prisma.user.findUnique({
      where: { id: senderId },
      select: { name: true, handle: true },
    });

    await this.prisma.notification.create({
      data: {
        userId: receiverId,
        actorId: senderId,
        type: 'FRIEND_REQUEST',
        title: 'New Friend Request',
        message: `${sender?.name || 'Someone'} sent you a friend request.`,
        targetUrl: '/friends',
      },
    }).catch(() => {});

    return request;
  }

  async respondRequest(requestId: string, userId: string, accept: boolean) {
    const req = await this.prisma.friendRequest.findUnique({ where: { id: requestId } });
    if (!req) throw new NotFoundException('Request not found');
    if (req.receiverId !== userId) throw new ForbiddenException();

    if (accept) {
      await this.prisma.$transaction([
        this.prisma.friendRequest.update({ where: { id: requestId }, data: { status: 'ACCEPTED' } }),
        this.prisma.friendship.create({ data: { userAId: req.senderId, userBId: req.receiverId } }),
        this.prisma.user.update({ where: { id: req.senderId }, data: { friends: { increment: 1 } } }),
        this.prisma.user.update({ where: { id: req.receiverId }, data: { friends: { increment: 1 } } }),
      ]);

      // Send back notification to original requester
      const receiver = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, handle: true },
      });

      await this.prisma.notification.create({
        data: {
          userId: req.senderId,
          actorId: userId,
          type: 'FRIEND_ACCEPT',
          title: 'Friend Request Accepted',
          message: `${receiver?.name || 'Someone'} accepted your friend request.`,
          targetUrl: `/profile?handle=${receiver?.handle || ''}`,
        },
      }).catch(() => {});
    } else {
      await this.prisma.friendRequest.update({ where: { id: requestId }, data: { status: 'REJECTED' } });
    }
    return { success: true, accepted: accept };
  }

  async cancelRequest(requestId: string, userId: string) {
    const req = await this.prisma.friendRequest.findUnique({ where: { id: requestId } });
    if (!req) throw new NotFoundException('Request not found');
    if (req.senderId !== userId) throw new ForbiddenException();
    await this.prisma.friendRequest.delete({ where: { id: requestId } });
    return { success: true };
  }

  async unfriend(userId: string, friendId: string) {
    const friendship = await this.prisma.friendship.findFirst({
      where: {
        OR: [
          { userAId: userId, userBId: friendId },
          { userAId: friendId, userBId: userId },
        ],
      },
    });
    if (!friendship) throw new NotFoundException('Friendship not found');

    await this.prisma.$transaction([
      this.prisma.friendship.delete({ where: { id: friendship.id } }),
      this.prisma.user.update({ where: { id: userId }, data: { friends: { decrement: 1 } } }),
      this.prisma.user.update({ where: { id: friendId }, data: { friends: { decrement: 1 } } }),
      // Also remove accepted request record
      this.prisma.friendRequest.deleteMany({
        where: {
          OR: [
            { senderId: userId, receiverId: friendId },
            { senderId: friendId, receiverId: userId },
          ],
        },
      }),
    ]);
    return { success: true };
  }

  async getStatus(userId: string, targetId: string) {
    const friendship = await this.prisma.friendship.findFirst({
      where: {
        OR: [
          { userAId: userId, userBId: targetId },
          { userAId: targetId, userBId: userId },
        ],
      },
    });
    if (friendship) return { status: 'FRIENDS', requestId: null };

    const sentReq = await this.prisma.friendRequest.findFirst({
      where: { senderId: userId, receiverId: targetId, status: 'PENDING' },
    });
    if (sentReq) return { status: 'REQUEST_SENT', requestId: sentReq.id };

    const receivedReq = await this.prisma.friendRequest.findFirst({
      where: { senderId: targetId, receiverId: userId, status: 'PENDING' },
    });
    if (receivedReq) return { status: 'REQUEST_RECEIVED', requestId: receivedReq.id };

    return { status: 'NONE', requestId: null };
  }
}
