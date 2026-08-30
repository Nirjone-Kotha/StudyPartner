import { Controller, Get, Post, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MessagesService } from './messages.service';

@ApiTags('messages')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('messages')
export class MessagesController {
  constructor(private messagesService: MessagesService) {}

  @Get('conversations')
  @ApiOperation({ summary: 'Get all conversations' })
  getConversations(@Request() req) {
    return this.messagesService.getConversations(req.user.id);
  }

  @Get('unread')
  @ApiOperation({ summary: 'Get unread message count' })
  unreadCount(@Request() req) {
    return this.messagesService.unreadCount(req.user.id);
  }

  @Get('thread/:partnerId')
  @ApiOperation({ summary: 'Get messages with a specific user' })
  getThread(@Request() req, @Param('partnerId') partnerId: string) {
    return this.messagesService.getThread(req.user.id, partnerId);
  }

  @Post('send/:receiverId')
  @ApiOperation({ summary: 'Send a message to a user' })
  send(
    @Request() req,
    @Param('receiverId') receiverId: string,
    @Body('text') text: string,
  ) {
    return this.messagesService.send(req.user.id, receiverId, text);
  }

  @Get('status/:partnerId')
  @ApiOperation({ summary: 'Get message and block status with a partner' })
  getStatus(@Request() req, @Param('partnerId') partnerId: string) {
    return this.messagesService.getStatus(req.user.id, partnerId);
  }

  @Post('requests/:senderId/accept')
  @ApiOperation({ summary: 'Accept message request' })
  acceptRequest(@Request() req, @Param('senderId') senderId: string) {
    return this.messagesService.acceptMessageRequest(req.user.id, senderId);
  }

  @Post('requests/:senderId/decline')
  @ApiOperation({ summary: 'Decline message request' })
  declineRequest(@Request() req, @Param('senderId') senderId: string) {
    return this.messagesService.declineMessageRequest(req.user.id, senderId);
  }

  @Post('block/:targetId')
  @ApiOperation({ summary: 'Block a user' })
  blockUser(
    @Request() req,
    @Param('targetId') targetId: string,
    @Body('type') type?: 'MESSAGE' | 'FRIEND' | 'ALL',
  ) {
    return this.messagesService.blockUser(req.user.id, targetId, type || 'MESSAGE');
  }

  @Post('unblock/:targetId')
  @ApiOperation({ summary: 'Unblock a user' })
  unblockUser(
    @Request() req,
    @Param('targetId') targetId: string,
    @Body('type') type?: 'MESSAGE' | 'FRIEND' | 'ALL',
  ) {
    return this.messagesService.unblockUser(req.user.id, targetId, type);
  }

  @Get('blocked')
  @ApiOperation({ summary: 'Get list of blocked users' })
  getBlockedUsers(@Request() req) {
    return this.messagesService.getBlockedUsers(req.user.id);
  }
}
