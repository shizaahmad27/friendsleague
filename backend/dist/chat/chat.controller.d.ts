import { ChatService } from './chat.service';
export declare class ChatController {
    private chatService;
    constructor(chatService: ChatService);
    createDirectChat(req: any, body: {
        friendId: string;
    }): Promise<{
        name: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.ChatType;
    }>;
    getUserChats(req: any): Promise<any[]>;
    getChatMessages(chatId: string, page?: string, limit?: string): Promise<({
        sender: {
            username: string;
            id: string;
            avatar: string;
        };
        replyTo: {
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
            replyToId: string | null;
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
        replyToId: string | null;
    })[]>;
    sendMessage(chatId: string, req: any, body: {
        content: string;
        type?: string;
        mediaUrl?: string;
    }): Promise<{
        sender: {
            username: string;
            id: string;
            avatar: string;
        };
        replyTo: {
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
            replyToId: string | null;
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
        replyToId: string | null;
    }>;
    createGroupChat(req: any, body: {
        name: string;
        description: string;
        participantIds: string[];
    }): Promise<{
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
    addParticipantsToGroup(chatId: string, body: {
        participantIds: string[];
    }): Promise<{
        id: string;
        userId: string;
        joinedAt: Date;
        lastReadAt: Date;
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
    markChatRead(chatId: string, req: any): Promise<{
        success: boolean;
    }>;
    addReaction(messageId: string, req: any, body: {
        emoji: string;
    }): Promise<{
        user: {
            username: string;
            id: string;
            avatar: string;
        };
    } & {
        id: string;
        createdAt: Date;
        userId: string;
        messageId: string;
        emoji: string;
    }>;
    removeReaction(messageId: string, emoji: string, req: any): Promise<{
        success: boolean;
    }>;
    getReactions(messageId: string): Promise<{
        emoji: string;
        count: number;
        users: any[];
    }[]>;
}
