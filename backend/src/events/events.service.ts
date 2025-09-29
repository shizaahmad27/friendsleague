import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { PointCategory, InvitationStatus } from '@prisma/client';
import {
  CreateEventDto,
  UpdateEventDto,
  AddParticipantDto,
  CreateEventRuleDto,
  AssignEventPointsDto,
  CreateEventInvitationDto,
} from './dto/events.dto';

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new event
   * Creator automatically becomes admin and first participant
   */
  async createEvent(adminId: string, createEventDto: CreateEventDto) {
    const {
      title,
      description,
      leagueId,
      startDate,
      endDate,
      maxParticipants,
      isPrivate,
      hasScoring,
      participantIds,
    } = createEventDto;

    // Generate unique invite code for private events
    const inviteCode = isPrivate ? this.generateInviteCode() : null;

    // Ensure admin is included in participants
    const allParticipantIds = [...new Set([adminId, ...(participantIds || [])])];

    const event = await this.prisma.event.create({
      data: {
        title,
        description,
        leagueId,
        adminId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        maxParticipants,
        isPrivate,
        inviteCode,
        hasScoring,
        participants: {
          create: allParticipantIds.map(userId => ({
            userId,
            points: 0,
            rank: 0, // Will be updated by recalculateRankings
          })),
        },
      },
      include: {
        admin: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
        league: {
          select: {
            id: true,
            name: true,
          },
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatar: true,
                isOnline: true,
              },
            },
          },
          orderBy: {
            rank: 'asc',
          },
        },
        rules: true,
        invitations: true,
      },
    });

    // Recalculate rankings
    await this.recalculateEventRankings(event.id);

    return event;
  }

  /**
   * Get all events (public events + user's events)
   */
  async getEvents(userId: string) {
    const events = await this.prisma.event.findMany({
      where: {
        OR: [
          { isPrivate: false }, // Public events
          { participants: { some: { userId } } }, // User is a participant
          { adminId: userId }, // User is admin
        ],
      },
      include: {
        admin: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
        league: {
          select: {
            id: true,
            name: true,
          },
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatar: true,
                isOnline: true,
              },
            },
          },
          orderBy: {
            rank: 'asc',
          },
        },
        rules: true,
        _count: {
          select: {
            participants: true,
          },
        },
      },
      orderBy: {
        startDate: 'desc',
      },
    });

    return events;
  }

  /**
   * Get events for a specific league
   */
  async getLeagueEvents(leagueId: string, userId: string) {
    // Verify user has access to the league
    const league = await this.prisma.league.findUnique({
      where: { id: leagueId },
      include: {
        members: {
          where: { userId },
        },
        admins: {
          where: { userId },
        },
      },
    });

    if (!league) {
      throw new NotFoundException('League not found');
    }

    const isMember = league.members.length > 0;
    const isAdmin = league.adminId === userId || league.admins.length > 0;

    if (league.isPrivate && !isMember && !isAdmin) {
      throw new ForbiddenException('Access denied to private league');
    }

    const events = await this.prisma.event.findMany({
      where: { leagueId },
      include: {
        admin: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatar: true,
                isOnline: true,
              },
            },
          },
          orderBy: {
            rank: 'asc',
          },
        },
        rules: true,
        _count: {
          select: {
            participants: true,
          },
        },
      },
      orderBy: {
        startDate: 'desc',
      },
    });

    return events;
  }

  /**
   * Get a specific event by ID
   */
  async getEventById(eventId: string, userId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        admin: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
        league: {
          select: {
            id: true,
            name: true,
          },
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatar: true,
                isOnline: true,
              },
            },
          },
          orderBy: {
            rank: 'asc',
          },
        },
        rules: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        invitations: {
          where: {
            status: InvitationStatus.PENDING,
          },
        },
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Check if user has access to this event
    const isParticipant = event.participants.some(participant => participant.userId === userId);
    const isAdmin = event.adminId === userId;

    if (event.isPrivate && !isParticipant && !isAdmin) {
      throw new ForbiddenException('Access denied to private event');
    }

    return event;
  }

  /**
   * Update event information (admin only)
   */
  async updateEvent(eventId: string, adminId: string, updateEventDto: UpdateEventDto) {
    // Check if user is admin
    await this.verifyAdminAccess(eventId, adminId);

    const {
      title,
      description,
      startDate,
      endDate,
      maxParticipants,
      isPrivate,
      hasScoring,
    } = updateEventDto;

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (startDate !== undefined) updateData.startDate = new Date(startDate);
    if (endDate !== undefined) updateData.endDate = new Date(endDate);
    if (maxParticipants !== undefined) updateData.maxParticipants = maxParticipants;
    if (isPrivate !== undefined) {
      updateData.isPrivate = isPrivate;
      // Generate invite code if making private, remove if making public
      updateData.inviteCode = isPrivate ? this.generateInviteCode() : null;
    }
    if (hasScoring !== undefined) updateData.hasScoring = hasScoring;

    const event = await this.prisma.event.update({
      where: { id: eventId },
      data: updateData,
      include: {
        admin: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
        league: {
          select: {
            id: true,
            name: true,
          },
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatar: true,
                isOnline: true,
              },
            },
          },
          orderBy: {
            rank: 'asc',
          },
        },
        rules: true,
        invitations: true,
      },
    });

    return event;
  }

  /**
   * Join an event (public events or with invite code)
   */
  async joinEvent(eventId: string, userId: string, inviteCode?: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Check if user is already a participant
    const existingParticipant = await this.prisma.eventParticipant.findUnique({
      where: {
        userId_eventId: {
          userId,
          eventId,
        },
      },
    });

    if (existingParticipant) {
      throw new ConflictException('User is already a participant in this event');
    }

    // Check max participants
    if (event.maxParticipants) {
      const participantCount = await this.prisma.eventParticipant.count({
        where: { eventId },
      });

      if (participantCount >= event.maxParticipants) {
        throw new ConflictException('Event is full');
      }
    }

    // Check access for private events
    if (event.isPrivate) {
      if (!inviteCode || event.inviteCode !== inviteCode) {
        throw new ForbiddenException('Invalid invite code for private event');
      }
    }

    // Add user as participant
    const participant = await this.prisma.eventParticipant.create({
      data: {
        userId,
        eventId,
        points: 0,
        rank: 0, // Will be updated by recalculateRankings
      },
    });

    // Recalculate rankings
    await this.recalculateEventRankings(eventId);

    return this.getEventById(eventId, userId);
  }

  /**
   * Leave an event
   */
  async leaveEvent(eventId: string, userId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Prevent admin from leaving if they're the only admin
    if (event.adminId === userId) {
      throw new ForbiddenException('Cannot leave event as admin. Transfer admin rights first.');
    }

    // Remove user from event
    await this.prisma.eventParticipant.delete({
      where: {
        userId_eventId: {
          userId,
          eventId,
        },
      },
    });

    // Recalculate rankings
    await this.recalculateEventRankings(eventId);

    return { success: true };
  }

  /**
   * Add a participant to event (admin only)
   */
  async addParticipant(eventId: string, adminId: string, addParticipantDto: AddParticipantDto) {
    await this.verifyAdminAccess(eventId, adminId);

    const { userId } = addParticipantDto;

    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user is already a participant
    const existingParticipant = await this.prisma.eventParticipant.findUnique({
      where: {
        userId_eventId: {
          userId,
          eventId,
        },
      },
    });

    if (existingParticipant) {
      throw new ConflictException('User is already a participant in this event');
    }

    // Check max participants
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (event?.maxParticipants) {
      const participantCount = await this.prisma.eventParticipant.count({
        where: { eventId },
      });

      if (participantCount >= event.maxParticipants) {
        throw new ConflictException('Event is full');
      }
    }

    // Add user as participant
    const participant = await this.prisma.eventParticipant.create({
      data: {
        userId,
        eventId,
        points: 0,
        rank: 0, // Will be updated by recalculateRankings
      },
    });

    // Recalculate rankings
    await this.recalculateEventRankings(eventId);

    return this.getEventById(eventId, adminId);
  }

  /**
   * Remove a participant from event (admin only)
   */
  async removeParticipant(eventId: string, adminId: string, userId: string) {
    await this.verifyAdminAccess(eventId, adminId);

    // Prevent removing the admin
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (event?.adminId === userId) {
      throw new ForbiddenException('Cannot remove the admin from the event');
    }

    // Remove user from event
    await this.prisma.eventParticipant.delete({
      where: {
        userId_eventId: {
          userId,
          eventId,
        },
      },
    });

    // Recalculate rankings
    await this.recalculateEventRankings(eventId);

    return { success: true };
  }

  /**
   * Create a rule for the event (admin only)
   */
  async createEventRule(eventId: string, adminId: string, createEventRuleDto: CreateEventRuleDto) {
    await this.verifyAdminAccess(eventId, adminId);

    const { title, description, points, category } = createEventRuleDto;

    const rule = await this.prisma.eventRule.create({
      data: {
        eventId,
        title,
        description,
        points,
        category: category as PointCategory,
      },
    });

    return rule;
  }

  /**
   * Assign points to a participant (admin only)
   */
  async assignEventPoints(eventId: string, adminId: string, assignEventPointsDto: AssignEventPointsDto) {
    await this.verifyAdminAccess(eventId, adminId);

    const { userId, points, category, reason } = assignEventPointsDto;

    // Check if user is a participant
    const participant = await this.prisma.eventParticipant.findUnique({
      where: {
        userId_eventId: {
          userId,
          eventId,
        },
      },
    });

    if (!participant) {
      throw new NotFoundException('User is not a participant in this event');
    }

    // Update participant's points
    const updatedParticipant = await this.prisma.eventParticipant.update({
      where: {
        userId_eventId: {
          userId,
          eventId,
        },
      },
      data: {
        points: {
          increment: points,
        },
      },
    });

    // Recalculate rankings
    await this.recalculateEventRankings(eventId);

    // If event is tied to a league, update league points
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: { leagueId: true },
    });

    if (event?.leagueId) {
      await this.updateLeaguePointsFromEvent(event.leagueId, userId, points);
    }

    return {
      participant: updatedParticipant,
      pointsAdded: points,
      category,
      reason,
    };
  }

  /**
   * Create event invitation for non-friends
   */
  async createEventInvitation(eventId: string, adminId: string, createEventInvitationDto: CreateEventInvitationDto) {
    await this.verifyAdminAccess(eventId, adminId);

    const { email, phoneNumber, expiresInDays = 7 } = createEventInvitationDto;

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    const invitation = await this.prisma.eventInvitation.create({
      data: {
        eventId,
        code: this.generateInviteCode(),
        email,
        phoneNumber,
        expiresAt,
        status: InvitationStatus.PENDING,
      },
    });

    return invitation;
  }

  /**
   * Use event invitation code
   */
  async useEventInvitation(eventId: string, userId: string, code: string) {
    const invitation = await this.prisma.eventInvitation.findUnique({
      where: { code },
      include: {
        event: true,
      },
    });

    if (!invitation) {
      throw new NotFoundException('Invalid invitation code');
    }

    if (invitation.eventId !== eventId) {
      throw new ConflictException('Invitation code does not match this event');
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      throw new ConflictException('Invitation is no longer valid');
    }

    if (invitation.expiresAt < new Date()) {
      throw new ConflictException('Invitation has expired');
    }

    // Join the event
    const result = await this.joinEvent(eventId, userId);

    // Update invitation status
    await this.prisma.eventInvitation.update({
      where: { id: invitation.id },
      data: { status: InvitationStatus.ACCEPTED },
    });

    return result;
  }

  /**
   * Get event leaderboard
   */
  async getEventLeaderboard(eventId: string) {
    const participants = await this.prisma.eventParticipant.findMany({
      where: { eventId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
            isOnline: true,
          },
        },
      },
      orderBy: [
        { points: 'desc' },
        { joinedAt: 'asc' }, // Earlier join date for tie-breaking
      ],
    });

    return participants;
  }

  /**
   * Verify that user has admin access to event
   */
  private async verifyAdminAccess(eventId: string, userId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (event.adminId !== userId) {
      throw new ForbiddenException('Admin access required');
    }
  }

  /**
   * Recalculate rankings for all participants in an event
   */
  private async recalculateEventRankings(eventId: string) {
    const participants = await this.prisma.eventParticipant.findMany({
      where: { eventId },
      orderBy: [
        { points: 'desc' },
        { joinedAt: 'asc' },
      ],
    });

    // Update rankings
    for (let i = 0; i < participants.length; i++) {
      await this.prisma.eventParticipant.update({
        where: { id: participants[i].id },
        data: { rank: i + 1 },
      });
    }
  }

  /**
   * Update league points when event points are assigned
   */
  private async updateLeaguePointsFromEvent(leagueId: string, userId: string, points: number) {
    const leagueMember = await this.prisma.leagueMember.findUnique({
      where: {
        userId_leagueId: {
          userId,
          leagueId,
        },
      },
    });

    if (leagueMember) {
      await this.prisma.leagueMember.update({
        where: {
          userId_leagueId: {
            userId,
            leagueId,
          },
        },
        data: {
          points: {
            increment: points,
          },
        },
      });

      // Recalculate league rankings
      await this.recalculateLeagueRankings(leagueId);
    }
  }

  /**
   * Recalculate league rankings
   */
  private async recalculateLeagueRankings(leagueId: string) {
    const members = await this.prisma.leagueMember.findMany({
      where: { leagueId },
      orderBy: [
        { points: 'desc' },
        { joinedAt: 'asc' },
      ],
    });

    // Update rankings
    for (let i = 0; i < members.length; i++) {
      await this.prisma.leagueMember.update({
        where: { id: members[i].id },
        data: { rank: i + 1 },
      });
    }
  }

  /**
   * Generate unique invite code
   */
  private generateInviteCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}
