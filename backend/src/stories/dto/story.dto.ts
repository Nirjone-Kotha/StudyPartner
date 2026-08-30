import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  IsIn,
  IsHexColor,
} from 'class-validator';

export class CreateStoryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(300, { message: 'Story text may not exceed 300 characters.' })
  textContent: string;

  @IsOptional()
  @IsHexColor()
  bgColor?: string;

  @IsOptional()
  @IsHexColor()
  textColor?: string;

  @IsOptional()
  @IsIn(['normal', 'italic', 'bold', 'bolditalic'])
  fontStyle?: string;

  @IsOptional()
  @IsIn(['small', 'medium', 'large', 'xlarge'])
  fontSize?: string;

  // Only accepted when the caller is an admin (validated in service)
  @IsOptional()
  @IsString()
  imageUrl?: string;
}

