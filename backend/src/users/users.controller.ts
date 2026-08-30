import { Controller, Get, Patch, Param, Body, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  getMe(@Request() req) {
    return this.usersService.getMe(req.user.id);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile' })
  updateMe(@Request() req, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(req.user.id, dto);
  }

  @Get('contacts')
  @ApiOperation({ summary: 'Get contacts list' })
  getContacts(@Request() req) {
    return this.usersService.getContacts(req.user.id);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search users by name or handle' })
  @ApiQuery({ name: 'q', required: true, description: 'Search query' })
  searchUsers(@Query('q') q: string, @Request() req) {
    return this.usersService.searchUsers(q, req.user.id);
  }

  @Get(':handle')
  @ApiOperation({ summary: 'Get user profile by handle' })
  getProfile(@Param('handle') handle: string) {
    return this.usersService.getProfile(handle);
  }

  @Get(':handle/posts')
  @ApiOperation({ summary: 'Get posts by user handle' })
  getUserPosts(@Param('handle') handle: string, @Request() req) {
    return this.usersService.getUserPosts(handle, req.user.id);
  }

  @Get(':handle/friends')
  @ApiOperation({ summary: 'Get friends list of a user if public or authorized' })
  getUserFriends(@Param('handle') handle: string, @Request() req) {
    return this.usersService.getUserFriends(handle, req.user.id);
  }
}
