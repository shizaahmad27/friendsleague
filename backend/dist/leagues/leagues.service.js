"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeaguesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../common/prisma.service");
let LeaguesService = class LeaguesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createLeague(adminId, createLeagueDto) {
        const { name, description, isPrivate } = createLeagueDto;
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
    async getLeagues(userId) {
        const leagues = await this.prisma.league.findMany({
            where: {
                OR: [
                    { isPrivate: false },
                    { members: { some: { userId } } },
                    { adminId: userId },
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
    async getLeagueById(leagueId, userId) {
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
            throw new common_1.NotFoundException('League not found');
        }
        const isMember = league.members.some(member => member.userId === userId);
        const isAdmin = league.adminId === userId || league.admins.some(admin => admin.userId === userId);
        if (league.isPrivate && !isMember && !isAdmin) {
            throw new common_1.ForbiddenException('Access denied to private league');
        }
        return league;
    }
    async updateLeague(leagueId, adminId, updateLeagueDto) {
        await this.verifyAdminAccess(leagueId, adminId);
        const { name, description, isPrivate } = updateLeagueDto;
        const updateData = {};
        if (name !== undefined)
            updateData.name = name;
        if (description !== undefined)
            updateData.description = description;
        if (isPrivate !== undefined) {
            updateData.isPrivate = isPrivate;
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
    async joinLeague(leagueId, userId, inviteCode) {
        const league = await this.prisma.league.findUnique({
            where: { id: leagueId },
        });
        if (!league) {
            throw new common_1.NotFoundException('League not found');
        }
        const existingMember = await this.prisma.leagueMember.findUnique({
            where: {
                userId_leagueId: {
                    userId,
                    leagueId,
                },
            },
        });
        if (existingMember) {
            throw new common_1.ConflictException('User is already a member of this league');
        }
        if (league.isPrivate) {
            if (!inviteCode || league.inviteCode !== inviteCode) {
                throw new common_1.ForbiddenException('Invalid invite code for private league');
            }
        }
        const member = await this.prisma.leagueMember.create({
            data: {
                userId,
                leagueId,
                points: 0,
                rank: 0,
            },
        });
        await this.recalculateRankings(leagueId);
        return this.getLeagueById(leagueId, userId);
    }
    async leaveLeague(leagueId, userId) {
        const league = await this.prisma.league.findUnique({
            where: { id: leagueId },
        });
        if (!league) {
            throw new common_1.NotFoundException('League not found');
        }
        if (league.adminId === userId) {
            const adminCount = await this.prisma.leagueAdmin.count({
                where: { leagueId },
            });
            if (adminCount === 0) {
                throw new common_1.ForbiddenException('Cannot leave league as the only admin. Transfer admin rights first.');
            }
        }
        await this.prisma.leagueMember.delete({
            where: {
                userId_leagueId: {
                    userId,
                    leagueId,
                },
            },
        });
        await this.prisma.leagueAdmin.deleteMany({
            where: {
                userId,
                leagueId,
            },
        });
        await this.recalculateRankings(leagueId);
        return { success: true };
    }
    async addMember(leagueId, adminId, addMemberDto) {
        await this.verifyAdminAccess(leagueId, adminId);
        const { userId } = addMemberDto;
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const existingMember = await this.prisma.leagueMember.findUnique({
            where: {
                userId_leagueId: {
                    userId,
                    leagueId,
                },
            },
        });
        if (existingMember) {
            throw new common_1.ConflictException('User is already a member of this league');
        }
        const member = await this.prisma.leagueMember.create({
            data: {
                userId,
                leagueId,
                points: 0,
                rank: 0,
            },
        });
        await this.recalculateRankings(leagueId);
        return this.getLeagueById(leagueId, adminId);
    }
    async getMembers(leagueId, requesterId) {
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
            joinedAt: m.joinedAt ?? new Date(0),
            totalPoints: m.points,
        }));
    }
    async removeMember(leagueId, adminId, userId) {
        await this.verifyAdminAccess(leagueId, adminId);
        const league = await this.prisma.league.findUnique({
            where: { id: leagueId },
        });
        if (league?.adminId === userId) {
            throw new common_1.ForbiddenException('Cannot remove the main admin from the league');
        }
        await this.prisma.leagueMember.delete({
            where: {
                userId_leagueId: {
                    userId,
                    leagueId,
                },
            },
        });
        await this.prisma.leagueAdmin.deleteMany({
            where: {
                userId,
                leagueId,
            },
        });
        await this.recalculateRankings(leagueId);
        return { success: true };
    }
    async grantAdminRights(leagueId, adminId, userId) {
        await this.verifyAdminAccess(leagueId, adminId);
        const member = await this.prisma.leagueMember.findUnique({
            where: {
                userId_leagueId: {
                    userId,
                    leagueId,
                },
            },
        });
        if (!member) {
            throw new common_1.NotFoundException('User is not a member of this league');
        }
        const existingAdmin = await this.prisma.leagueAdmin.findUnique({
            where: {
                userId_leagueId: {
                    userId,
                    leagueId,
                },
            },
        });
        if (existingAdmin) {
            throw new common_1.ConflictException('User already has admin rights');
        }
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
    async revokeAdminRights(leagueId, adminId, userId) {
        await this.verifyAdminAccess(leagueId, adminId);
        const league = await this.prisma.league.findUnique({
            where: { id: leagueId },
        });
        if (league?.adminId === userId) {
            throw new common_1.ForbiddenException('Cannot revoke admin rights from the main admin');
        }
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
    async createRule(leagueId, adminId, createRuleDto) {
        await this.verifyAdminAccess(leagueId, adminId);
        const { title, description, points, category } = createRuleDto;
        const rule = await this.prisma.leagueRule.create({
            data: {
                leagueId,
                title,
                description,
                points,
                category: category,
            },
        });
        return rule;
    }
    async getRules(leagueId, requesterId) {
        await this.getLeagueById(leagueId, requesterId);
        const rules = await this.prisma.leagueRule.findMany({
            where: { leagueId },
            orderBy: { createdAt: 'desc' },
        });
        return rules;
    }
    async updateRule(leagueId, adminId, ruleId, updateRuleDto) {
        await this.verifyAdminAccess(leagueId, adminId);
        const rule = await this.prisma.leagueRule.findUnique({ where: { id: ruleId } });
        if (!rule || rule.leagueId !== leagueId) {
            throw new common_1.NotFoundException('Rule not found');
        }
        const updated = await this.prisma.leagueRule.update({
            where: { id: ruleId },
            data: {
                title: updateRuleDto.title ?? undefined,
                description: updateRuleDto.description ?? undefined,
                points: updateRuleDto.points ?? undefined,
                category: updateRuleDto.category ?? undefined,
            },
        });
        return updated;
    }
    async assignPoints(leagueId, adminId, assignPointsDto) {
        await this.verifyAdminAccess(leagueId, adminId);
        const { userId, points, category, reason } = assignPointsDto;
        const member = await this.prisma.leagueMember.findUnique({
            where: {
                userId_leagueId: {
                    userId,
                    leagueId,
                },
            },
        });
        if (!member) {
            throw new common_1.NotFoundException('User is not a member of this league');
        }
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
        await this.recalculateRankings(leagueId);
        return {
            member: updatedMember,
            pointsAdded: points,
            category,
            reason,
        };
    }
    async getLeaderboard(leagueId) {
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
                { joinedAt: 'asc' },
            ],
        });
        return members.map((m) => ({
            userId: m.userId,
            username: m.user.username,
            avatar: m.user.avatar || undefined,
            totalPoints: m.points,
            rank: m.rank,
        }));
    }
    async verifyAdminAccess(leagueId, userId) {
        const league = await this.prisma.league.findUnique({
            where: { id: leagueId },
            include: {
                admins: {
                    where: { userId },
                },
            },
        });
        if (!league) {
            throw new common_1.NotFoundException('League not found');
        }
        const isMainAdmin = league.adminId === userId;
        const isDelegatedAdmin = league.admins.length > 0;
        if (!isMainAdmin && !isDelegatedAdmin) {
            throw new common_1.ForbiddenException('Admin access required');
        }
    }
    async recalculateRankings(leagueId) {
        const members = await this.prisma.leagueMember.findMany({
            where: { leagueId },
            orderBy: [
                { points: 'desc' },
                { joinedAt: 'asc' },
            ],
        });
        for (let i = 0; i < members.length; i++) {
            await this.prisma.leagueMember.update({
                where: { id: members[i].id },
                data: { rank: i + 1 },
            });
        }
    }
    generateInviteCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 8; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }
};
exports.LeaguesService = LeaguesService;
exports.LeaguesService = LeaguesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], LeaguesService);
//# sourceMappingURL=leagues.service.js.map