import { Controller, Get, Post, Delete, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SavedService } from './saved.service';

@ApiTags('saved')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('saved')
export class SavedController {
  constructor(private savedService: SavedService) {}

  @Get()
  getSaved(@Request() req) {
    return this.savedService.getSaved(req.user.id);
  }

  @Post(':postId')
  savePost(@Request() req, @Param('postId') postId: string) {
    return this.savedService.savePost(req.user.id, postId);
  }

  @Delete(':postId')
  unsavePost(@Request() req, @Param('postId') postId: string) {
    return this.savedService.unsavePost(req.user.id, postId);
  }

  @Get('check/:postId')
  checkSaved(@Request() req, @Param('postId') postId: string) {
    return this.savedService.isPostSaved(req.user.id, postId);
  }
}
