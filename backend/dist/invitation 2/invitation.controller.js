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
exports.InvitationController = void 0;
const common_1 = require("@nestjs/common");
const invitation_service_1 = require("./invitation.service");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
let InvitationController = class InvitationController {
    constructor(invitationService) {
        this.invitationService = invitationService;
    }
    async createInvitation(req, body) {
        const { inviteeId } = body;
        return this.invitationService.createInvitation(req.user.id, inviteeId);
    }
    async getInvitations(req) {
        return this.invitationService.getInvitations(req.user.id);
    }
    async getPendingInvitations(req) {
        return this.invitationService.getPendingInvitations(req.user.id);
    }
    async acceptInvitation(req, invitationId) {
        return this.invitationService.acceptInvitation(invitationId, req.user.id);
    }
    async rejectInvitation(req, invitationId) {
        return this.invitationService.rejectInvitation(invitationId, req.user.id);
    }
    async cancelInvitation(req, invitationId) {
        return this.invitationService.cancelInvitation(invitationId, req.user.id);
    }
    async useInviteCode(req, body) {
        const { code } = body;
        return this.invitationService.useInviteCode(req.user.id, code);
    }
    async getMyInviteCode(req) {
        return this.invitationService.getMyInviteCode(req.user.id);
    }
};
exports.InvitationController = InvitationController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], InvitationController.prototype, "createInvitation", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], InvitationController.prototype, "getInvitations", null);
__decorate([
    (0, common_1.Get)('pending'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], InvitationController.prototype, "getPendingInvitations", null);
__decorate([
    (0, common_1.Put)(':id/accept'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], InvitationController.prototype, "acceptInvitation", null);
__decorate([
    (0, common_1.Put)(':id/reject'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], InvitationController.prototype, "rejectInvitation", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], InvitationController.prototype, "cancelInvitation", null);
__decorate([
    (0, common_1.Post)('use-code'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], InvitationController.prototype, "useInviteCode", null);
__decorate([
    (0, common_1.Get)('my-code'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], InvitationController.prototype, "getMyInviteCode", null);
exports.InvitationController = InvitationController = __decorate([
    (0, common_1.Controller)('invitations'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [invitation_service_1.InvitationService])
], InvitationController);
//# sourceMappingURL=invitation.controller.js.map