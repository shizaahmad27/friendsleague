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
        name: string | null;
        type: import(".prisma/client").$Enums.ChatType;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getUserChats(userId: string): Promise<any[]>;
    getChatMessages(chatId: string, page?: number, limit?: number): Promise<({
        sender: {
            id: string;
            username: string;
            avatar: string;
        };
        replyTo: {
            sender: {
                id: string;
                username: string;
                avatar: string;
            };
        } & {
            id: string;
            type: import(".prisma/client").$Enums.MessageType;
            createdAt: Date;
            updatedAt: Date;
            chatId: string;
            content: string;
            senderId: string;
            mediaUrl: string | null;
            replyToId: string | null;
        };
    } & {
        id: string;
        type: import(".prisma/client").$Enums.MessageType;
        createdAt: Date;
        updatedAt: Date;
        chatId: string;
        content: string;
        senderId: string;
        mediaUrl: string | null;
        replyToId: string | null;
    })[]>;
    sendMessage(chatId: string, senderId: string, content: string, type?: MessageType, mediaUrl?: string, replyToId?: string): Promise<{
        sender: {
            id: string;
            username: string;
            avatar: string;
        };
        replyTo: {
            sender: {
                id: string;
                username: string;
                avatar: string;
            };
        } & {
            id: string;
            type: import(".prisma/client").$Enums.MessageType;
            createdAt: Date;
            updatedAt: Date;
            chatId: string;
            content: string;
            senderId: string;
            mediaUrl: string | null;
            replyToId: string | null;
        };
    } & {
        id: string;
        type: import(".prisma/client").$Enums.MessageType;
        createdAt: Date;
        updatedAt: Date;
        chatId: string;
        content: string;
        senderId: string;
        mediaUrl: string | null;
        replyToId: string | null;
    }>;
    markChatRead(chatId: string, userId: string): Promise<{
        success: boolean;
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
            joinedAt: Date;
            lastReadAt: Date;
            userId: string;
            chatId: string;
        })[];
    } & {
        id: string;
        name: string | null;
        type: import(".prisma/client").$Enums.ChatType;
        createdAt: Date;
        updatedAt: Date;
    }>;
    addParticipantsToGroup(chatId: string, participantIds: string[]): Promise<{
        id: string;
        joinedAt: Date;
        lastReadAt: Date;
        userId: string;
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
            joinedAt: Date;
            lastReadAt: Date;
            userId: string;
            chatId: string;
        })[];
    } & {
        id: string;
        name: string | null;
        type: import(".prisma/client").$Enums.ChatType;
        createdAt: Date;
        updatedAt: Date;
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
        joinedAt: Date;
        lastReadAt: Date;
        userId: string;
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
}
