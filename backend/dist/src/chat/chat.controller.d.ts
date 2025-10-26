import { ChatService } from './chat.service';
export declare class ChatController {
    private chatService;
    constructor(chatService: ChatService);
    createDirectChat(req: any, body: {
        friendId: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string | null;
        type: import(".prisma/client").$Enums.ChatType;
    }>;
    getUserChats(req: any): Promise<any[]>;
    getChatMessages(chatId: string, page?: string, limit?: string): Promise<{
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
    addParticipantsToGroup(chatId: string, body: {
        participantIds: string[];
    }): Promise<{
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
    markChatRead(chatId: string, req: any): Promise<{
        success: boolean;
    }>;
    markMessagesAsRead(chatId: string, req: any, body: {
        messageIds: string[];
    }): Promise<{
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
    toggleReadReceipts(chatId: string, req: any, body: {
        enabled: boolean;
    }): Promise<{
        success: boolean;
        enabled: boolean;
    }>;
    sendMessage(chatId: string, req: any, body: {
        content: string;
        type?: string;
        mediaUrl?: string;
    }): Promise<{
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
