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

  @Put(':chatId/read')
  async markChatRead(
    @Param('chatId') chatId: string,
    @Request() req: any,
  ) {
    return this.chatService.markChatRead(chatId, req.user.id);
  }

  @Post(':chatId/messages/read')
  async markMessagesAsRead(
    @Param('chatId') chatId: string,
    @Request() req: any,
    @Body() body: { messageIds: string[] },
  ) {
    return this.chatService.markMessagesAsRead(chatId, req.user.id, body.messageIds);
  }

  @Get('messages/:messageId/read-receipts')
  async getMessageReadReceipts(@Param('messageId') messageId: string) {
    return this.chatService.getMessageReadReceipts(messageId);
  }

  @Put(':chatId/read-receipts-settings')
  async toggleReadReceipts(
    @Param('chatId') chatId: string,
    @Request() req: any,
    @Body() body: { enabled: boolean },
  ) {
    return this.chatService.toggleReadReceipts(chatId, req.user.id, body.enabled);
  }

  @Post(':chatId/messages')
  async sendMessage(
      @Param('chatId') chatId: string,
      @Request() req: any,
      @Body() body: { content: string; type?: string; mediaUrl?: string },
  ) {
      return this.chatService.sendMessage(
          chatId,
          req.user.id,
          body.content,
          (body.type as MessageType) || MessageType.TEXT,
          body.mediaUrl,
        );
      }

  // Message Reaction Endpoints
  @Post('messages/:messageId/reactions')
  async addReaction(
    @Param('messageId') messageId: string,
    @Request() req: any,
    @Body() body: { emoji: string },
  ) {
    return this.chatService.addReaction(messageId, req.user.id, body.emoji);
  }

  @Delete('messages/:messageId/reactions/:emoji')
  async removeReaction(
    @Param('messageId') messageId: string,
    @Param('emoji') emoji: string,
    @Request() req: any,
  ) {
    const decodedEmoji = decodeURIComponent(emoji);
    return this.chatService.removeReaction(messageId, req.user.id, decodedEmoji);
  }

  @Get('messages/:messageId/reactions')
  async getReactions(@Param('messageId') messageId: string) {
    return this.chatService.getReactions(messageId);
  }
      }