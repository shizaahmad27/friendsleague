"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatController = void 0;
const common_1 = require("@nestjs/common");
const chat_service_1 = require("./chat.service");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const client_1 = require("@prisma/client");
let ChatController = class ChatController {
    constructor(chatService) {
        this.chatService = chatService;
    }
    async createDirectChat(req, body) {
        return this.chatService.createDirectChat(req.user.id, body.friendId);
    }
    async getUserChats(req) {
        return this.chatService.getUserChats(req.user.id);
    }
    async getChatMessages(chatId, page = '1', limit = '50') {
        return this.chatService.getChatMessages(chatId, parseInt(page), parseInt(limit));
    }
    async sendMessage(chatId, req, body) {
        return this.chatService.sendMessage(chatId, req.user.id, body.content, body.type || client_1.MessageType.TEXT);
    }
    async createGroupChat(req, body) {
        return this.chatService.createGroupChat(req.user.id, body.name, body.description, body.participantIds);
    }
    async getGroupChatParticipants(chatId) {
        return this.chatService.getGroupChatParticipants(chatId);
    }
    async addParticipantsToGroup(chatId, body) {
        return this.chatService.addParticipantsToGroup(chatId, body.participantIds);
    }
    async removeParticipantFromGroup(chatId, userId) {
        return this.chatService.removeParticipantFromGroup(chatId, userId);
    }
    async updateGroupChat(chatId, body) {
        return this.chatService.updateGroupChat(chatId, body.name, body.description);
    }
};
exports.ChatController = ChatController;
__decorate([
    (0, common_1.Post)('direct'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "createDirectChat", null);
__decorate([
    (0, common_1.Get)('chats'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "getUserChats", null);
__decorate([
    (0, common_1.Get)(':chatId/messages'),
    __param(0, (0, common_1.Param)('chatId')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "getChatMessages", null);
__decorate([
    (0, common_1.Post)(':chatId/messages'),
    __param(0, (0, common_1.Param)('chatId')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "sendMessage", null);
__decorate([
    (0, common_1.Post)('group'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "createGroupChat", null);
__decorate([
    (0, common_1.Get)(':chatId/participants'),
    __param(0, (0, common_1.Param)('chatId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "getGroupChatParticipants", null);
__decorate([
    (0, common_1.Post)(':chatId/participants'),
    __param(0, (0, common_1.Param)('chatId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "addParticipantsToGroup", null);
__decorate([
    (0, common_1.Delete)(':chatId/participants/:userId'),
    __param(0, (0, common_1.Param)('chatId')),
    __param(1, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "removeParticipantFromGroup", null);
__decorate([
    (0, common_1.Put)(':chatId'),
    __param(0, (0, common_1.Param)('chatId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "updateGroupChat", null);
exports.ChatController = ChatController = __decorate([
    (0, common_1.Controller)('chats'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [chat_service_1.ChatService])
], ChatController);
//# sourceMappingURL=chat.controller.js.map