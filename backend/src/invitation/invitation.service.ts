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

  async useInviteCode(userId: string, code: string): Promise<{ success: boolean; message: string; invitationId?: string }> {
    // One-time backfill: ensure users missing inviteCode get one
    // @ts-ignore - inviteCode exists after migration
    const usersMissingCodes = await this.prisma.user.findMany({
      // @ts-ignore - inviteCode in where clause
      where: { inviteCode: null },
      select: { id: true },
      take: 1000,
    });
    if (usersMissingCodes.length > 0) {
      for (const u of usersMissingCodes) {
        const newCode = this.generateSecureInviteCode(u.id);
        try {
          // @ts-ignore - inviteCode exists after migration
          await this.prisma.user.update({ where: { id: u.id }, data: { inviteCode: newCode } });
        } catch (e) {
          // ignore unique conflicts if concurrently set
        }
      }
    }
    // Find inviter by secure inviteCode on the user record
    // @ts-ignore - inviteCode field exists after Prisma migration
    const inviter = await this.prisma.user.findUnique({
      // @ts-ignore - inviteCode is a unique field on users
      where: { inviteCode: code },
      select: { id: true, username: true },
    });

    if (!inviter) {
      throw new NotFoundException('Invalid invite code');
    }

    if (inviter.id === userId) {
      throw new BadRequestException('Cannot use your own invite code');
    }

    // Check if friendship already exists
    const existingFriendship = await this.prisma.friendship.findFirst({
      where: {
        OR: [
          { userId, friendId: inviter.id },
          { userId: inviter.id, friendId: userId },
        ],
        status: 'ACCEPTED',
      },
    });

    if (existingFriendship) {
      throw new ConflictException('Friendship already exists');
    }

    // Check if there's already a pending invitation
    const existingInvitation = await this.prisma.invitation.findFirst({
      where: {
        OR: [
          { inviterId: inviter.id, inviteeId: userId },
          { inviterId: userId, inviteeId: inviter.id },
        ],
        status: FriendshipStatus.PENDING,
      },
    });

    if (existingInvitation) {
      throw new ConflictException('Friend request already exists');
    }

    // Create invitation (friend request) instead of immediate friendship
    const invitation = await this.prisma.invitation.create({
      data: {
        code: `invite_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        inviterId: userId, // The person using the code becomes the inviter
        inviteeId: inviter.id, // The person who owns the code becomes the invitee
        status: FriendshipStatus.PENDING,
        expiredAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      },
    });

    return {
      success: true,
      message: `Friend request sent to ${inviter.username}!`,
      invitationId: invitation.id,
    };
  }

  async getMyInviteCode(userId: string): Promise<{ code: string; username: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        // @ts-ignore - inviteCode exists after migration
        inviteCode: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    let code: string | null = (user as any).inviteCode ?? null;
    if (!code) {
      code = this.generateSecureInviteCode(userId);
      try {
        // @ts-ignore - inviteCode exists after migration
        await this.prisma.user.update({ where: { id: userId }, data: { inviteCode: code } });
      } catch (_) {
        // ignore if column not yet migrated or unique conflict
      }
    }

    return {
      code,
      username: user.username,
    };
  }

  private generateSecureInviteCode(userId: string): string {
    const secret = process.env.INVITE_CODE_SECRET || process.env.JWT_SECRET || 'fallback-secret-change-me';
    const hmac = crypto.createHmac('sha256', secret).update(userId).digest('hex');
    return hmac.substring(0, 8).toUpperCase();
  }
}
