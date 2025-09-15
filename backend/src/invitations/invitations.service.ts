import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CreateInvitationDto, UseInvitationDto, InvitationResponseDto } from './dto/invitation.dto';
import { FriendshipStatus } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class InvitationsService {
  constructor(private prisma: PrismaService) {}

  async createInvitation(userId: string, createInvitationDto: CreateInvitationDto): Promise<InvitationResponseDto> {
    const { inviteeId } = createInvitationDto;

    // Check if inviter and invitee are the same
    if (userId === inviteeId) {
      throw new BadRequestException('Cannot invite yourself');
    }

    // Check if invitee exists
    const invitee = await this.prisma.user.findUnique({
      where: { id: inviteeId },
    });

    if (!invitee) {
      throw new NotFoundException('User not found');
    }

    // Check if friendship already exists
    const existingFriendship = await this.prisma.friendship.findFirst({
      where: {
        OR: [
          { userId, friendId: inviteeId },
          { userId: inviteeId, friendId: userId },
        ],
      },
    });

    if (existingFriendship) {
      throw new ConflictException('Friendship already exists');
    }

    // Check if there's already a pending invitation
    const existingInvitation = await this.prisma.invitation.findFirst({
      where: {
        OR: [
          { inviterId: userId, inviteeId },
          { inviterId: inviteeId, inviteeId: userId },
        ],
        status: 'PENDING',
      },
    });

    if (existingInvitation) {
      throw new ConflictException('Invitation already exists');
    }

    // Generate unique invite code
    const code = this.generateInviteCode();

    // Create invitation (expires in 7 days)
    const invitation = await this.prisma.invitation.create({
      data: {
        code,
        inviterId: userId,
        inviteeId,
        expiredAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
      include: {
        inviter: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
        invitee: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    return this.mapToResponseDto(invitation);
  }

  async getInvitations(userId: string): Promise<InvitationResponseDto[]> {
    const invitations = await this.prisma.invitation.findMany({
      where: {
        OR: [
          { inviterId: userId },
          { inviteeId: userId },
        ],
      },
      include: {
        inviter: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
        invitee: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return invitations.map(invitation => this.mapToResponseDto(invitation));
  }

  async useInvitation(userId: string, useInvitationDto: UseInvitationDto): Promise<{ success: boolean; message: string; friendshipId?: string }> {
    const { code } = useInvitationDto;

    // Find invitation by code
    const invitation = await this.prisma.invitation.findUnique({
      where: { code },
      include: {
        inviter: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    if (!invitation) {
      throw new NotFoundException('Invalid invite code');
    }

    // Check if invitation is expired
    if (invitation.expiredAt < new Date()) {
      throw new BadRequestException('Invite code has expired');
    }

    // Check if invitation is already used
    if (invitation.status !== 'PENDING') {
      throw new BadRequestException('Invite code has already been used');
    }

    // Check if user is trying to use their own code
    if (invitation.inviterId === userId) {
      throw new BadRequestException('Cannot use your own invite code');
    }

    // Check if friendship already exists
    const existingFriendship = await this.prisma.friendship.findFirst({
      where: {
        OR: [
          { userId, friendId: invitation.inviterId },
          { userId: invitation.inviterId, friendId: userId },
        ],
      },
    });

    if (existingFriendship) {
      throw new ConflictException('Friendship already exists');
    }

    // Use transaction to create friendship and update invitation
    const result = await this.prisma.$transaction(async (tx) => {
      // Create friendship
      const friendship = await tx.friendship.create({
        data: {
          userId,
          friendId: invitation.inviterId,
          status: 'ACCEPTED',
        },
      });

      // Update invitation status
      await tx.invitation.update({
        where: { id: invitation.id },
        data: {
          status: 'ACCEPTED',
          inviteeId: userId,
        },
      });

      return friendship;
    });

    return {
      success: true,
      message: `Successfully connected with ${invitation.inviter.username}!`,
      friendshipId: result.id,
    };
  }

  async getMyInviteCode(userId: string): Promise<{ code: string; username: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Generate a consistent invite code based on user ID
    const code = this.generateUserInviteCode(userId);

    return {
      code,
      username: user.username,
    };
  }

  private generateInviteCode(): string {
    return crypto.randomBytes(4).toString('hex').toUpperCase();
  }

  private generateUserInviteCode(userId: string): string {
    // Generate a consistent 8-character code from user ID
    const hash = crypto.createHash('md5').update(userId).digest('hex');
    return hash.substring(0, 8).toUpperCase();
  }

  private mapToResponseDto(invitation: any): InvitationResponseDto {
    return {
      id: invitation.id,
      code: invitation.code,
      inviterId: invitation.inviterId,
      inviteeId: invitation.inviteeId,
      status: invitation.status,
      expiredAt: invitation.expiredAt,
      createdAt: invitation.createdAt,
      updatedAt: invitation.updatedAt,
      inviter: invitation.inviter,
      invitee: invitation.invitee,
    };
  }
}
