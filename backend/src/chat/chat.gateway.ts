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
        // Note: We'll emit user:online when the user joins their personal room
        // This happens in handleJoinUser method
    }

    async handleDisconnect(client: Socket){
        const userId = this.connectedUsers.get(client.id);
        if (userId){
            this.connectedUsers.delete(client.id);

            // Broadcast to all users that this user is offline
            this.server.emit('user:offline', { 
                userId,
                timestamp: new Date().toISOString()
            });
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
        console.log(`🏠 User ${data.userId} joined chat ${data.chatId}`);
    }

    @SubscribeMessage('sendMessage')
    handleSendMessage(
        @MessageBody() data: { chatId: string; message: any },
        @ConnectedSocket() client: Socket, 
    ) {
        //broadcast message to alle users in the chat
        this.server.to(data.chatId).emit('newMessage', data.message);
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

    @SubscribeMessage('reactionAdded')
    handleReactionAdded(
        @MessageBody() data: { chatId: string; messageId: string; userId: string; emoji: string; reaction: any },
        @ConnectedSocket() client: Socket,
    ) {
        // Broadcast reaction to all users in the chat
        client.to(data.chatId).emit('reactionAdded', {
            messageId: data.messageId,
            userId: data.userId,
            emoji: data.emoji,
            reaction: data.reaction,
        });
    }

    @SubscribeMessage('reactionRemoved')
    handleReactionRemoved(
        @MessageBody() data: { chatId: string; messageId: string; userId: string; emoji: string },
        @ConnectedSocket() client: Socket,
    ) {
        // Broadcast reaction removal to all users in the chat
        client.to(data.chatId).emit('reactionRemoved', {
            messageId: data.messageId,
            userId: data.userId,
            emoji: data.emoji,
        });
    }

    @SubscribeMessage('messagesRead')
    handleMessagesRead(
        @MessageBody() data: { chatId: string; userId: string; messageIds: string[] },
        @ConnectedSocket() client: Socket,
    ) {
        // Broadcast read receipts to all users in the chat
        client.to(data.chatId).emit('messagesRead', {
            userId: data.userId,
            messageIds: data.messageIds,
            readAt: new Date(),
        });
    }

    @SubscribeMessage('joinUser')
    handleJoinUser(@MessageBody() data: { userId: string }, @ConnectedSocket() client: Socket) {
        // Join user to their personal room for receiving updates
        client.join(data.userId);
        
        // Store the user connection
        this.connectedUsers.set(client.id, data.userId);
        
        // Broadcast to all users that this user is online
        this.server.emit('user:online', { 
            userId: data.userId,
            timestamp: new Date().toISOString()
        });
        
        console.log(`👤 User ${data.userId} joined their personal room and is now online`);
    }

    @SubscribeMessage('leaveUser')
    handleLeaveUser(@MessageBody() data: { userId: string }, @ConnectedSocket() client: Socket) {
        // Leave user from their personal room
        client.leave(data.userId);
        console.log(`User ${data.userId} left their personal room`);
    }
}

