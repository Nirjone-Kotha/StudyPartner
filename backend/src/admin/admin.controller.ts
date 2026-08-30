import {
  Controller, Get, Post, Delete, Patch, Param,
  Body, Query, UseGuards, Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { AdminService } from './admin.service';
import { IsString, IsOptional, IsEnum } from 'class-validator';

class PublishDto {
  @IsString() text: string;
  @IsOptional() @IsString() mediaUrl?: string;
  @IsOptional() @IsString() mediaType?: string;
}

class UpdateReportDto {
  @IsEnum(['REVIEWED', 'DISMISSED']) status: 'REVIEWED' | 'DISMISSED';
}

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Dashboard stats' })
  getStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('posts')
  @ApiOperation({ summary: 'All posts with optional filter' })
  getPosts(@Query('filter') filter?: string) {
    return this.adminService.getAllPosts(filter);
  }

  @Patch('posts/:id/feature')
  @ApiOperation({ summary: 'Toggle featured status' })
  toggleFeatured(@Param('id') id: string) {
    return this.adminService.toggleFeatured(id);
  }

  @Delete('posts/:id')
  @ApiOperation({ summary: 'Admin delete post' })
  deletePost(@Param('id') id: string) {
    return this.adminService.deletePost(id);
  }

  @Get('users')
  @ApiOperation({ summary: 'All users' })
  getUsers() {
    return this.adminService.getAllUsers();
  }

  @Get('reports')
  @ApiOperation({ summary: 'All reports' })
  getReports() {
    return this.adminService.getReports();
  }

  @Patch('reports/:id')
  @ApiOperation({ summary: 'Update report status' })
  updateReport(@Param('id') id: string, @Body() dto: UpdateReportDto) {
    return this.adminService.updateReportStatus(id, dto.status);
  }

  @Post('studio/publish')
  @ApiOperation({ summary: 'Publish featured post from Content Studio' })
  publish(@Request() req, @Body() dto: PublishDto) {
    return this.adminService.publishFeaturedPost(
      req.user.id, dto.text, dto.mediaUrl, dto.mediaType,
    );
  }
}
