import { PrismaService } from '../common/prisma.service';
import { MessageType } from '@prisma/client';
export declare class ChatService {
    private prisma;
    constructor(prisma: PrismaService);
    createDirectChat(userId1: string, userId2: string): Promise<{
        id: string;
        name: string | null;
        type: import(".prisma/client").$Enums.ChatType;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getUserChats(userId: string): Promise<{
        unreadCount: number;
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
            userId: string;
            chatId: string;
        })[];
        messages: ({
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
        })[];
        id: string;
        name: string | null;
        type: import(".prisma/client").$Enums.ChatType;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    getChatMessages(chatId: string, page?: number, limit?: number): Promise<({
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
    })[]>;
    sendMessage(chatId: string, senderId: string, content: string, type?: MessageType): Promise<{
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
        userId: string;
        chatId: string;
    })[]>;
}
