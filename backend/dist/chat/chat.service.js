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
exports.ChatService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../common/prisma.service");
const s3_service_1 = require("../common/s3.service");
const client_1 = require("@prisma/client");
let ChatService = class ChatService {
    constructor(prisma, s3Service) {
        this.prisma = prisma;
        this.s3Service = s3Service;
    }
    async createDirectChat(userId1, userId2) {
        const existingChat = await this.prisma.chat.findFirst({
            where: {
                type: client_1.ChatType.DIRECT,
                participants: {
                    every: {
                        userId: {
                            in: [userId1, userId2],
                        },
                    },
                },
            },
        });
        if (existingChat) {
            return existingChat;
        }
        const chat = await this.prisma.chat.create({
            data: {
                type: client_1.ChatType.DIRECT,
                participants: {
                    create: [
                        { userId: userId1 },
                        { userId: userId2 },
                    ],
                },
            },
            include: {
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
                },
            },
        });
        return chat;
    }
    async getUserChats(userId) {
        const chats = await this.prisma.chat.findMany({
            where: {
                participants: {
                    some: {
                        userId: userId,
                    },
                },
            },
            include: {
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
                    where: {
                        userId: { not: userId },
                    },
                },
                messages: {
                    orderBy: {
                        createdAt: 'desc',
                    },
                    take: 1,
                    include: {
                        sender: {
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
                updatedAt: 'desc',
            },
        });
        const chatsWithUnreadCount = await Promise.all(chats.map(async (chat) => {
            const participant = await this.prisma.chatParticipant.findUnique({
                where: { chatId_userId: { chatId: chat.id, userId } },
            });
            const lastReadAt = participant?.lastReadAt ?? new Date(0);
            const unreadCount = await this.prisma.message.count({
                where: {
                    chatId: chat.id,
                    senderId: { not: userId },
                    createdAt: { gt: lastReadAt },
                },
            });
            return { ...chat, unreadCount };
        }));
        return chatsWithUnreadCount;
    }
    async getChatMessages(chatId, page = 1, limit = 50) {
        const skip = (page - 1) * limit;
        return this.prisma.message.findMany({
            where: {
                chatId: chatId,
            },
            include: {
                sender: {
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
            skip,
            take: limit,
        });
    }
    async sendMessage(chatId, senderId, content, type = client_1.MessageType.TEXT, mediaUrl) {
        if (mediaUrl && !this.s3Service.validateMediaUrl(mediaUrl)) {
            throw new common_1.BadRequestException('Invalid media URL');
        }
        const message = await this.prisma.message.create({
            data: {
                content,
                type,
                senderId,
                chatId,
                mediaUrl,
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        username: true,
                        avatar: true,
                    },
                },
            },
        });
        await this.prisma.chat.update({
            where: { id: chatId },
            data: { updatedAt: new Date() },
        });
        return message;
    }
    async markChatRead(chatId, userId) {
        await this.prisma.chatParticipant.update({
            where: { chatId_userId: { chatId, userId } },
            data: { lastReadAt: new Date() },
        });
        return { success: true };
    }
    async createGroupChat(adminId, name, description, participantIds) {
        const allParticipantIds = [...new Set([adminId, ...participantIds])];
        const chat = await this.prisma.chat.create({
            data: {
                name,
                type: client_1.ChatType.GROUP,
                participants: {
                    create: allParticipantIds.map(userId => ({
                        userId,
                    })),
                },
            },
            include: {
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
                },
            },
        });
        return chat;
    }
    async addParticipantsToGroup(chatId, participantIds) {
        const chat = await this.prisma.chat.findUnique({
            where: { id: chatId },
            select: { type: true },
        });
        if (!chat || chat.type !== client_1.ChatType.GROUP) {
            throw new Error('Can only add participants to group chats');
        }
        const participants = await Promise.all(participantIds.map(userId => this.prisma.chatParticipant.upsert({
            where: {
                chatId_userId: {
                    chatId,
                    userId,
                },
            },
            update: {},
            create: {
                chatId,
                userId,
            },
        })));
        return participants;
    }
    async removeParticipantFromGroup(chatId, userId) {
        const chat = await this.prisma.chat.findUnique({
            where: { id: chatId },
            select: { type: true },
        });
        if (!chat || chat.type !== client_1.ChatType.GROUP) {
            throw new Error('Can only remove participants from group chats');
        }
        await this.prisma.chatParticipant.delete({
            where: {
                chatId_userId: {
                    chatId,
                    userId,
                },
            },
        });
        return { success: true };
    }
    async updateGroupChat(chatId, name, description) {
        const chat = await this.prisma.chat.findUnique({
            where: { id: chatId },
            select: { type: true },
        });
        if (!chat || chat.type !== client_1.ChatType.GROUP) {
            throw new Error('Can only update group chats');
        }
        const updateData = {};
        if (name !== undefined)
            updateData.name = name;
        if (description !== undefined)
            updateData.description = description;
        return this.prisma.chat.update({
            where: { id: chatId },
            data: updateData,
            include: {
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
                },
            },
        });
    }
    async getGroupChatParticipants(chatId) {
        return this.prisma.chatParticipant.findMany({
            where: { chatId },
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
        });
    }
    async addReaction(messageId, userId, emoji) {
        const message = await this.prisma.message.findUnique({
            where: { id: messageId },
            include: { chat: true },
        });
        if (!message) {
            throw new common_1.BadRequestException('Message not found');
        }
        const participant = await this.prisma.chatParticipant.findUnique({
            where: {
                chatId_userId: {
                    chatId: message.chatId,
                    userId: userId,
                },
            },
        });
        if (!participant) {
            throw new common_1.BadRequestException('User is not a participant in this chat');
        }
        const reaction = await this.prisma.messageReaction.upsert({
            where: {
                messageId_userId_emoji: {
                    messageId,
                    userId,
                    emoji,
                },
            },
            update: {
                createdAt: new Date(),
            },
            create: {
                messageId,
                userId,
                emoji,
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
        return reaction;
    }
    async removeReaction(messageId, userId, emoji) {
        const message = await this.prisma.message.findUnique({
            where: { id: messageId },
            include: { chat: true },
        });
        if (!message) {
            throw new common_1.BadRequestException('Message not found');
        }
        const participant = await this.prisma.chatParticipant.findUnique({
            where: {
                chatId_userId: {
                    chatId: message.chatId,
                    userId: userId,
                },
            },
        });
        if (!participant) {
            throw new common_1.BadRequestException('User is not a participant in this chat');
        }
        await this.prisma.messageReaction.deleteMany({
            where: {
                messageId,
                userId,
                emoji,
            },
        });
        return { success: true };
    }
    async getReactions(messageId) {
        const message = await this.prisma.message.findUnique({
            where: { id: messageId },
        });
        if (!message) {
            throw new common_1.BadRequestException('Message not found');
        }
        const reactions = await this.prisma.messageReaction.findMany({
            where: { messageId },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        avatar: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'asc',
            },
        });
        const groupedReactions = reactions.reduce((acc, reaction) => {
            if (!acc[reaction.emoji]) {
                acc[reaction.emoji] = {
                    emoji: reaction.emoji,
                    count: 0,
                    users: [],
                };
            }
            acc[reaction.emoji].count++;
            acc[reaction.emoji].users.push({
                id: reaction.user.id,
                username: reaction.user.username,
                avatar: reaction.user.avatar,
            });
            return acc;
        }, {});
        return Object.values(groupedReactions);
    }
};
exports.ChatService = ChatService;
exports.ChatService = ChatService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        s3_service_1.S3Service])
], ChatService);
//# sourceMappingURL=chat.service.js.map