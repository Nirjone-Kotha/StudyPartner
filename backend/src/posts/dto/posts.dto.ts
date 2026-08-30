import {
  IsString, IsOptional, IsEnum, IsArray, IsInt, Min, Max,
  ArrayMinSize, ArrayMaxSize, MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReactionType } from '@prisma/client';

export class CreatePostDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  text?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  mediaUrl?: string;

  @ApiPropertyOptional({ enum: ['IMAGE', 'VIDEO'] })
  @IsEnum(['IMAGE', 'VIDEO'])
  @IsOptional()
  mediaType?: 'IMAGE' | 'VIDEO';

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  explanation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  featured?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  pinned?: boolean;
}

export class CreatePollDto {
  @ApiProperty()
  @IsString()
  @MinLength(3)
  question: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(5)
  @IsString({ each: true })
  options: string[];

  @ApiPropertyOptional()
  @IsInt()
  @Min(0)
  @IsOptional()
  correctAnswer?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  explanation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  featured?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  pinned?: boolean;
}

export class VotePollDto {
  @ApiProperty()
  @IsInt()
  @Min(0)
  @Max(4)
  optionIndex: number;
}

export class ReactDto {
  @ApiProperty({ enum: ReactionType })
  @IsEnum(ReactionType)
  type: ReactionType;
}

export class CreateCommentDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  text: string;
}

export class CreateReportDto {
  @ApiProperty()
  @IsString()
  @MinLength(3)
  reason: string;
}
