import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateInvitationDto {
  @IsString()
  @IsNotEmpty()
  inviteeId: string;
}

export class UseInvitationDto {
  @IsString()
  @IsNotEmpty()
  code: string;
}

export class InvitationResponseDto {
  id: string;
  code: string;
  inviterId: string;
  inviteeId?: string;
  status: string;
  expiredAt: Date;
  createdAt: Date;
  updatedAt: Date;
  inviter?: {
    id: string;
    username: string;
    avatar?: string;
  };
  invitee?: {
    id: string;
    username: string;
    avatar?: string;
  };
}
