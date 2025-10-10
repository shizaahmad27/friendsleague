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
    getUserChats(req: any): Promise<any[]>;
    getChatMessages(chatId: string, page?: string, limit?: string): Promise<({
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
    sendMessage(chatId: string, req: any, body: {
        content: string;
        type?: string;
        mediaUrl?: string;
        replyToId?: string;
    }): Promise<{
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
    addParticipantsToGroup(chatId: string, body: {
        participantIds: string[];
    }): Promise<{
        id: string;
        joinedAt: Date;
        lastReadAt: Date;
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
    markChatRead(chatId: string, req: any): Promise<{
        success: boolean;
    }>;
    addReaction(messageId: string, req: any, body: {
        emoji: string;
    }): Promise<{
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
    removeReaction(messageId: string, emoji: string, req: any): Promise<{
        success: boolean;
    }>;
    getReactions(messageId: string): Promise<{
        emoji: string;
        count: number;
        users: any[];
    }[]>;
}
