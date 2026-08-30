import { Controller, Get, Post, Delete, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FriendsService } from './friends.service';

@ApiTags('friends')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('friends')
export class FriendsController {
  constructor(private friendsService: FriendsService) {}

  @Get('suggestions')
  @ApiOperation({ summary: 'Get friend suggestions' })
  getSuggestions(@Request() req) {
    return this.friendsService.getSuggestions(req.user.id);
  }

  @Get('requests/pending')
  @ApiOperation({ summary: 'Get pending friend requests' })
  getPending(@Request() req) {
    return this.friendsService.getPendingRequests(req.user.id);
  }

  @Get('requests/sent')
  @ApiOperation({ summary: 'Get sent friend requests' })
  getSent(@Request() req) {
    return this.friendsService.getSentRequests(req.user.id);
  }

  @Get('list')
  @ApiOperation({ summary: 'Get friends list' })
  getFriends(@Request() req) {
    return this.friendsService.getFriends(req.user.id);
  }

  @Get('status/:targetId')
  @ApiOperation({ summary: 'Get friendship status with a user' })
  getStatus(@Request() req, @Param('targetId') targetId: string) {
    return this.friendsService.getStatus(req.user.id, targetId);
  }

  @Post('request/:receiverId')
  @ApiOperation({ summary: 'Send friend request' })
  sendRequest(@Request() req, @Param('receiverId') receiverId: string) {
    return this.friendsService.sendRequest(req.user.id, receiverId);
  }

  @Post('request/:requestId/accept')
  @ApiOperation({ summary: 'Accept friend request' })
  accept(@Request() req, @Param('requestId') requestId: string) {
    return this.friendsService.respondRequest(requestId, req.user.id, true);
  }

  @Post('request/:requestId/reject')
  @ApiOperation({ summary: 'Reject friend request' })
  reject(@Request() req, @Param('requestId') requestId: string) {
    return this.friendsService.respondRequest(requestId, req.user.id, false);
  }

  @Delete('request/:requestId')
  @ApiOperation({ summary: 'Cancel sent friend request' })
  cancelRequest(@Request() req, @Param('requestId') requestId: string) {
    return this.friendsService.cancelRequest(requestId, req.user.id);
  }

  @Delete('unfriend/:friendId')
  @ApiOperation({ summary: 'Unfriend a user' })
  unfriend(@Request() req, @Param('friendId') friendId: string) {
    return this.friendsService.unfriend(req.user.id, friendId);
  }
}
