import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { ChatType, MessageType } from '@prisma/client';

@Injectable()
export class ChatService {
constructor(private prisma: PrismaService) {}

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
        return this.prisma.chat.findMany({
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
    
        async sendMessage(chatId: string, senderId: string, content: string, type: MessageType = MessageType.TEXT) {
            const message = await this.prisma.message.create({
              data: {
                content,
                type,
                senderId,
                chatId,
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
        
            return message;
          }
    }
