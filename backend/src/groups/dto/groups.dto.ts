import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsArray, MinLength, MaxLength } from 'class-validator';

export class CreateGroupDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(80)
  name!: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  coverImage?: string;

  @IsString()
  @IsOptional()
  avatar?: string;

  @IsBoolean()
  @IsOptional()
  isPrivate?: boolean;
}

export class InviteMembersDto {
  @IsArray()
  @IsString({ each: true })
  userIds!: string[];
}

export class CreateGroupPostDto {
  @IsString()
  @IsOptional()
  text?: string;

  @IsString()
  @IsOptional()
  mediaUrl?: string;

  @IsString()
  @IsOptional()
  mediaType?: 'IMAGE' | 'VIDEO';

  @IsString()
  @IsOptional()
  explanation?: string;

  @IsOptional()
  poll?: {
    question: string;
    options: string[];
    correctAnswer?: number;
  };
}
