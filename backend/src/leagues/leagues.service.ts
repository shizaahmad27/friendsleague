import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { PointCategory } from '@prisma/client';
import { CreateLeagueDto, UpdateLeagueDto, AddMemberDto, CreateRuleDto, AssignPointsDto, UpdateRuleDto } from './dto/leagues.dto';

@Injectable()
export class LeaguesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new league
   * Creator automatically becomes admin and first member
   */
  async createLeague(adminId: string, createLeagueDto: CreateLeagueDto) {
    const { name, description, isPrivate } = createLeagueDto;

    // Generate unique invite code for private leagues
    const inviteCode = isPrivate ? this.generateInviteCode() : null;

    const league = await this.prisma.league.create({
      data: {
        name,
        description,
        adminId,
        isPrivate,
        inviteCode,
        members: {
          create: {
            userId: adminId,
            points: 0,
            rank: 1,
          },
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
        members: {
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
        admins: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    return league;
  }

  /**
   * Get all leagues (public leagues + user's leagues)
   */
  async getLeagues(userId: string) {
    const leagues = await this.prisma.league.findMany({
      where: {
        OR: [
          { isPrivate: false }, // Public leagues
          { members: { some: { userId } } }, // User is a member
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
        members: {
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
            members: true,
            events: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return leagues;
  }

  /**
   * Get a specific league by ID
   */
  async getLeagueById(leagueId: string, userId: string) {
    const league = await this.prisma.league.findUnique({
      where: { id: leagueId },
      include: {
        admin: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
        members: {
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
        events: {
          include: {
            participants: {
              include: {
                user: {
                  select: {
                    id: true,
                    username: true,
                    avatar: true,
                  },
                },
              },
            },
          },
          orderBy: {
            startDate: 'desc',
          },
        },
        admins: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    if (!league) {
      throw new NotFoundException('League not found');
    }

    // Check if user has access to this league
    const isMember = league.members.some(member => member.userId === userId);
    const isAdmin = league.adminId === userId || league.admins.some(admin => admin.userId === userId);
    
    if (league.isPrivate && !isMember && !isAdmin) {
      throw new ForbiddenException('Access denied to private league');
    }

    return league;
  }

  /**
   * Update league information (admin only)
   */
  async updateLeague(leagueId: string, adminId: string, updateLeagueDto: UpdateLeagueDto) {
    // Check if user is admin
    await this.verifyAdminAccess(leagueId, adminId);

    const { name, description, isPrivate } = updateLeagueDto;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (isPrivate !== undefined) {
      updateData.isPrivate = isPrivate;
      // Generate invite code if making private, remove if making public
      updateData.inviteCode = isPrivate ? this.generateInviteCode() : null;
    }

    const league = await this.prisma.league.update({
      where: { id: leagueId },
      data: updateData,
      include: {
        admin: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
        members: {
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
        admins: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    return league;
  }

  /**
   * Join a league (public leagues or with invite code)
   */
  async joinLeague(leagueId: string, userId: string, inviteCode?: string) {
    const league = await this.prisma.league.findUnique({
      where: { id: leagueId },
    });

    if (!league) {
      throw new NotFoundException('League not found');
    }

    // Check if user is already a member
    const existingMember = await this.prisma.leagueMember.findUnique({
      where: {
        userId_leagueId: {
          userId,
          leagueId,
        },
      },
    });

    if (existingMember) {
      throw new ConflictException('User is already a member of this league');
    }

    // Check access for private leagues
    if (league.isPrivate) {
      if (!inviteCode || league.inviteCode !== inviteCode) {
        throw new ForbiddenException('Invalid invite code for private league');
      }
    }

    // Add user as member
    const member = await this.prisma.leagueMember.create({
      data: {
        userId,
        leagueId,
        points: 0,
        rank: 0, // Will be updated by recalculateRankings
      },
    });

    // Recalculate rankings
    await this.recalculateRankings(leagueId);

    return this.getLeagueById(leagueId, userId);
  }

  /**
   * Leave a league
   */
  async leaveLeague(leagueId: string, userId: string) {
    const league = await this.prisma.league.findUnique({
      where: { id: leagueId },
    });

    if (!league) {
      throw new NotFoundException('League not found');
    }

    // Prevent admin from leaving if they're the only admin
    if (league.adminId === userId) {
      const adminCount = await this.prisma.leagueAdmin.count({
        where: { leagueId },
      });

      if (adminCount === 0) {
        throw new ForbiddenException('Cannot leave league as the only admin. Transfer admin rights first.');
      }
    }

    // Remove user from league
    await this.prisma.leagueMember.delete({
      where: {
        userId_leagueId: {
          userId,
          leagueId,
        },
      },
    });

    // Remove admin rights if user was an admin
    await this.prisma.leagueAdmin.deleteMany({
      where: {
        userId,
        leagueId,
      },
    });

    // Recalculate rankings
    await this.recalculateRankings(leagueId);

    return { success: true };
  }

  /**
   * Add a member to league (admin only)
   */
  async addMember(leagueId: string, adminId: string, addMemberDto: AddMemberDto) {
    await this.verifyAdminAccess(leagueId, adminId);

    const { userId } = addMemberDto;

    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user is already a member
    const existingMember = await this.prisma.leagueMember.findUnique({
      where: {
        userId_leagueId: {
          userId,
          leagueId,
        },
      },
    });

    if (existingMember) {
      throw new ConflictException('User is already a member of this league');
    }

    // Add user as member
    const member = await this.prisma.leagueMember.create({
      data: {
        userId,
        leagueId,
        points: 0,
        rank: 0, // Will be updated by recalculateRankings
      },
    });

    // Recalculate rankings
    await this.recalculateRankings(leagueId);

    return this.getLeagueById(leagueId, adminId);
  }

  /**
   * Get members of a league (authorized users only)
   */
  async getMembers(leagueId: string, requesterId: string) {
    // Ensure requester has access
    const league = await this.getLeagueById(leagueId, requesterId);

    const [members, delegatedAdmins] = await Promise.all([
      this.prisma.leagueMember.findMany({
      where: { leagueId },
      include: {
        user: {
          select: { id: true, username: true, avatar: true },
        },
      },
      orderBy: [{ rank: 'asc' }],
    }),
      this.prisma.leagueAdmin.findMany({
        where: { leagueId },
        select: { userId: true },
      }),
    ]);

    const delegatedAdminSet = new Set(delegatedAdmins.map(a => a.userId));

    return members.map(m => ({
      userId: m.userId,
      username: m.user.username,
      avatar: m.user.avatar || undefined,
      isAdmin: m.userId === league.adminId || delegatedAdminSet.has(m.userId),
      joinedAt: (m as any).joinedAt ?? new Date(0),
      totalPoints: m.points,
    }));
  }

  /**
   * Remove a member from league (admin only)
   */
  async removeMember(leagueId: string, adminId: string, userId: string) {
    await this.verifyAdminAccess(leagueId, adminId);

    // Prevent removing the main admin
    const league = await this.prisma.league.findUnique({
      where: { id: leagueId },
    });

    if (league?.adminId === userId) {
      throw new ForbiddenException('Cannot remove the main admin from the league');
    }

    // Remove user from league
    await this.prisma.leagueMember.delete({
      where: {
        userId_leagueId: {
          userId,
          leagueId,
        },
      },
    });

    // Remove admin rights if user was an admin
    await this.prisma.leagueAdmin.deleteMany({
      where: {
        userId,
        leagueId,
      },
    });

    // Recalculate rankings
    await this.recalculateRankings(leagueId);

    return { success: true };
  }

  /**
   * Grant admin rights to a member (admin only)
   */
  async grantAdminRights(leagueId: string, adminId: string, userId: string) {
    await this.verifyAdminAccess(leagueId, adminId);

    // Check if user is a member
    const member = await this.prisma.leagueMember.findUnique({
      where: {
        userId_leagueId: {
          userId,
          leagueId,
        },
      },
    });

    if (!member) {
      throw new NotFoundException('User is not a member of this league');
    }

    // Check if user is already an admin
    const existingAdmin = await this.prisma.leagueAdmin.findUnique({
      where: {
        userId_leagueId: {
          userId,
          leagueId,
        },
      },
    });

    if (existingAdmin) {
      throw new ConflictException('User already has admin rights');
    }

    // Grant admin rights
    const admin = await this.prisma.leagueAdmin.create({
      data: {
        userId,
        leagueId,
        grantedBy: adminId,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    return admin;
  }

  /**
   * Revoke admin rights from a member (admin only)
   */
  async revokeAdminRights(leagueId: string, adminId: string, userId: string) {
    await this.verifyAdminAccess(leagueId, adminId);

    // Prevent revoking admin rights from the main admin
    const league = await this.prisma.league.findUnique({
      where: { id: leagueId },
    });

    if (league?.adminId === userId) {
      throw new ForbiddenException('Cannot revoke admin rights from the main admin');
    }

    // Revoke admin rights
    await this.prisma.leagueAdmin.delete({
      where: {
        userId_leagueId: {
          userId,
          leagueId,
        },
      },
    });

    return { success: true };
  }

  /**
   * Create a rule for the league (admin only)
   */
  async createRule(leagueId: string, adminId: string, createRuleDto: CreateRuleDto) {
    await this.verifyAdminAccess(leagueId, adminId);

    const { title, description, points, category } = createRuleDto;

    const rule = await this.prisma.leagueRule.create({
      data: {
        leagueId,
        title,
        description,
        points,
        category: category as PointCategory,
      },
    });

    return rule;
  }

  /**
   * Get rules for a league (authorized users only)
   */
  async getRules(leagueId: string, requesterId: string) {
    // Ensure requester has access
    await this.getLeagueById(leagueId, requesterId);

    const rules = await this.prisma.leagueRule.findMany({
      where: { leagueId },
      orderBy: { createdAt: 'desc' },
    });
    return rules;
  }

  /**
   * Update a rule (admin only)
   */
  async updateRule(leagueId: string, adminId: string, ruleId: string, updateRuleDto: UpdateRuleDto) {
    await this.verifyAdminAccess(leagueId, adminId);

    // Ensure rule belongs to league
    const rule = await this.prisma.leagueRule.findUnique({ where: { id: ruleId } });
    if (!rule || rule.leagueId !== leagueId) {
      throw new NotFoundException('Rule not found');
    }

    const updated = await this.prisma.leagueRule.update({
      where: { id: ruleId },
      data: {
        title: updateRuleDto.title ?? undefined,
        description: updateRuleDto.description ?? undefined,
        points: updateRuleDto.points ?? undefined,
        category: updateRuleDto.category ?? undefined as any,
      },
    });

    return updated;
  }

  /**
   * Assign points to a member (admin only)
   */
  async assignPoints(leagueId: string, adminId: string, assignPointsDto: AssignPointsDto) {
    await this.verifyAdminAccess(leagueId, adminId);

    const { userId, points, category, reason } = assignPointsDto;

    // Check if user is a member
    const member = await this.prisma.leagueMember.findUnique({
      where: {
        userId_leagueId: {
          userId,
          leagueId,
        },
      },
    });

    if (!member) {
      throw new NotFoundException('User is not a member of this league');
    }

    // Update member's points
    const updatedMember = await this.prisma.leagueMember.update({
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

    // Recalculate rankings
    await this.recalculateRankings(leagueId);

    return {
      member: updatedMember,
      pointsAdded: points,
      category,
      reason,
    };
  }

  /**
   * Get league leaderboard
   */
  async getLeaderboard(leagueId: string) {
    const members = await this.prisma.leagueMember.findMany({
      where: { leagueId },
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

    // Map to mobile-expected shape
    return members.map((m) => ({
      userId: m.userId,
      username: m.user.username,
      avatar: m.user.avatar || undefined,
      totalPoints: m.points,
      rank: m.rank,
    }));
  }

  /**
   * Verify that user has admin access to league
   */
  private async verifyAdminAccess(leagueId: string, userId: string) {
    const league = await this.prisma.league.findUnique({
      where: { id: leagueId },
      include: {
        admins: {
          where: { userId },
        },
      },
    });

    if (!league) {
      throw new NotFoundException('League not found');
    }

    const isMainAdmin = league.adminId === userId;
    const isDelegatedAdmin = league.admins.length > 0;

    if (!isMainAdmin && !isDelegatedAdmin) {
      throw new ForbiddenException('Admin access required');
    }
  }

  /**
   * Recalculate rankings for all members in a league
   */
  private async recalculateRankings(leagueId: string) {
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
