import { IsString, IsOptional, IsBoolean, IsInt, IsEnum, MinLength, MaxLength, Min, Max } from 'class-validator';
import { PointCategory } from '@prisma/client';

export class CreateLeagueDto {
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;

  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;
}

export class UpdateLeagueDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;

  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;
}

export class AddMemberDto {
  @IsString()
  userId: string;
}

export class CreateRuleDto {
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  title: string;

  @IsString()
  @MaxLength(200)
  description: string;

  @IsInt()
  @Min(-1000)
  @Max(1000)
  points: number;

  @IsEnum(PointCategory)
  category: PointCategory;
}

export class UpdateRuleDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(-1000)
  @Max(1000)
  points?: number;

  @IsOptional()
  @IsEnum(PointCategory)
  category?: PointCategory;
}

export class AssignPointsDto {
  @IsString()
  userId: string;

  @IsInt()
  @Min(-1000)
  @Max(1000)
  points: number;

  @IsEnum(PointCategory)
  category: PointCategory;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  reason?: string;
}

export class JoinLeagueDto {
  @IsOptional()
  @IsString()
  inviteCode?: string;
}
