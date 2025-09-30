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
exports.LeaguesController = void 0;
const common_1 = require("@nestjs/common");
const leagues_service_1 = require("./leagues.service");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const leagues_dto_1 = require("./dto/leagues.dto");
let LeaguesController = class LeaguesController {
    constructor(leaguesService) {
        this.leaguesService = leaguesService;
    }
    async createLeague(req, createLeagueDto) {
        return this.leaguesService.createLeague(req.user.id, createLeagueDto);
    }
    async getLeagues(req) {
        return this.leaguesService.getLeagues(req.user.id);
    }
    async getLeagueById(leagueId, req) {
        return this.leaguesService.getLeagueById(leagueId, req.user.id);
    }
    async updateLeague(leagueId, req, updateLeagueDto) {
        return this.leaguesService.updateLeague(leagueId, req.user.id, updateLeagueDto);
    }
    async joinLeague(leagueId, req, joinLeagueDto) {
        return this.leaguesService.joinLeague(leagueId, req.user.id, joinLeagueDto.inviteCode);
    }
    async leaveLeague(leagueId, req) {
        return this.leaguesService.leaveLeague(leagueId, req.user.id);
    }
    async addMember(leagueId, req, addMemberDto) {
        return this.leaguesService.addMember(leagueId, req.user.id, addMemberDto);
    }
    async getMembers(leagueId, req) {
        return this.leaguesService.getMembers(leagueId, req.user.id);
    }
    async removeMember(leagueId, userId, req) {
        return this.leaguesService.removeMember(leagueId, req.user.id, userId);
    }
    async grantAdminRights(leagueId, userId, req) {
        return this.leaguesService.grantAdminRights(leagueId, req.user.id, userId);
    }
    async revokeAdminRights(leagueId, userId, req) {
        return this.leaguesService.revokeAdminRights(leagueId, req.user.id, userId);
    }
    async createRule(leagueId, req, createRuleDto) {
        return this.leaguesService.createRule(leagueId, req.user.id, createRuleDto);
    }
    async getRules(leagueId, req) {
        return this.leaguesService.getRules(leagueId, req.user.id);
    }
    async assignPoints(leagueId, req, assignPointsDto) {
        return this.leaguesService.assignPoints(leagueId, req.user.id, assignPointsDto);
    }
    async getLeaderboard(leagueId) {
        return this.leaguesService.getLeaderboard(leagueId);
    }
};
exports.LeaguesController = LeaguesController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, leagues_dto_1.CreateLeagueDto]),
    __metadata("design:returntype", Promise)
], LeaguesController.prototype, "createLeague", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LeaguesController.prototype, "getLeagues", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], LeaguesController.prototype, "getLeagueById", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, leagues_dto_1.UpdateLeagueDto]),
    __metadata("design:returntype", Promise)
], LeaguesController.prototype, "updateLeague", null);
__decorate([
    (0, common_1.Post)(':id/join'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, leagues_dto_1.JoinLeagueDto]),
    __metadata("design:returntype", Promise)
], LeaguesController.prototype, "joinLeague", null);
__decorate([
    (0, common_1.Post)(':id/leave'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], LeaguesController.prototype, "leaveLeague", null);
__decorate([
    (0, common_1.Post)(':id/members'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, leagues_dto_1.AddMemberDto]),
    __metadata("design:returntype", Promise)
], LeaguesController.prototype, "addMember", null);
__decorate([
    (0, common_1.Get)(':id/members'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], LeaguesController.prototype, "getMembers", null);
__decorate([
    (0, common_1.Delete)(':id/members/:userId'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('userId')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], LeaguesController.prototype, "removeMember", null);
__decorate([
    (0, common_1.Post)(':id/admins/:userId'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('userId')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], LeaguesController.prototype, "grantAdminRights", null);
__decorate([
    (0, common_1.Delete)(':id/admins/:userId'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('userId')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], LeaguesController.prototype, "revokeAdminRights", null);
__decorate([
    (0, common_1.Post)(':id/rules'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, leagues_dto_1.CreateRuleDto]),
    __metadata("design:returntype", Promise)
], LeaguesController.prototype, "createRule", null);
__decorate([
    (0, common_1.Get)(':id/rules'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], LeaguesController.prototype, "getRules", null);
__decorate([
    (0, common_1.Post)(':id/points'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, leagues_dto_1.AssignPointsDto]),
    __metadata("design:returntype", Promise)
], LeaguesController.prototype, "assignPoints", null);
__decorate([
    (0, common_1.Get)(':id/leaderboard'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], LeaguesController.prototype, "getLeaderboard", null);
exports.LeaguesController = LeaguesController = __decorate([
    (0, common_1.Controller)('leagues'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [leagues_service_1.LeaguesService])
], LeaguesController);
//# sourceMappingURL=leagues.controller.js.map