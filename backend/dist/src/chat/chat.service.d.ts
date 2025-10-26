import { PrismaService } from '../common/prisma.service';
import { S3Service } from '../common/s3.service';
import { MessageType } from '@prisma/client';
import { ChatGateway } from './chat.gateway';
export declare class ChatService {
    private prisma;
    private s3Service;
    private chatGateway;
    constructor(prisma: PrismaService, s3Service: S3Service, chatGateway: ChatGateway);
    createDirectChat(userId1: string, userId2: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string | null;
        type: import(".prisma/client").$Enums.ChatType;
    }>;
    getUserChats(userId: string): Promise<any[]>;
    getChatMessages(chatId: string, page?: number, limit?: number): Promise<{
        reactions: unknown[];
        readReceipts: ({
            user: {
                id: string;
                username: string;
                avatar: string;
            };
        } & {
            id: string;
            userId: string;
            messageId: string;
            readAt: Date;
        })[];
        replyTo: {
            sender: {
                id: string;
                username: string;
                avatar: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            type: import(".prisma/client").$Enums.MessageType;
            chatId: string;
            content: string;
            mediaUrl: string | null;
            senderId: string;
            replyToId: string | null;
        };
        sender: {
            id: string;
            username: string;
            avatar: string;
        };
        id: string;
        createdAt: Date;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.MessageType;
        chatId: string;
        content: string;
        mediaUrl: string | null;
        senderId: string;
        replyToId: string | null;
    }[]>;
    sendMessage(chatId: string, senderId: string, content: string, type?: MessageType, mediaUrl?: string, replyToId?: string): Promise<{
        replyTo: {
            sender: {
                id: string;
                username: string;
                avatar: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            type: import(".prisma/client").$Enums.MessageType;
            chatId: string;
            content: string;
            mediaUrl: string | null;
            senderId: string;
            replyToId: string | null;
        };
        sender: {
            id: string;
            username: string;
            avatar: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.MessageType;
        chatId: string;
        content: string;
        mediaUrl: string | null;
        senderId: string;
        replyToId: string | null;
    }>;
    markChatRead(chatId: string, userId: string): Promise<{
        success: boolean;
    }>;
    markMessagesAsRead(chatId: string, userId: string, messageIds: string[]): Promise<{
        success: boolean;
        readReceiptsDisabled: boolean;
        readReceipts?: undefined;
    } | {
        success: boolean;
        readReceipts: ({
            user: {
                id: string;
                username: string;
                avatar: string;
            };
        } & {
            id: string;
            userId: string;
            messageId: string;
            readAt: Date;
        })[];
        readReceiptsDisabled?: undefined;
    }>;
    getMessageReadReceipts(messageId: string): Promise<({
        user: {
            id: string;
            username: string;
            avatar: string;
        };
    } & {
        id: string;
        userId: string;
        messageId: string;
        readAt: Date;
    })[]>;
    toggleReadReceipts(chatId: string, userId: string, enabled: boolean): Promise<{
        success: boolean;
        enabled: boolean;
    }>;
    createGroupChat(adminId: string, name: string, description: string, participantIds: string[]): Promise<{
        participants: ({
            user: {
                id: string;
                username: string;
                avatar: string;
                isOnline: boolean;
            };
        } & {
            id: string;
            userId: string;
            joinedAt: Date;
            lastReadAt: Date;
            readReceiptsEnabled: boolean;
            chatId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string | null;
        type: import(".prisma/client").$Enums.ChatType;
    }>;
    addParticipantsToGroup(chatId: string, participantIds: string[]): Promise<{
        id: string;
        userId: string;
        joinedAt: Date;
        lastReadAt: Date;
        readReceiptsEnabled: boolean;
        chatId: string;
    }[]>;
    removeParticipantFromGroup(chatId: string, userId: string): Promise<{
        success: boolean;
    }>;
    updateGroupChat(chatId: string, name?: string, description?: string): Promise<{
        participants: ({
            user: {
                id: string;
                username: string;
                avatar: string;
                isOnline: boolean;
            };
        } & {
            id: string;
            userId: string;
            joinedAt: Date;
            lastReadAt: Date;
            readReceiptsEnabled: boolean;
            chatId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string | null;
        type: import(".prisma/client").$Enums.ChatType;
    }>;
    getGroupChatParticipants(chatId: string): Promise<({
        user: {
            id: string;
            username: string;
            avatar: string;
            isOnline: boolean;
        };
    } & {
        id: string;
        userId: string;
        joinedAt: Date;
        lastReadAt: Date;
        readReceiptsEnabled: boolean;
        chatId: string;
    })[]>;
    addReaction(messageId: string, userId: string, emoji: string): Promise<{
        user: {
            id: string;
            username: string;
            avatar: string;
        };
    } & {
        id: string;
        createdAt: Date;
        userId: string;
        messageId: string;
        emoji: string;
    }>;
    removeReaction(messageId: string, userId: string, emoji: string): Promise<{
        success: boolean;
    }>;
    getReactions(messageId: string): Promise<{
        emoji: string;
        count: number;
        users: any[];
    }[]>;
    private groupReactions;
}
