import {
  Controller, Get, Post, Delete, Body, Param, Query,
  UseGuards, Request, ParseIntPipe, DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PostsService } from './posts.service';
import {
  CreatePostDto, CreatePollDto, VotePollDto,
  ReactDto, CreateCommentDto, CreateReportDto,
} from './dto/posts.dto';

@ApiTags('posts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('posts')
export class PostsController {
  constructor(private postsService: PostsService) {}

  @Get('feed')
  @ApiOperation({ summary: 'Get paginated feed' })
  getFeed(
    @Request() req,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.postsService.getFeed(req.user.id, page, Math.min(limit, 50));
  }

  @Post()
  @ApiOperation({ summary: 'Create a post' })
  createPost(@Request() req, @Body() dto: CreatePostDto) {
    return this.postsService.createPost(req.user.id, dto);
  }

  @Post('poll')
  @ApiOperation({ summary: 'Create a poll post' })
  createPoll(@Request() req, @Body() dto: CreatePollDto) {
    return this.postsService.createPoll(req.user.id, dto);
  }

  @Post(':id/vote')
  @ApiOperation({ summary: 'Vote on a poll' })
  votePoll(@Param('id') id: string, @Request() req, @Body() dto: VotePollDto) {
    return this.postsService.votePoll(id, req.user.id, dto);
  }

  @Post(':id/react')
  @ApiOperation({ summary: 'React to a post' })
  react(@Param('id') id: string, @Request() req, @Body() dto: ReactDto) {
    return this.postsService.reactToPost(id, req.user.id, dto);
  }

  @Post(':id/comments')
  @ApiOperation({ summary: 'Add a comment' })
  addComment(@Param('id') id: string, @Request() req, @Body() dto: CreateCommentDto) {
    return this.postsService.addComment(id, req.user.id, dto);
  }

  @Get(':id/comments')
  @ApiOperation({ summary: 'Get comments for a post' })
  getComments(@Param('id') id: string) {
    return this.postsService.getComments(id);
  }

  @Post(':id/report')
  @ApiOperation({ summary: 'Report a post' })
  report(@Param('id') id: string, @Request() req, @Body() dto: CreateReportDto) {
    return this.postsService.reportPost(id, req.user.id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete own post' })
  delete(@Param('id') id: string, @Request() req) {
    return this.postsService.deletePost(id, req.user.id);
  }
}
