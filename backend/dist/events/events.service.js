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
exports.EventsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../common/prisma.service");
const client_1 = require("@prisma/client");
let EventsService = class EventsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createEvent(adminId, createEventDto) {
        const { title, description, leagueId, startDate, endDate, maxParticipants, isPrivate, hasScoring, participantIds, } = createEventDto;
        const inviteCode = isPrivate ? this.generateInviteCode() : null;
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
                        rank: 0,
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
        await this.recalculateEventRankings(event.id);
        return event;
    }
    async getEventParticipants(eventId, userId) {
        await this.getEventById(eventId, userId);
        const participants = await this.prisma.eventParticipant.findMany({
            where: { eventId },
            include: {
                user: {
                    select: { id: true, username: true, avatar: true, isOnline: true },
                },
            },
            orderBy: [
                { rank: 'asc' },
                { joinedAt: 'asc' },
            ],
        });
        return participants;
    }
    async getEventRules(eventId, userId) {
        await this.getEventById(eventId, userId);
        const rules = await this.prisma.eventRule.findMany({
            where: { eventId },
            orderBy: { createdAt: 'desc' },
        });
        return rules;
    }
    async getEvents(userId) {
        const events = await this.prisma.event.findMany({
            where: {
                OR: [
                    { isPrivate: false },
                    { participants: { some: { userId } } },
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
    async getLeagueEvents(leagueId, userId) {
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
            throw new common_1.NotFoundException('League not found');
        }
        const isMember = league.members.length > 0;
        const isAdmin = league.adminId === userId || league.admins.length > 0;
        if (league.isPrivate && !isMember && !isAdmin) {
            throw new common_1.ForbiddenException('Access denied to private league');
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
    async getEventById(eventId, userId) {
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
                        status: client_1.InvitationStatus.PENDING,
                    },
                },
            },
        });
        if (!event) {
            throw new common_1.NotFoundException('Event not found');
        }
        const isParticipant = event.participants.some(participant => participant.userId === userId);
        const isAdmin = event.adminId === userId;
        if (event.isPrivate && !isParticipant && !isAdmin) {
            throw new common_1.ForbiddenException('Access denied to private event');
        }
        return event;
    }
    async updateEvent(eventId, adminId, updateEventDto) {
        await this.verifyAdminAccess(eventId, adminId);
        const { title, description, startDate, endDate, maxParticipants, isPrivate, hasScoring, } = updateEventDto;
        const updateData = {};
        if (title !== undefined)
            updateData.title = title;
        if (description !== undefined)
            updateData.description = description;
        if (startDate !== undefined)
            updateData.startDate = new Date(startDate);
        if (endDate !== undefined)
            updateData.endDate = new Date(endDate);
        if (maxParticipants !== undefined)
            updateData.maxParticipants = maxParticipants;
        if (isPrivate !== undefined) {
            updateData.isPrivate = isPrivate;
            updateData.inviteCode = isPrivate ? this.generateInviteCode() : null;
        }
        if (hasScoring !== undefined)
            updateData.hasScoring = hasScoring;
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
    async joinEvent(eventId, userId, inviteCode) {
        const event = await this.prisma.event.findUnique({
            where: { id: eventId },
        });
        if (!event) {
            throw new common_1.NotFoundException('Event not found');
        }
        const existingParticipant = await this.prisma.eventParticipant.findUnique({
            where: {
                eventId_userId: {
                    eventId,
                    userId,
                },
            },
        });
        if (existingParticipant) {
            throw new common_1.ConflictException('User is already a participant in this event');
        }
        if (event.maxParticipants) {
            const participantCount = await this.prisma.eventParticipant.count({
                where: { eventId },
            });
            if (participantCount >= event.maxParticipants) {
                throw new common_1.ConflictException('Event is full');
            }
        }
        if (event.isPrivate) {
            if (!inviteCode || event.inviteCode !== inviteCode) {
                throw new common_1.ForbiddenException('Invalid invite code for private event');
            }
        }
        const participant = await this.prisma.eventParticipant.create({
            data: {
                userId,
                eventId,
                points: 0,
                rank: 0,
            },
        });
        await this.recalculateEventRankings(eventId);
        return this.getEventById(eventId, userId);
    }
    async leaveEvent(eventId, userId) {
        const event = await this.prisma.event.findUnique({
            where: { id: eventId },
        });
        if (!event) {
            throw new common_1.NotFoundException('Event not found');
        }
        if (event.adminId === userId) {
            throw new common_1.ForbiddenException('Cannot leave event as admin. Transfer admin rights first.');
        }
        await this.prisma.eventParticipant.delete({
            where: {
                eventId_userId: {
                    eventId,
                    userId,
                },
            },
        });
        await this.recalculateEventRankings(eventId);
        return { success: true };
    }
    async addParticipant(eventId, adminId, addParticipantDto) {
        await this.verifyAdminAccess(eventId, adminId);
        const { userId } = addParticipantDto;
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const existingParticipant = await this.prisma.eventParticipant.findUnique({
            where: {
                eventId_userId: {
                    eventId,
                    userId,
                },
            },
        });
        if (existingParticipant) {
            throw new common_1.ConflictException('User is already a participant in this event');
        }
        const event = await this.prisma.event.findUnique({
            where: { id: eventId },
        });
        if (event?.maxParticipants) {
            const participantCount = await this.prisma.eventParticipant.count({
                where: { eventId },
            });
            if (participantCount >= event.maxParticipants) {
                throw new common_1.ConflictException('Event is full');
            }
        }
        const participant = await this.prisma.eventParticipant.create({
            data: {
                userId,
                eventId,
                points: 0,
                rank: 0,
            },
        });
        await this.recalculateEventRankings(eventId);
        return this.getEventById(eventId, adminId);
    }
    async removeParticipant(eventId, adminId, userId) {
        await this.verifyAdminAccess(eventId, adminId);
        const event = await this.prisma.event.findUnique({
            where: { id: eventId },
        });
        if (event?.adminId === userId) {
            throw new common_1.ForbiddenException('Cannot remove the admin from the event');
        }
        await this.prisma.eventParticipant.delete({
            where: {
                eventId_userId: {
                    eventId,
                    userId,
                },
            },
        });
        await this.recalculateEventRankings(eventId);
        return { success: true };
    }
    async createEventRule(eventId, adminId, createEventRuleDto) {
        await this.verifyAdminAccess(eventId, adminId);
        const { title, description, points, category } = createEventRuleDto;
        const rule = await this.prisma.eventRule.create({
            data: {
                eventId,
                title,
                description,
                points,
                category: category,
            },
        });
        return rule;
    }
    async assignEventPoints(eventId, adminId, assignEventPointsDto) {
        await this.verifyAdminAccess(eventId, adminId);
        const { userId, points, category, reason } = assignEventPointsDto;
        const participant = await this.prisma.eventParticipant.findUnique({
            where: {
                eventId_userId: {
                    eventId,
                    userId,
                },
            },
        });
        if (!participant) {
            throw new common_1.NotFoundException('User is not a participant in this event');
        }
        const updatedParticipant = await this.prisma.eventParticipant.update({
            where: {
                eventId_userId: {
                    eventId,
                    userId,
                },
            },
            data: {
                points: {
                    increment: points,
                },
            },
        });
        await this.recalculateEventRankings(eventId);
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
    async createEventInvitation(eventId, adminId, createEventInvitationDto) {
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
                status: client_1.InvitationStatus.PENDING,
            },
        });
        return invitation;
    }
    async useEventInvitation(eventId, userId, code) {
        const invitation = await this.prisma.eventInvitation.findUnique({
            where: { code },
            include: {
                event: true,
            },
        });
        if (!invitation) {
            throw new common_1.NotFoundException('Invalid invitation code');
        }
        if (invitation.eventId !== eventId) {
            throw new common_1.ConflictException('Invitation code does not match this event');
        }
        if (invitation.status !== client_1.InvitationStatus.PENDING) {
            throw new common_1.ConflictException('Invitation is no longer valid');
        }
        if (invitation.expiresAt < new Date()) {
            throw new common_1.ConflictException('Invitation has expired');
        }
        const result = await this.joinEvent(eventId, userId);
        await this.prisma.eventInvitation.update({
            where: { id: invitation.id },
            data: { status: client_1.InvitationStatus.ACCEPTED },
        });
        return result;
    }
    async getEventLeaderboard(eventId) {
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
                { joinedAt: 'asc' },
            ],
        });
        return participants;
    }
    async verifyAdminAccess(eventId, userId) {
        const event = await this.prisma.event.findUnique({
            where: { id: eventId },
        });
        if (!event) {
            throw new common_1.NotFoundException('Event not found');
        }
        if (event.adminId !== userId) {
            throw new common_1.ForbiddenException('Admin access required');
        }
    }
    async recalculateEventRankings(eventId) {
        const participants = await this.prisma.eventParticipant.findMany({
            where: { eventId },
            orderBy: [
                { points: 'desc' },
                { joinedAt: 'asc' },
            ],
        });
        for (let i = 0; i < participants.length; i++) {
            await this.prisma.eventParticipant.update({
                where: { id: participants[i].id },
                data: { rank: i + 1 },
            });
        }
    }
    async updateLeaguePointsFromEvent(leagueId, userId, points) {
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
            await this.recalculateLeagueRankings(leagueId);
        }
    }
    async recalculateLeagueRankings(leagueId) {
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
exports.EventsService = EventsService;
exports.EventsService = EventsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], EventsService);
//# sourceMappingURL=events.service.js.map