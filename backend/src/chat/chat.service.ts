import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { S3Service } from '../common/s3.service';
import { ChatType, MessageType } from '@prisma/client';

@Injectable()
export class ChatService {
constructor(
    private prisma: PrismaService,
    private s3Service: S3Service,
) {}

async createDirectChat(userId1: string, userId2: string) {
    // Check if chat already exists
    const existingChat = await this.prisma.chat.findFirst({
        where: {
        type: ChatType.DIRECT,
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

    
// Create new direct chat
const chat = await this.prisma.chat.create({
    data: {
        type: ChatType.DIRECT,
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

    async getUserChats(userId: string) {
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

        // Compute unread using lastReadAt
        const chatsWithUnreadCount = await Promise.all(
          chats.map(async (chat) => {
            const participant = await this.prisma.chatParticipant.findUnique({
              where: { chatId_userId: { chatId: chat.id, userId } },
            });
            const lastReadAt = (participant as any)?.lastReadAt ?? new Date(0);
            const unreadCount = await this.prisma.message.count({
              where: {
                chatId: chat.id,
                senderId: { not: userId },
                createdAt: { gt: lastReadAt },
              },
            });
            return { ...chat, unreadCount } as any;
          })
        );

        return chatsWithUnreadCount;
        }

    async getChatMessages(chatId: string, page = 1, limit = 50) {
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
    
        async sendMessage(chatId: string, senderId: string, content: string, type: MessageType = MessageType.TEXT, mediaUrl?: string) {
            // Validate mediaUrl if provided
            if (mediaUrl && !this.s3Service.validateMediaUrl(mediaUrl)) {
                throw new BadRequestException('Invalid media URL');
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
        
            // Update chat's updatedAt
            await this.prisma.chat.update({
              where: { id: chatId },
              data: { updatedAt: new Date() },
            });
            // Do not update readers here; they will mark read on open
        
            return message;
          }

    async markChatRead(chatId: string, userId: string) {
        await this.prisma.chatParticipant.update({
            where: { chatId_userId: { chatId, userId } },
            data: { lastReadAt: new Date() } as any,
        });
        return { success: true };
    }

    async createGroupChat(adminId: string, name: string, description: string, participantIds: string[]) {
        // Ensure admin is included in participants
        const allParticipantIds = [...new Set([adminId, ...participantIds])];

        const chat = await this.prisma.chat.create({
            data: {
                name,
                type: ChatType.GROUP,
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

    async addParticipantsToGroup(chatId: string, participantIds: string[]) {
        // Check if chat is a group chat
        const chat = await this.prisma.chat.findUnique({
            where: { id: chatId },
            select: { type: true },
        });

        if (!chat || chat.type !== ChatType.GROUP) {
            throw new Error('Can only add participants to group chats');
        }

        // Add participants (ignore duplicates)
        const participants = await Promise.all(
            participantIds.map(userId =>
                this.prisma.chatParticipant.upsert({
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
                })
            )
        );

        return participants;
    }

    async removeParticipantFromGroup(chatId: string, userId: string) {
        // Check if chat is a group chat
        const chat = await this.prisma.chat.findUnique({
            where: { id: chatId },
            select: { type: true },
        });

        if (!chat || chat.type !== ChatType.GROUP) {
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

    async updateGroupChat(chatId: string, name?: string, description?: string) {
        // Check if chat is a group chat
        const chat = await this.prisma.chat.findUnique({
            where: { id: chatId },
            select: { type: true },
        });

        if (!chat || chat.type !== ChatType.GROUP) {
            throw new Error('Can only update group chats');
        }

        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (description !== undefined) updateData.description = description;

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

    async getGroupChatParticipants(chatId: string) {
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
    }
