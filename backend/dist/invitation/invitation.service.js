"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvitationService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../common/prisma.service");
const client_1 = require("@prisma/client");
const crypto = __importStar(require("crypto"));
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
    async useInviteCode(userId, code) {
        const usersMissingCodes = await this.prisma.user.findMany({
            where: { inviteCode: null },
            select: { id: true },
            take: 1000,
        });
        if (usersMissingCodes.length > 0) {
            for (const u of usersMissingCodes) {
                const newCode = this.generateSecureInviteCode(u.id);
                try {
                    await this.prisma.user.update({ where: { id: u.id }, data: { inviteCode: newCode } });
                }
                catch (e) {
                }
            }
        }
        const inviter = await this.prisma.user.findUnique({
            where: { inviteCode: code },
            select: { id: true, username: true },
        });
        if (!inviter) {
            throw new common_1.NotFoundException('Invalid invite code');
        }
        if (inviter.id === userId) {
            throw new common_1.BadRequestException('Cannot use your own invite code');
        }
        const existingFriendship = await this.prisma.friendship.findFirst({
            where: {
                OR: [
                    { userId, friendId: inviter.id },
                    { userId: inviter.id, friendId: userId },
                ],
            },
        });
        if (existingFriendship) {
            throw new common_1.ConflictException('Friendship already exists');
        }
        const result = await this.prisma.$transaction(async (tx) => {
            const friendship1 = await tx.friendship.create({
                data: {
                    userId,
                    friendId: inviter.id,
                    status: 'ACCEPTED',
                },
            });
            await tx.friendship.create({
                data: {
                    userId: inviter.id,
                    friendId: userId,
                    status: 'ACCEPTED',
                },
            });
            return friendship1;
        });
        return {
            success: true,
            message: `Successfully connected with ${inviter.username}!`,
            friendshipId: result.id,
        };
    }
    async getMyInviteCode(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                username: true,
            },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        let code = null;
        code = this.generateSecureInviteCode(userId);
        try {
            await this.prisma.user.update({ where: { id: userId }, data: { inviteCode: code } });
        }
        catch (_) {
        }
        return {
            code,
            username: user.username,
        };
    }
    generateSecureInviteCode(userId) {
        const secret = process.env.INVITE_CODE_SECRET || process.env.JWT_SECRET || 'fallback-secret-change-me';
        const hmac = crypto.createHmac('sha256', secret).update(userId).digest('hex');
        return hmac.substring(0, 8).toUpperCase();
    }
};
exports.InvitationService = InvitationService;
exports.InvitationService = InvitationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], InvitationService);
//# sourceMappingURL=invitation.service.js.map