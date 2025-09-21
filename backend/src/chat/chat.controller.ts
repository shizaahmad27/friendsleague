import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { MessageType } from '@prisma/client';

@Controller('chats')
@UseGuards(JwtAuthGuard)
export class ChatController {
    constructor(private chatService: ChatService) {}

    @Post('direct')
     async createDirectChat(
    @Request() req: any,
    @Body() body: { friendId: string },
    ) {
        return this.chatService.createDirectChat(req.user.id, body.friendId);
    }

    @Get('chats')
    async getUserChats(@Request() req:any) {
        return this.chatService.getUserChats(req.user.id);
    }

    @Get(':chatId/messages')
    async getChatMessages(
        @Param('chatId') chatId: string,
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '50',
    ) {
      return this.chatService.getChatMessages(chatId, parseInt(page), parseInt(limit));
    }

    @Post(':chatId/messages')
    async sendMessage(
        @Param('chatId') chatId: string,
        @Request() req: any,
        @Body() body: { content: string; type?: string },
    ) {
        return this.chatService.sendMessage(
            chatId,
            req.user.id,
            body.content,
            (body.type as MessageType) || MessageType.TEXT,
          );
        }

    // Group Chat Endpoints
    @Post('group')
    async createGroupChat(
        @Request() req: any,
        @Body() body: { name: string; description: string; participantIds: string[] },
    ) {
        return this.chatService.createGroupChat(
            req.user.id,
            body.name,
            body.description,
            body.participantIds,
        );
    }

    @Get(':chatId/participants')
    async getGroupChatParticipants(@Param('chatId') chatId: string) {
        return this.chatService.getGroupChatParticipants(chatId);
    }

    @Post(':chatId/participants')
    async addParticipantsToGroup(
        @Param('chatId') chatId: string,
        @Body() body: { participantIds: string[] },
    ) {
        return this.chatService.addParticipantsToGroup(chatId, body.participantIds);
    }

    @Delete(':chatId/participants/:userId')
    async removeParticipantFromGroup(
        @Param('chatId') chatId: string,
        @Param('userId') userId: string,
    ) {
        return this.chatService.removeParticipantFromGroup(chatId, userId);
    }

    @Put(':chatId')
    async updateGroupChat(
        @Param('chatId') chatId: string,
        @Body() body: { name?: string; description?: string },
    ) {
        return this.chatService.updateGroupChat(chatId, body.name, body.description);
    }
      }