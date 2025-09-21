import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@WebSocketGateway({
    cors: {
        origin: '*',
    },
})

export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private connectedUsers = new Map<string, string>();  // kobler socketid med userid. 

    async handleConnection(client: Socket){
        console.log('Client connected:', client.id);
    }

    async handleDisconnect(client: Socket){
        const userId = this.connectedUsers.get(client.id);
        if (userId){
            this.connectedUsers.delete(client.id);

            this.server.emit('user:offline', { userId });
        }
        console.log(`Client disconnected: ${client.id}`);
    }

    @SubscribeMessage('joinChat')
    handleJoinChat(
        @MessageBody() data: { chatId: string; userId: string}, 
        @ConnectedSocket() client: Socket,
    ) {
        client.join(data.chatId);
        this.connectedUsers.set(client.id, data.userId);
        console.log(`User ${data.userId} joined chat ${data.chatId}`);
    }

    @SubscribeMessage('sendMessage')
    handleSendMessage(
        @MessageBody() data: { chatId: string; message: any },
        @ConnectedSocket() client: Socket, 
    ) {
        //broadcast message to alle users in the chat
        this.server.to(data.chatId).emit('message:received', data.message);
    }

    @SubscribeMessage('typing')
    handleTyping(
        @MessageBody() data: { chatId: string; userId: string; isTyping: boolean },
        @ConnectedSocket() client: Socket,
    ) {
        client.to(data.chatId).emit('user:typing', {
            userId: data.userId,
            isTyping: data.isTyping,
        });
    }
}

