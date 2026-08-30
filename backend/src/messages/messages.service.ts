import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService) {}

  /** Get all conversations (one entry per unique partner) */
  async getConversations(userId: string) {
    // Fetch all messages where user is sender or receiver
    const messages = await this.prisma.message.findMany({
      where: { OR: [{ senderId: userId }, { receiverId: userId }] },
      orderBy: { createdAt: 'desc' },
      include: {
        sender: { select: { id: true, name: true, handle: true, avatar: true } },
        receiver: { select: { id: true, name: true, handle: true, avatar: true } },
      },
    });

    // Deduplicate by partner
    const seen = new Map<string, any>();
    for (const msg of messages) {
      const partner = msg.senderId === userId ? msg.receiver : msg.sender;
      if (!seen.has(partner.id)) {
        const unread = await this.prisma.message.count({
          where: { senderId: partner.id, receiverId: userId, read: false },
        });
        seen.set(partner.id, {
          partner,
          lastMessage: { text: msg.text, createdAt: msg.createdAt, isOwn: msg.senderId === userId },
          unreadCount: unread,
        });
      }
    }

    return Array.from(seen.values());
  }

  /** Get messages between two users */
  async getThread(userId: string, partnerId: string) {
    const messages = await this.prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: partnerId },
          { senderId: partnerId, receiverId: userId },
        ],
      },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: { select: { id: true, name: true, handle: true, avatar: true } },
      },
    });

    // Mark incoming messages as read
    await this.prisma.message.updateMany({
      where: { senderId: partnerId, receiverId: userId, read: false },
      data: { read: true },
    });

    return messages;
  }

  /** Send a message */
  async send(senderId: string, receiverId: string, text: string) {
    if (senderId === receiverId) throw new ForbiddenException('Cannot message yourself');
    if (!text?.trim()) throw new ForbiddenException('Message cannot be empty');

    // Verify receiver exists
    const receiver = await this.prisma.user.findUnique({ where: { id: receiverId } });
    if (!receiver) throw new NotFoundException('User not found');

    // 1. Check Block Status
    const block = await this.prisma.userBlock.findFirst({
      where: {
        OR: [
          { blockerId: receiverId, blockedId: senderId, type: { in: ['MESSAGE', 'ALL'] } },
          { blockerId: senderId, blockedId: receiverId, type: { in: ['MESSAGE', 'ALL'] } },
        ],
      },
    });

    if (block) {
      if (block.blockerId === receiverId) {
        throw new ForbiddenException('This user has blocked you. Cannot send message.');
      } else {
        throw new ForbiddenException('You have blocked this user. Unblock to send messages.');
      }
    }

    // 2. Check Friendship
    const friendship = await this.prisma.friendship.findFirst({
      where: {
        OR: [
          { userAId: senderId, userBId: receiverId },
          { userAId: receiverId, userBId: senderId },
        ],
      },
    });

    const sender = await this.prisma.user.findUnique({
      where: { id: senderId },
      select: { id: true, name: true, handle: true, messageDeclines: true, isAdmin: true },
    });

    if (!friendship && !sender?.isAdmin && !receiver?.isAdmin) {
      // Check 3-strike decline rule
      if ((sender?.messageDeclines ?? 0) >= 3) {
        throw new ForbiddenException('Message requests to non-friends are restricted due to multiple declines.');
      }

      // Check existing MessageRequest
      const req = await this.prisma.messageRequest.findFirst({
        where: {
          OR: [
            { senderId, receiverId },
            { senderId: receiverId, receiverId: senderId },
          ],
        },
      });

      if (req) {
        if (req.status === 'DECLINED') {
          throw new ForbiddenException('This user declined your message request.');
        }

        if (req.status === 'PENDING') {
          // If pending, check if current sender already sent 1 message
          const count = await this.prisma.message.count({
            where: { senderId, receiverId },
          });
          if (count >= 1) {
            throw new BadRequestException('A message request is already pending. You can chat freely once accepted.');
          }
        }
      } else {
        // Create initial pending message request
        await this.prisma.messageRequest.create({
          data: { senderId, receiverId, status: 'PENDING' },
        });

        // Send notification to receiver
        await this.prisma.notification.create({
          data: {
            userId: receiverId,
            actorId: senderId,
            type: 'MESSAGE_REQUEST',
            title: 'New Message Request',
            message: `${sender?.name || 'Someone'} sent you a message request.`,
            targetUrl: `/messages?partnerId=${senderId}&name=${encodeURIComponent(sender?.name || '')}&handle=${encodeURIComponent(sender?.handle || '')}`,
          },
        }).catch(() => {});
      }
    }

    return this.prisma.message.create({
      data: { senderId, receiverId, text: text.trim() },
      include: {
        sender: { select: { id: true, name: true, handle: true, avatar: true } },
      },
    });
  }

  /** Accept a message request */
  async acceptMessageRequest(userId: string, senderId: string) {
    const req = await this.prisma.messageRequest.findFirst({
      where: {
        senderId,
        receiverId: userId,
        status: 'PENDING',
      },
    });

    if (!req) throw new NotFoundException('Pending message request not found');

    await this.prisma.messageRequest.update({
      where: { id: req.id },
      data: { status: 'ACCEPTED' },
    });

    const receiver = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, handle: true },
    });

    await this.prisma.notification.create({
      data: {
        userId: senderId,
        actorId: userId,
        type: 'MESSAGE_ACCEPT',
        title: 'Message Request Accepted',
        message: `${receiver?.name || 'Someone'} accepted your message request. You can now chat!`,
        targetUrl: `/messages?partnerId=${userId}&name=${encodeURIComponent(receiver?.name || '')}&handle=${encodeURIComponent(receiver?.handle || '')}`,
      },
    }).catch(() => {});

    return { success: true, status: 'ACCEPTED' };
  }

  /** Decline a message request */
  async declineMessageRequest(userId: string, senderId: string) {
    const req = await this.prisma.messageRequest.findFirst({
      where: {
        senderId,
        receiverId: userId,
        status: 'PENDING',
      },
    });

    if (!req) throw new NotFoundException('Pending message request not found');

    await this.prisma.$transaction([
      this.prisma.messageRequest.update({
        where: { id: req.id },
        data: { status: 'DECLINED' },
      }),
      this.prisma.user.update({
        where: { id: senderId },
        data: { messageDeclines: { increment: 1 } },
      }),
    ]);

    return { success: true, status: 'DECLINED' };
  }

  /** Get detailed message request and block status between users */
  async getStatus(userId: string, partnerId: string) {
    const [friendship, messageReq, myBlock, theirBlock, user] = await Promise.all([
      this.prisma.friendship.findFirst({
        where: {
          OR: [
            { userAId: userId, userBId: partnerId },
            { userAId: partnerId, userBId: userId },
          ],
        },
      }),
      this.prisma.messageRequest.findFirst({
        where: {
          OR: [
            { senderId: userId, receiverId: partnerId },
            { senderId: partnerId, receiverId: userId },
          ],
        },
      }),
      this.prisma.userBlock.findFirst({
        where: { blockerId: userId, blockedId: partnerId },
      }),
      this.prisma.userBlock.findFirst({
        where: { blockerId: partnerId, blockedId: userId },
      }),
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { messageDeclines: true, isAdmin: true },
      }),
    ]);

    const isFriends = Boolean(friendship);
    const isBlockedByMe = Boolean(myBlock);
    const hasBlockedMe = Boolean(theirBlock);
    const isDeclinedBlocked = (user?.messageDeclines ?? 0) >= 3;

    let requestStatus = 'NONE';
    if (isFriends) {
      requestStatus = 'FRIENDS';
    } else if (messageReq) {
      if (messageReq.status === 'ACCEPTED') {
        requestStatus = 'ACCEPTED';
      } else if (messageReq.status === 'DECLINED') {
        requestStatus = 'DECLINED';
      } else if (messageReq.status === 'PENDING') {
        requestStatus = messageReq.senderId === userId ? 'PENDING_SENT' : 'PENDING_RECEIVED';
      }
    }

    const sentMessagesCount = await this.prisma.message.count({
      where: { senderId: userId, receiverId: partnerId },
    });

    return {
      isFriends,
      requestStatus,
      isBlockedByMe,
      hasBlockedMe,
      blockType: myBlock?.type || theirBlock?.type || null,
      messageDeclines: user?.messageDeclines ?? 0,
      isDeclinedBlocked,
      canSendOneMessage: !isFriends && !isBlockedByMe && !hasBlockedMe && !isDeclinedBlocked && sentMessagesCount === 0 && requestStatus !== 'DECLINED',
    };
  }

  /** Block a user (for MESSAGE or FRIEND or ALL) */
  async blockUser(blockerId: string, blockedId: string, type: 'MESSAGE' | 'FRIEND' | 'ALL' = 'MESSAGE') {
    if (blockerId === blockedId) throw new BadRequestException('Cannot block yourself');

    const blockedUser = await this.prisma.user.findUnique({ where: { id: blockedId } });
    if (!blockedUser) throw new NotFoundException('User not found');

    await this.prisma.userBlock.upsert({
      where: {
        blockerId_blockedId_type: { blockerId, blockedId, type },
      },
      update: {},
      create: { blockerId, blockedId, type },
    });

    if (type === 'FRIEND' || type === 'ALL') {
      // Remove any friendship
      const friendship = await this.prisma.friendship.findFirst({
        where: {
          OR: [
            { userAId: blockerId, userBId: blockedId },
            { userAId: blockedId, userBId: blockerId },
          ],
        },
      });

      if (friendship) {
        await this.prisma.$transaction([
          this.prisma.friendship.delete({ where: { id: friendship.id } }),
          this.prisma.user.update({ where: { id: blockerId }, data: { friends: { decrement: 1 } } }),
          this.prisma.user.update({ where: { id: blockedId }, data: { friends: { decrement: 1 } } }),
        ]);
      }

      // Remove pending friend requests
      await this.prisma.friendRequest.deleteMany({
        where: {
          OR: [
            { senderId: blockerId, receiverId: blockedId },
            { senderId: blockedId, receiverId: blockerId },
          ],
        },
      });
    }

    return { success: true, blocked: true, type };
  }

  /** Unblock a user */
  async unblockUser(blockerId: string, blockedId: string, type?: 'MESSAGE' | 'FRIEND' | 'ALL') {
    if (type) {
      await this.prisma.userBlock.deleteMany({
        where: { blockerId, blockedId, type },
      });
    } else {
      await this.prisma.userBlock.deleteMany({
        where: { blockerId, blockedId },
      });
    }
    return { success: true, unblocked: true };
  }

  /** Get list of blocked users */
  async getBlockedUsers(userId: string) {
    return this.prisma.userBlock.findMany({
      where: { blockerId: userId },
      include: {
        blocked: { select: { id: true, name: true, handle: true, avatar: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Count unread messages for the user */
  async unreadCount(userId: string) {
    const count = await this.prisma.message.count({
      where: { receiverId: userId, read: false },
    });
    return { count };
  }
}
