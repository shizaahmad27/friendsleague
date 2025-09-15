import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { Invitation, FriendshipStatus, User } from '@prisma/client';

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
}
