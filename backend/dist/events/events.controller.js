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
exports.EventsController = void 0;
const common_1 = require("@nestjs/common");
const events_service_1 = require("./events.service");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const events_dto_1 = require("./dto/events.dto");
let EventsController = class EventsController {
    constructor(eventsService) {
        this.eventsService = eventsService;
    }
    async createEvent(req, createEventDto) {
        return this.eventsService.createEvent(req.user.id, createEventDto);
    }
    async getEvents(req) {
        return this.eventsService.getEvents(req.user.id);
    }
    async getLeagueEvents(leagueId, req) {
        return this.eventsService.getLeagueEvents(leagueId, req.user.id);
    }
    async getEventById(eventId, req) {
        return this.eventsService.getEventById(eventId, req.user.id);
    }
    async updateEvent(eventId, req, updateEventDto) {
        return this.eventsService.updateEvent(eventId, req.user.id, updateEventDto);
    }
    async joinEvent(eventId, req, joinEventDto) {
        return this.eventsService.joinEvent(eventId, req.user.id, joinEventDto.inviteCode);
    }
    async leaveEvent(eventId, req) {
        return this.eventsService.leaveEvent(eventId, req.user.id);
    }
    async addParticipant(eventId, req, addParticipantDto) {
        return this.eventsService.addParticipant(eventId, req.user.id, addParticipantDto);
    }
    async getParticipants(eventId, req) {
        return this.eventsService.getEventParticipants(eventId, req.user.id);
    }
    async removeParticipant(eventId, userId, req) {
        return this.eventsService.removeParticipant(eventId, req.user.id, userId);
    }
    async createEventRule(eventId, req, createEventRuleDto) {
        return this.eventsService.createEventRule(eventId, req.user.id, createEventRuleDto);
    }
    async getEventRules(eventId, req) {
        return this.eventsService.getEventRules(eventId, req.user.id);
    }
    async assignEventPoints(eventId, req, assignEventPointsDto) {
        return this.eventsService.assignEventPoints(eventId, req.user.id, assignEventPointsDto);
    }
    async createEventInvitation(eventId, req, createEventInvitationDto) {
        return this.eventsService.createEventInvitation(eventId, req.user.id, createEventInvitationDto);
    }
    async useEventInvitation(eventId, req, body) {
        return this.eventsService.useEventInvitation(eventId, req.user.id, body.code);
    }
    async getEventLeaderboard(eventId) {
        return this.eventsService.getEventLeaderboard(eventId);
    }
};
exports.EventsController = EventsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, events_dto_1.CreateEventDto]),
    __metadata("design:returntype", Promise)
], EventsController.prototype, "createEvent", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EventsController.prototype, "getEvents", null);
__decorate([
    (0, common_1.Get)('league/:leagueId'),
    __param(0, (0, common_1.Param)('leagueId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EventsController.prototype, "getLeagueEvents", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EventsController.prototype, "getEventById", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, events_dto_1.UpdateEventDto]),
    __metadata("design:returntype", Promise)
], EventsController.prototype, "updateEvent", null);
__decorate([
    (0, common_1.Post)(':id/join'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, events_dto_1.JoinEventDto]),
    __metadata("design:returntype", Promise)
], EventsController.prototype, "joinEvent", null);
__decorate([
    (0, common_1.Post)(':id/leave'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EventsController.prototype, "leaveEvent", null);
__decorate([
    (0, common_1.Post)(':id/participants'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, events_dto_1.AddParticipantDto]),
    __metadata("design:returntype", Promise)
], EventsController.prototype, "addParticipant", null);
__decorate([
    (0, common_1.Get)(':id/participants'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EventsController.prototype, "getParticipants", null);
__decorate([
    (0, common_1.Delete)(':id/participants/:userId'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('userId')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], EventsController.prototype, "removeParticipant", null);
__decorate([
    (0, common_1.Post)(':id/rules'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, events_dto_1.CreateEventRuleDto]),
    __metadata("design:returntype", Promise)
], EventsController.prototype, "createEventRule", null);
__decorate([
    (0, common_1.Get)(':id/rules'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EventsController.prototype, "getEventRules", null);
__decorate([
    (0, common_1.Post)(':id/points'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, events_dto_1.AssignEventPointsDto]),
    __metadata("design:returntype", Promise)
], EventsController.prototype, "assignEventPoints", null);
__decorate([
    (0, common_1.Post)(':id/invitations'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, events_dto_1.CreateEventInvitationDto]),
    __metadata("design:returntype", Promise)
], EventsController.prototype, "createEventInvitation", null);
__decorate([
    (0, common_1.Post)(':id/invitations/use'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], EventsController.prototype, "useEventInvitation", null);
__decorate([
    (0, common_1.Get)(':id/leaderboard'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EventsController.prototype, "getEventLeaderboard", null);
exports.EventsController = EventsController = __decorate([
    (0, common_1.Controller)('events'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [events_service_1.EventsService])
], EventsController);
//# sourceMappingURL=events.controller.js.map