import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { Invitation, FriendshipStatus, User } from '@prisma/client';
import * as crypto from 'crypto';

export type InvitationWithUsers = Invitation & {
  inviter: User;
  invitee: User | null;
};

@Injectable()
export class InvitationService {
  constructor(private prisma: PrismaService) {}

  async createInvitation(inviterId: string, inviteeId: string): Promise<InvitationWithUsers> {
    // Check if inviter exists
    const inviter = await this.prisma.user.findUnique({
      where: { id: inviterId },
    });
    if (!inviter) {
      throw new NotFoundException('Inviter not found');
    }

    // Check if invitee exists
    const invitee = await this.prisma.user.findUnique({
      where: { id: inviteeId },
    });
    if (!invitee) {
      throw new NotFoundException('Invitee not found');
    }

    // Check if invitation already exists
    const existingInvitation = await this.prisma.invitation.findFirst({
      where: {
        inviterId,
        inviteeId,
        status: FriendshipStatus.PENDING,
      },
    });
    if (existingInvitation) {
      throw new ConflictException('Invitation already exists');
    }

    // Check if users are already friends
    const existingFriendship = await this.prisma.friendship.findFirst({
      where: {
        OR: [
          { userId: inviterId, friendId: inviteeId },
          { userId: inviteeId, friendId: inviterId },
        ],
        status: 'ACCEPTED',
      },
    });
    if (existingFriendship) {
      throw new ConflictException('Users are already friends');
    }

    // Create invitation
    const invitation = await this.prisma.invitation.create({
      data: {
        code: `invite_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        inviterId,
        inviteeId,
        status: FriendshipStatus.PENDING,
        expiredAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      },
      include: {
        inviter: true,
        invitee: true,
      },
    });

    return invitation;
  }

  async getInvitations(userId: string): Promise<InvitationWithUsers[]> {
    const invitations = await this.prisma.invitation.findMany({
      where: {
        OR: [
          { inviterId: userId },
          { inviteeId: userId },
        ],
      },
      include: {
        inviter: true,
        invitee: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return invitations;
  }

  async getPendingInvitations(userId: string): Promise<InvitationWithUsers[]> {
    const invitations = await this.prisma.invitation.findMany({
      where: {
        inviteeId: userId,
        status: FriendshipStatus.PENDING,
      },
      include: {
        inviter: true,
        invitee: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return invitations;
  }

  async acceptInvitation(invitationId: string, userId: string): Promise<InvitationWithUsers> {
    // Find invitation
    const invitation = await this.prisma.invitation.findUnique({
      where: { id: invitationId },
      include: {
        inviter: true,
        invitee: true,
      },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    // Check if user is the invitee
    if (invitation.inviteeId !== userId) {
      throw new BadRequestException('You can only accept invitations sent to you');
    }

    // Check if invitation is pending
    if (invitation.status !== FriendshipStatus.PENDING) {
      throw new BadRequestException('Invitation is not pending');
    }

    // Update invitation status
    const updatedInvitation = await this.prisma.invitation.update({
      where: { id: invitationId },
      data: { status: FriendshipStatus.ACCEPTED },
      include: {
        inviter: true,
        invitee: true,
      },
    });

    // Create friendship
    await this.prisma.friendship.createMany({
      data: [
        {
          userId: invitation.inviterId,
          friendId: invitation.inviteeId,
          status: 'ACCEPTED',
        },
        {
          userId: invitation.inviteeId,
          friendId: invitation.inviterId,
          status: 'ACCEPTED',
        },
      ],
    });

    return updatedInvitation;
  }

  async rejectInvitation(invitationId: string, userId: string): Promise<InvitationWithUsers> {
    // Find invitation
    const invitation = await this.prisma.invitation.findUnique({
      where: { id: invitationId },
      include: {
        inviter: true,
        invitee: true,
      },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    // Check if user is the invitee
    if (invitation.inviteeId !== userId) {
      throw new BadRequestException('You can only reject invitations sent to you');
    }

    // Check if invitation is pending
    if (invitation.status !== FriendshipStatus.PENDING) {
      throw new BadRequestException('Invitation is not pending');
    }

    // Update invitation status
    const updatedInvitation = await this.prisma.invitation.update({
      where: { id: invitationId },
      data: { status: FriendshipStatus.BLOCKED },
      include: {
        inviter: true,
        invitee: true,
      },
    });

    return updatedInvitation;
  }

  async cancelInvitation(invitationId: string, userId: string): Promise<InvitationWithUsers> {
    // Find invitation
    const invitation = await this.prisma.invitation.findUnique({
      where: { id: invitationId },
      include: {
        inviter: true,
        invitee: true,
      },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    // Check if user is the inviter
    if (invitation.inviterId !== userId) {
      throw new BadRequestException('You can only cancel invitations you sent');
    }

    // Check if invitation is pending
    if (invitation.status !== FriendshipStatus.PENDING) {
      throw new BadRequestException('Invitation is not pending');
    }

    // Update invitation status
    const updatedInvitation = await this.prisma.invitation.update({
      where: { id: invitationId },
      data: { status: FriendshipStatus.BLOCKED },
      include: {
        inviter: true,
        invitee: true,
      },
    });

    return updatedInvitation;
  }

  async useInviteCode(userId: string, code: string): Promise<{ success: boolean; message: string; friendshipId?: string }> {
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
      // Create friendship (both directions)
      const friendship1 = await tx.friendship.create({
        data: {
          userId,
          friendId: invitation.inviterId,
          status: 'ACCEPTED',
        },
      });

      const friendship2 = await tx.friendship.create({
        data: {
          userId: invitation.inviterId,
          friendId: userId,
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

      return friendship1;
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

  private generateUserInviteCode(userId: string): string {
    // Generate a consistent 8-character code from user ID
    const hash = crypto.createHash('md5').update(userId).digest('hex');
    return hash.substring(0, 8).toUpperCase();
  }
}
