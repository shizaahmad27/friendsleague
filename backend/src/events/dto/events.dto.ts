import { IsString, IsOptional, IsBoolean, IsInt, IsEnum, IsArray, IsDateString, MinLength, MaxLength, Min, Max } from 'class-validator';
import { PointCategory } from '@prisma/client';

export class CreateEventDto {
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;

  @IsOptional()
  @IsString()
  leagueId?: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsInt()
  @Min(2)
  @Max(100)
  maxParticipants?: number;

  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;

  @IsOptional()
  @IsBoolean()
  hasScoring?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  participantIds?: string[];
}

export class UpdateEventDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsInt()
  @Min(2)
  @Max(100)
  maxParticipants?: number;

  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;

  @IsOptional()
  @IsBoolean()
  hasScoring?: boolean;
}

export class AddParticipantDto {
  @IsString()
  userId: string;
}

export class CreateEventRuleDto {
  @IsString()
  @MinLength(3)
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

export class AssignEventPointsDto {
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

export class JoinEventDto {
  @IsOptional()
  @IsString()
  inviteCode?: string;
}

export class CreateEventInvitationDto {
  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(30)
  expiresInDays?: number;
}
