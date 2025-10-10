import { PrismaService } from '../common/prisma.service';
import { S3Service } from '../common/s3.service';
import { MessageType } from '@prisma/client';
export declare class ChatService {
    private prisma;
    private s3Service;
    constructor(prisma: PrismaService, s3Service: S3Service);
    createDirectChat(userId1: string, userId2: string): Promise<{
        name: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.ChatType;
    }>;
    getUserChats(userId: string): Promise<any[]>;
    getChatMessages(chatId: string, page?: number, limit?: number): Promise<({
        sender: {
            username: string;
            id: string;
            avatar: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.MessageType;
        mediaUrl: string | null;
        chatId: string;
        content: string;
        senderId: string;
    })[]>;
    sendMessage(chatId: string, senderId: string, content: string, type?: MessageType, mediaUrl?: string): Promise<{
        sender: {
            username: string;
            id: string;
            avatar: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.MessageType;
        mediaUrl: string | null;
        chatId: string;
        content: string;
        senderId: string;
    }>;
    markChatRead(chatId: string, userId: string): Promise<{
        success: boolean;
    }>;
    createGroupChat(adminId: string, name: string, description: string, participantIds: string[]): Promise<{
        participants: ({
            user: {
                username: string;
                id: string;
                avatar: string;
                isOnline: boolean;
            };
        } & {
            id: string;
            userId: string;
            joinedAt: Date;
            lastReadAt: Date;
            chatId: string;
        })[];
    } & {
        name: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.ChatType;
    }>;
    addParticipantsToGroup(chatId: string, participantIds: string[]): Promise<{
        id: string;
        userId: string;
        joinedAt: Date;
        lastReadAt: Date;
        chatId: string;
    }[]>;
    removeParticipantFromGroup(chatId: string, userId: string): Promise<{
        success: boolean;
    }>;
    updateGroupChat(chatId: string, name?: string, description?: string): Promise<{
        participants: ({
            user: {
                username: string;
                id: string;
                avatar: string;
                isOnline: boolean;
            };
        } & {
            id: string;
            userId: string;
            joinedAt: Date;
            lastReadAt: Date;
            chatId: string;
        })[];
    } & {
        name: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.ChatType;
    }>;
    getGroupChatParticipants(chatId: string): Promise<({
        user: {
            username: string;
            id: string;
            avatar: string;
            isOnline: boolean;
        };
    } & {
        id: string;
        userId: string;
        joinedAt: Date;
        lastReadAt: Date;
        chatId: string;
    })[]>;
}
