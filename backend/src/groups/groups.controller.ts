import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GroupsService } from './groups.service';
import { CreateGroupDto, InviteMembersDto, CreateGroupPostDto } from './dto/groups.dto';

@ApiTags('groups')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('groups')
export class GroupsController {
  constructor(private groupsService: GroupsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new group' })
  createGroup(@Request() req: any, @Body() dto: CreateGroupDto) {
    return this.groupsService.createGroup(req.user.id, dto);
  }

  @Get('discover')
  @ApiOperation({ summary: 'Discover public groups' })
  getDiscoverGroups(@Request() req: any) {
    return this.groupsService.getDiscoverGroups(req.user.id);
  }

  @Get('my')
  @ApiOperation({ summary: 'Get groups joined or created by user' })
  getMyGroups(@Request() req: any) {
    return this.groupsService.getMyGroups(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get group details by ID' })
  getGroupById(@Param('id') id: string, @Request() req: any) {
    return this.groupsService.getGroupById(id, req.user.id);
  }

  @Post(':id/join')
  @ApiOperation({ summary: 'Join a group' })
  joinGroup(@Param('id') id: string, @Request() req: any) {
    return this.groupsService.joinGroup(id, req.user.id);
  }

  @Post(':id/leave')
  @ApiOperation({ summary: 'Leave a group' })
  leaveGroup(@Param('id') id: string, @Request() req: any) {
    return this.groupsService.leaveGroup(id, req.user.id);
  }

  @Get(':id/members')
  @ApiOperation({ summary: 'Get group members' })
  getGroupMembers(@Param('id') id: string) {
    return this.groupsService.getGroupMembers(id);
  }

  @Post(':id/invite')
  @ApiOperation({ summary: 'Invite friends to group' })
  inviteMembers(@Param('id') id: string, @Request() req: any, @Body() dto: InviteMembersDto) {
    return this.groupsService.inviteMembers(id, req.user.id, dto);
  }

  @Get(':id/posts')
  @ApiOperation({ summary: 'Get posts inside group' })
  getGroupPosts(@Param('id') id: string, @Request() req: any) {
    return this.groupsService.getGroupPosts(id, req.user.id);
  }

  @Post(':id/posts')
  @ApiOperation({ summary: 'Create post inside group' })
  createGroupPost(@Param('id') id: string, @Request() req: any, @Body() dto: CreateGroupPostDto) {
    return this.groupsService.createGroupPost(id, req.user.id, dto);
  }
}
