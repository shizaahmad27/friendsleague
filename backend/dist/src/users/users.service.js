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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../common/prisma.service");
const bcrypt = __importStar(require("bcryptjs"));
const crypto = __importStar(require("crypto"));
let UsersService = class UsersService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createUserDto) {
        const { username, email, phoneNumber, password } = createUserDto;
        const normalizedEmail = email && email.trim() !== '' ? email.trim() : null;
        const normalizedPhoneNumber = phoneNumber && phoneNumber.trim() !== '' ? phoneNumber.trim() : null;
        const existingUser = await this.prisma.user.findFirst({
            where: {
                OR: [
                    { username },
                    ...(normalizedEmail ? [{ email: normalizedEmail }] : []),
                    ...(normalizedPhoneNumber ? [{ phoneNumber: normalizedPhoneNumber }] : []),
                ],
            },
        });
        if (existingUser) {
            if (existingUser.username === username) {
                throw new common_1.ConflictException('Username already exists');
            }
            if (normalizedEmail && existingUser.email === normalizedEmail) {
                throw new common_1.ConflictException('Email already exists');
            }
            if (normalizedPhoneNumber && existingUser.phoneNumber === normalizedPhoneNumber) {
                throw new common_1.ConflictException('Phone number already exists');
            }
        }
        const hashedPassword = await bcrypt.hash(password, 12);
        const user = await this.prisma.user.create({
            data: {
                username,
                email: normalizedEmail,
                phoneNumber: normalizedPhoneNumber,
                password: hashedPassword,
            },
        });
        const finalInviteCode = this.generateInviteCode(user.id);
        try {
            await this.prisma.user.update({
                where: { id: user.id },
                data: { inviteCode: finalInviteCode },
            });
        }
        catch (_) {
        }
        const { password: _, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }
    async findByUsername(username) {
        return this.prisma.user.findUnique({
            where: { username },
        });
    }
    async findByEmail(email) {
        return this.prisma.user.findUnique({
            where: { email },
        });
    }
    async findById(id) {
        const user = await this.prisma.user.findUnique({
            where: { id },
        });
        if (!user)
            return null;
        const { password: _, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }
    async update(id, updateUserDto) {
        const user = await this.prisma.user.findUnique({
            where: { id },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const updatedUser = await this.prisma.user.update({
            where: { id },
            data: updateUserDto,
        });
        const { password: _, ...userWithoutPassword } = updatedUser;
        return userWithoutPassword;
    }
    async updateProfile(id, updateProfileDto) {
        const user = await this.prisma.user.findUnique({
            where: { id },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        if (updateProfileDto.username && updateProfileDto.username !== user.username) {
            const existingUser = await this.prisma.user.findUnique({
                where: { username: updateProfileDto.username },
            });
            if (existingUser) {
                throw new common_1.ConflictException('Username already exists');
            }
        }
        const updateData = {};
        if (updateProfileDto.username) {
            updateData.username = updateProfileDto.username;
        }
        if (updateProfileDto.bio !== undefined) {
            updateData.bio = updateProfileDto.bio || null;
        }
        if (updateProfileDto.avatar !== undefined) {
            updateData.avatar = updateProfileDto.avatar || null;
        }
        const updatedUser = await this.prisma.user.update({
            where: { id },
            data: updateData,
        });
        const { password: _, ...userWithoutPassword } = updatedUser;
        return userWithoutPassword;
    }
    async updateOnlineStatus(id, isOnline) {
        await this.prisma.user.update({
            where: { id },
            data: {
                isOnline,
                lastSeen: new Date(),
            },
        });
        return {
            success: true,
            message: `User status updated to ${isOnline ? 'online' : 'offline'}`,
        };
    }
    async validatePassword(password, hashedPassword) {
        return bcrypt.compare(password, hashedPassword);
    }
    async searchUsers(username) {
        const users = await this.prisma.user.findMany({
            where: {
                username: {
                    contains: username,
                    mode: 'insensitive',
                },
            },
            select: {
                id: true,
                username: true,
                email: true,
                phoneNumber: true,
                inviteCode: true,
                avatar: true,
                bio: true,
                isOnline: true,
                lastSeen: true,
                showOnlineStatus: true,
                createdAt: true,
                updatedAt: true,
            },
            take: 10,
            orderBy: {
                username: 'asc',
            },
        });
        return users;
    }
    async getUserFriends(userId) {
        const friendships = await this.prisma.friendship.findMany({
            where: {
                userId,
                status: 'ACCEPTED',
            },
            include: {
                friend: {
                    select: {
                        id: true,
                        username: true,
                        email: true,
                        phoneNumber: true,
                        inviteCode: true,
                        avatar: true,
                        bio: true,
                        isOnline: true,
                        lastSeen: true,
                        showOnlineStatus: true,
                        createdAt: true,
                        updatedAt: true,
                    },
                },
            },
            orderBy: {
                updatedAt: 'desc',
            },
        });
        return friendships.map(friendship => friendship.friend);
    }
    generateInviteCode(userId) {
        const secret = process.env.INVITE_CODE_SECRET || process.env.JWT_SECRET || 'fallback-secret-change-me';
        const hmac = crypto.createHmac('sha256', secret).update(userId).digest('hex');
        return hmac.substring(0, 8).toUpperCase();
    }
    async getPrivacySettings(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { showOnlineStatus: true },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const friendSettings = await this.prisma.userPrivacySettings.findMany({
            where: { userId },
            select: { targetUserId: true, hideOnlineStatus: true },
        });
        return {
            global: { showOnlineStatus: user.showOnlineStatus },
            friends: friendSettings.map(setting => ({
                friendId: setting.targetUserId,
                hideOnlineStatus: setting.hideOnlineStatus,
            })),
        };
    }
    async updateGlobalOnlineStatus(userId, showOnlineStatus) {
        await this.prisma.user.update({
            where: { id: userId },
            data: { showOnlineStatus },
        });
        return {
            success: true,
            message: `Global online status visibility updated to ${showOnlineStatus ? 'visible' : 'hidden'}`,
        };
    }
    async updateFriendOnlineStatusVisibility(userId, targetUserId, hideOnlineStatus) {
        await this.prisma.userPrivacySettings.upsert({
            where: {
                userId_targetUserId: {
                    userId,
                    targetUserId,
                },
            },
            update: { hideOnlineStatus },
            create: {
                userId,
                targetUserId,
                hideOnlineStatus,
            },
        });
        return {
            success: true,
            message: `Online status visibility for friend updated to ${hideOnlineStatus ? 'hidden' : 'visible'}`,
        };
    }
    async getFriendOnlineStatusVisibility(userId, targetUserId) {
        const setting = await this.prisma.userPrivacySettings.findUnique({
            where: {
                userId_targetUserId: {
                    userId,
                    targetUserId,
                },
            },
        });
        return setting?.hideOnlineStatus || false;
    }
    async canUserSeeOnlineStatus(viewerId, targetUserId) {
        const targetUser = await this.prisma.user.findUnique({
            where: { id: targetUserId },
            select: { showOnlineStatus: true },
        });
        if (!targetUser || !targetUser.showOnlineStatus) {
            return false;
        }
        const privacySetting = await this.prisma.userPrivacySettings.findUnique({
            where: {
                userId_targetUserId: {
                    userId: targetUserId,
                    targetUserId: viewerId,
                },
            },
        });
        return !privacySetting?.hideOnlineStatus;
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map