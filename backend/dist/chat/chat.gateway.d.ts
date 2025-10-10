import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
export declare class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    server: Server;
    private connectedUsers;
    handleConnection(client: Socket): Promise<void>;
    handleDisconnect(client: Socket): Promise<void>;
    handleJoinChat(data: {
        chatId: string;
        userId: string;
    }, client: Socket): void;
    handleSendMessage(data: {
        chatId: string;
        message: any;
    }, client: Socket): void;
    handleTyping(data: {
        chatId: string;
        userId: string;
        isTyping: boolean;
    }, client: Socket): void;
    handleReactionAdded(data: {
        chatId: string;
        messageId: string;
        userId: string;
        emoji: string;
        reaction: any;
    }, client: Socket): void;
    handleReactionRemoved(data: {
        chatId: string;
        messageId: string;
        userId: string;
        emoji: string;
    }, client: Socket): void;
}
