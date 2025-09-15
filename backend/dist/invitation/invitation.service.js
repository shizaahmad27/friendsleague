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
exports.InvitationService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../common/prisma.service");
const client_1 = require("@prisma/client");
let InvitationService = class InvitationService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createInvitation(inviterId, inviteeId) {
        const inviter = await this.prisma.user.findUnique({
            where: { id: inviterId },
        });
        if (!inviter) {
            throw new common_1.NotFoundException('Inviter not found');
        }
        const invitee = await this.prisma.user.findUnique({
            where: { id: inviteeId },
        });
        if (!invitee) {
            throw new common_1.NotFoundException('Invitee not found');
        }
        const existingInvitation = await this.prisma.invitation.findFirst({
            where: {
                inviterId,
                inviteeId,
                status: client_1.FriendshipStatus.PENDING,
            },
        });
        if (existingInvitation) {
            throw new common_1.ConflictException('Invitation already exists');
        }
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
            throw new common_1.ConflictException('Users are already friends');
        }
        const invitation = await this.prisma.invitation.create({
            data: {
                code: `invite_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                inviterId,
                inviteeId,
                status: client_1.FriendshipStatus.PENDING,
                expiredAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
            include: {
                inviter: true,
                invitee: true,
            },
        });
        return invitation;
    }
    async getInvitations(userId) {
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
    async getPendingInvitations(userId) {
        const invitations = await this.prisma.invitation.findMany({
            where: {
                inviteeId: userId,
                status: client_1.FriendshipStatus.PENDING,
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
    async acceptInvitation(invitationId, userId) {
        const invitation = await this.prisma.invitation.findUnique({
            where: { id: invitationId },
            include: {
                inviter: true,
                invitee: true,
            },
        });
        if (!invitation) {
            throw new common_1.NotFoundException('Invitation not found');
        }
        if (invitation.inviteeId !== userId) {
            throw new common_1.BadRequestException('You can only accept invitations sent to you');
        }
        if (invitation.status !== client_1.FriendshipStatus.PENDING) {
            throw new common_1.BadRequestException('Invitation is not pending');
        }
        const updatedInvitation = await this.prisma.invitation.update({
            where: { id: invitationId },
            data: { status: client_1.FriendshipStatus.ACCEPTED },
            include: {
                inviter: true,
                invitee: true,
            },
        });
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
    async rejectInvitation(invitationId, userId) {
        const invitation = await this.prisma.invitation.findUnique({
            where: { id: invitationId },
            include: {
                inviter: true,
                invitee: true,
            },
        });
        if (!invitation) {
            throw new common_1.NotFoundException('Invitation not found');
        }
        if (invitation.inviteeId !== userId) {
            throw new common_1.BadRequestException('You can only reject invitations sent to you');
        }
        if (invitation.status !== client_1.FriendshipStatus.PENDING) {
            throw new common_1.BadRequestException('Invitation is not pending');
        }
        const updatedInvitation = await this.prisma.invitation.update({
            where: { id: invitationId },
            data: { status: client_1.FriendshipStatus.BLOCKED },
            include: {
                inviter: true,
                invitee: true,
            },
        });
        return updatedInvitation;
    }
    async cancelInvitation(invitationId, userId) {
        const invitation = await this.prisma.invitation.findUnique({
            where: { id: invitationId },
            include: {
                inviter: true,
                invitee: true,
            },
        });
        if (!invitation) {
            throw new common_1.NotFoundException('Invitation not found');
        }
        if (invitation.inviterId !== userId) {
            throw new common_1.BadRequestException('You can only cancel invitations you sent');
        }
        if (invitation.status !== client_1.FriendshipStatus.PENDING) {
            throw new common_1.BadRequestException('Invitation is not pending');
        }
        const updatedInvitation = await this.prisma.invitation.update({
            where: { id: invitationId },
            data: { status: client_1.FriendshipStatus.BLOCKED },
            include: {
                inviter: true,
                invitee: true,
            },
        });
        return updatedInvitation;
    }
};
exports.InvitationService = InvitationService;
exports.InvitationService = InvitationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], InvitationService);
//# sourceMappingURL=invitation.service.js.map