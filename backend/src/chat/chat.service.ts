import { Injectable, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { S3Service } from '../common/s3.service';
import { ChatType, MessageType } from '@prisma/client';
import { ChatGateway } from './chat.gateway';

@Injectable()
export class ChatService {
constructor(
    private prisma: PrismaService,
    private s3Service: S3Service,
    @Inject(forwardRef(() => ChatGateway))
    private chatGateway: ChatGateway,
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

    // Emit socket event to both users about new chat
    this.chatGateway.server.to(userId1).emit('newChat', chat);
    this.chatGateway.server.to(userId2).emit('newChat', chat);

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
        
        const messages = await this.prisma.message.findMany({
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
            replyTo: {
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
            reactions: {
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
            },
            readReceipts: {
                include: {
                    user: {
                        select: { id: true, username: true, avatar: true },
                    },
                },
                orderBy: { readAt: 'asc' },
            },
            },
            orderBy: {
            createdAt: 'desc',
            },
            skip,
            take: limit,
        });

        // Transform reactions to match frontend format
        return messages.map(message => ({
            ...message,
            reactions: this.groupReactions(message.reactions),
        }));
        }
    
        async sendMessage(chatId: string, senderId: string, content: string, type: MessageType = MessageType.TEXT, mediaUrl?: string, replyToId?: string, isEphemeral?: boolean, ephemeralViewDuration?: number) {
            // Validate mediaUrl if provided
            if (mediaUrl && !this.s3Service.validateMediaUrl(mediaUrl)) {
                throw new BadRequestException('Invalid media URL');
            }

            // Validate replyToId if provided
            if (replyToId) {
                const replyToMessage = await this.prisma.message.findUnique({
                    where: { id: replyToId },
                    include: { chat: true },
                });

                if (!replyToMessage) {
                    throw new BadRequestException('Reply message not found');
                }

                if (replyToMessage.chatId !== chatId) {
                    throw new BadRequestException('Reply message is not in the same chat');
                }
            }

            // Validate ephemeral parameters
            if (isEphemeral && ephemeralViewDuration !== null && ephemeralViewDuration !== undefined) {
                // Allow -1 for "Play Once" (videos only), or 1-300 seconds for timer
                if (ephemeralViewDuration !== -1 && (ephemeralViewDuration < 1 || ephemeralViewDuration > 300)) {
                    throw new BadRequestException('Ephemeral view duration must be -1 (Play Once), null (Loop/Unlimited), or between 1 and 300 seconds');
                }
            }

            const message = await this.prisma.message.create({
              data: {
                content,
                type,
                senderId,
                chatId,
                mediaUrl,
                replyToId,
                isEphemeral: isEphemeral || false,
                ephemeralViewDuration: ephemeralViewDuration || null,
              },
              include: {
                sender: {
                  select: {
                    id: true,
                    username: true,
                    avatar: true,
                  },
                },
                replyTo: {
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
            });
        
            // Update chat's updatedAt
            await this.prisma.chat.update({
              where: { id: chatId },
              data: { updatedAt: new Date() },
            });
            // Do not update readers here; they will mark read on open

            // Emit socket event for new message to chat room
            this.chatGateway.server.to(chatId).emit('newMessage', message);
            
            // Also emit to sender's personal room for immediate visibility
            this.chatGateway.server.to(senderId).emit('newMessage', message);

            // Emit unread count updates to all participants except sender
            const participants = await this.prisma.chatParticipant.findMany({
                where: { chatId },
                select: { userId: true },
            });

            for (const participant of participants) {
                if (participant.userId !== senderId) {
                    const unreadCount = await this.getUnreadCount(participant.userId);
                    this.chatGateway.server.to(participant.userId).emit('unreadCountUpdate', {
                        userId: participant.userId,
                        unreadCount,
                    });
                }
            }
        
            return message;
          }

    async markEphemeralAsViewed(messageId: string, userId: string) {
        // Find the message and verify it's ephemeral
        const message = await this.prisma.message.findUnique({
            where: { id: messageId },
            include: { sender: true, chat: true },
        });

        if (!message) {
            throw new BadRequestException('Message not found');
        }

        if (!message.isEphemeral) {
            throw new BadRequestException('Message is not ephemeral');
        }

        // Check if already viewed
        if (message.ephemeralViewedAt) {
            throw new BadRequestException('Ephemeral message has already been viewed');
        }

        // Check if user is a participant in the chat
        const participant = await this.prisma.chatParticipant.findUnique({
            where: { chatId_userId: { chatId: message.chatId, userId } },
        });

        if (!participant) {
            throw new BadRequestException('User is not a participant in this chat');
        }

        // Mark as viewed
        const updatedMessage = await this.prisma.message.update({
            where: { id: messageId },
            data: {
                ephemeralViewedAt: new Date(),
                ephemeralViewedBy: userId,
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

        // Emit socket event to notify all participants about the viewed status
        console.log(`📡 Emitting ephemeralViewed to chat room: ${message.chatId}`);
        this.chatGateway.server.to(message.chatId).emit('ephemeralViewed', {
            messageId,
            viewedBy: userId,
            viewedAt: updatedMessage.ephemeralViewedAt,
        });
        
        // Also emit to sender's personal room for immediate notification
        console.log(`📡 Emitting ephemeralViewed to sender room: ${message.senderId}`);
        this.chatGateway.server.to(message.senderId).emit('ephemeralViewed', {
            messageId,
            viewedBy: userId,
            viewedAt: updatedMessage.ephemeralViewedAt,
        });

        return updatedMessage;
    }

    async markChatRead(chatId: string, userId: string) {
        await this.prisma.chatParticipant.update({
            where: { chatId_userId: { chatId, userId } },
            data: { lastReadAt: new Date() } as any,
        });
        return { success: true };
    }

    async markMessagesAsRead(chatId: string, userId: string, messageIds: string[]) {
        // Check if user has read receipts enabled
        const participant = await this.prisma.chatParticipant.findUnique({
            where: { chatId_userId: { chatId, userId } },
        });

        if (!participant?.readReceiptsEnabled) {
            return { success: true, readReceiptsDisabled: true };
        }

        // Bulk create read receipts
        const readReceipts = await Promise.all(
            messageIds.map(messageId =>
                this.prisma.messageReadReceipt.upsert({
                    where: { messageId_userId: { messageId, userId } },
                    update: { readAt: new Date() },
                    create: { messageId, userId },
                    include: {
                        user: {
                            select: { id: true, username: true, avatar: true },
                        },
                    },
                })
            )
        );

        // Emit socket event for real-time updates
        this.chatGateway.server.to(chatId).emit('messagesRead', {
            chatId,
            userId,
            messageIds,
            readAt: new Date(),
        });

        return { success: true, readReceipts };
    }

    async getMessageReadReceipts(messageId: string) {
        const receipts = await this.prisma.messageReadReceipt.findMany({
            where: { messageId },
            include: {
                user: {
                    select: { id: true, username: true, avatar: true },
                },
            },
            orderBy: { readAt: 'asc' },
        });

        return receipts;
    }

    async toggleReadReceipts(chatId: string, userId: string, enabled: boolean) {
        await this.prisma.chatParticipant.update({
            where: { chatId_userId: { chatId, userId } },
            data: { readReceiptsEnabled: enabled },
        });

        return { success: true, enabled };
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

    // Message Reaction Methods
    async addReaction(messageId: string, userId: string, emoji: string) {
        // Check if message exists
        const message = await this.prisma.message.findUnique({
            where: { id: messageId },
            include: { chat: true },
        });

        if (!message) {
            throw new BadRequestException('Message not found');
        }

        // Check if user is participant in the chat
        const participant = await this.prisma.chatParticipant.findUnique({
            where: {
                chatId_userId: {
                    chatId: message.chatId,
                    userId: userId,
                },
            },
        });

        if (!participant) {
            throw new BadRequestException('User is not a participant in this chat');
        }

        // Add or update reaction (upsert)
        const reaction = await this.prisma.messageReaction.upsert({
            where: {
                messageId_userId_emoji: {
                    messageId,
                    userId,
                    emoji,
                },
            },
            update: {
                createdAt: new Date(), // Update timestamp if reaction already exists
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

        // Emit socket event for real-time reaction updates
        this.chatGateway.server.to(message.chatId).emit('reactionAdded', {
            messageId,
            userId,
            emoji,
            reaction,
        });

        return reaction;
    }

    async removeReaction(messageId: string, userId: string, emoji: string) {
        // Check if message exists
        const message = await this.prisma.message.findUnique({
            where: { id: messageId },
            include: { chat: true },
        });

        if (!message) {
            throw new BadRequestException('Message not found');
        }

        // Check if user is participant in the chat
        const participant = await this.prisma.chatParticipant.findUnique({
            where: {
                chatId_userId: {
                    chatId: message.chatId,
                    userId: userId,
                },
            },
        });

        if (!participant) {
            throw new BadRequestException('User is not a participant in this chat');
        }

        // Remove reaction
        await this.prisma.messageReaction.deleteMany({
            where: {
                messageId,
                userId,
                emoji,
            },
        });

        // Emit socket event for real-time reaction updates
        this.chatGateway.server.to(message.chatId).emit('reactionRemoved', {
            messageId,
            userId,
            emoji,
        });

        return { success: true };
    }

    async getReactions(messageId: string) {
        // Check if message exists
        const message = await this.prisma.message.findUnique({
            where: { id: messageId },
        });

        if (!message) {
            throw new BadRequestException('Message not found');
        }

        // Get all reactions for the message
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

        // Group reactions by emoji
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
        }, {} as Record<string, { emoji: string; count: number; users: any[] }>);

        return Object.values(groupedReactions);
    }

    // Helper method to group reactions by emoji
    private groupReactions(reactions: any[]) {
        if (!reactions || reactions.length === 0) {
            return [];
        }

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

    async getUnreadCount(userId: string): Promise<number> {
        // Get all chats where user is a participant
        const userChats = await this.prisma.chatParticipant.findMany({
            where: { userId },
            select: { chatId: true, lastReadAt: true },
        });

        let totalUnread = 0;

        for (const chatParticipant of userChats) {
            const unreadInChat = await this.prisma.message.count({
                where: {
                    chatId: chatParticipant.chatId,
                    senderId: { not: userId },
                    createdAt: { gt: chatParticipant.lastReadAt },
                },
            });
            totalUnread += unreadInChat;
        }

        return totalUnread;
    }
}
