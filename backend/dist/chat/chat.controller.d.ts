import { ChatService } from './chat.service';
export declare class ChatController {
    private chatService;
    constructor(chatService: ChatService);
    createDirectChat(req: any, body: {
        friendId: string;
    }): Promise<{
        id: string;
        name: string | null;
        type: import(".prisma/client").$Enums.ChatType;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getUserChats(req: any): Promise<{
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
    getChatMessages(chatId: string, page?: string, limit?: string): Promise<({
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
    sendMessage(chatId: string, req: any, body: {
        content: string;
        type?: string;
    }): Promise<{
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
    createGroupChat(req: any, body: {
        name: string;
        description: string;
        participantIds: string[];
    }): Promise<{
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
    addParticipantsToGroup(chatId: string, body: {
        participantIds: string[];
    }): Promise<{
        id: string;
        joinedAt: Date;
        userId: string;
        chatId: string;
    }[]>;
    removeParticipantFromGroup(chatId: string, userId: string): Promise<{
        success: boolean;
    }>;
    updateGroupChat(chatId: string, body: {
        name?: string;
        description?: string;
    }): Promise<{
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
}
