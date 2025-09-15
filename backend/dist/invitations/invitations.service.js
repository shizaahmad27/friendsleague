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
exports.InvitationsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../common/prisma.service");
const crypto = __importStar(require("crypto"));
let InvitationsService = class InvitationsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createInvitation(userId, createInvitationDto) {
        const { inviteeId } = createInvitationDto;
        if (userId === inviteeId) {
            throw new common_1.BadRequestException('Cannot invite yourself');
        }
        const invitee = await this.prisma.user.findUnique({
            where: { id: inviteeId },
        });
        if (!invitee) {
            throw new common_1.NotFoundException('User not found');
        }
        const existingFriendship = await this.prisma.friendship.findFirst({
            where: {
                OR: [
                    { userId, friendId: inviteeId },
                    { userId: inviteeId, friendId: userId },
                ],
            },
        });
        if (existingFriendship) {
            throw new common_1.ConflictException('Friendship already exists');
        }
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
            throw new common_1.ConflictException('Invitation already exists');
        }
        const code = this.generateInviteCode();
        const invitation = await this.prisma.invitation.create({
            data: {
                code,
                inviterId: userId,
                inviteeId,
                expiredAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
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
    async getInvitations(userId) {
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
    async useInvitation(userId, useInvitationDto) {
        const { code } = useInvitationDto;
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
            throw new common_1.NotFoundException('Invalid invite code');
        }
        if (invitation.expiredAt < new Date()) {
            throw new common_1.BadRequestException('Invite code has expired');
        }
        if (invitation.status !== 'PENDING') {
            throw new common_1.BadRequestException('Invite code has already been used');
        }
        if (invitation.inviterId === userId) {
            throw new common_1.BadRequestException('Cannot use your own invite code');
        }
        const existingFriendship = await this.prisma.friendship.findFirst({
            where: {
                OR: [
                    { userId, friendId: invitation.inviterId },
                    { userId: invitation.inviterId, friendId: userId },
                ],
            },
        });
        if (existingFriendship) {
            throw new common_1.ConflictException('Friendship already exists');
        }
        const result = await this.prisma.$transaction(async (tx) => {
            const friendship = await tx.friendship.create({
                data: {
                    userId,
                    friendId: invitation.inviterId,
                    status: 'ACCEPTED',
                },
            });
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
        const code = this.generateUserInviteCode(userId);
        return {
            code,
            username: user.username,
        };
    }
    generateInviteCode() {
        return crypto.randomBytes(4).toString('hex').toUpperCase();
    }
    generateUserInviteCode(userId) {
        const hash = crypto.createHash('md5').update(userId).digest('hex');
        return hash.substring(0, 8).toUpperCase();
    }
    mapToResponseDto(invitation) {
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
};
exports.InvitationsService = InvitationsService;
exports.InvitationsService = InvitationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], InvitationsService);
//# sourceMappingURL=invitations.service.js.map