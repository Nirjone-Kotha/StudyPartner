import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { StoriesService } from './stories.service';
import { CreateStoryDto } from './dto/story.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';

@ApiTags('stories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('stories')
export class StoriesController {
  constructor(private readonly storiesService: StoriesService) {}

  /** POST /stories — create a story (user or admin) */
  @Post()
  @ApiOperation({ summary: 'Create a new story' })
  create(@Request() req, @Body() dto: CreateStoryDto) {
    const isAdmin = !!req.user.isAdmin;
    return this.storiesService.create(req.user.id, isAdmin, dto);
  }

  /** GET /stories/feed — active stories grouped by author */
  @Get('feed')
  @ApiOperation({ summary: 'Get active stories feed' })
  getFeed(@Request() req) {
    return this.storiesService.getFeed(req.user.id);
  }

  /** GET /stories/me — current user's own active stories */
  @Get('me')
  @ApiOperation({ summary: 'Get current user active stories' })
  getMyStories(@Request() req) {
    return this.storiesService.getMyStories(req.user.id);
  }

  /** POST /stories/:id/view — mark a story as viewed */
  @Post(':id/view')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark story as viewed' })
  markViewed(@Param('id') id: string, @Request() req) {
    return this.storiesService.markViewed(id, req.user.id);
  }

  /** DELETE /stories/:id — delete own story (admin can delete any) */
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a story' })
  delete(@Param('id') id: string, @Request() req) {
    const isAdmin = !!req.user.isAdmin;
    return this.storiesService.delete(id, req.user.id, isAdmin);
  }

  /** GET /stories/admin/all — admin: see all stories */
  @Get('admin/all')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Admin: get all stories' })
  adminGetAll() {
    return this.storiesService.adminGetAll();
  }
}

