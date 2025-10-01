import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { EventsService } from './events.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import {
  CreateEventDto,
  UpdateEventDto,
  AddParticipantDto,
  CreateEventRuleDto,
  AssignEventPointsDto,
  JoinEventDto,
  CreateEventInvitationDto,
} from './dto/events.dto';

@Controller('events')
@UseGuards(JwtAuthGuard)
export class EventsController {
  constructor(private eventsService: EventsService) {}

  /**
   * Create a new event
   */
  @Post()
  async createEvent(@Request() req: any, @Body() createEventDto: CreateEventDto) {
    return this.eventsService.createEvent(req.user.id, createEventDto);
  }

  /**
   * Get all events (public + user's events)
   */
  @Get()
  async getEvents(@Request() req: any) {
    return this.eventsService.getEvents(req.user.id);
  }

  /**
   * Get events for a specific league
   */
  @Get('league/:leagueId')
  async getLeagueEvents(@Param('leagueId') leagueId: string, @Request() req: any) {
    return this.eventsService.getLeagueEvents(leagueId, req.user.id);
  }

  /**
   * Get a specific event by ID
   */
  @Get(':id')
  async getEventById(@Param('id') eventId: string, @Request() req: any) {
    return this.eventsService.getEventById(eventId, req.user.id);
  }

  /**
   * Update event information (admin only)
   */
  @Put(':id')
  async updateEvent(
    @Param('id') eventId: string,
    @Request() req: any,
    @Body() updateEventDto: UpdateEventDto,
  ) {
    return this.eventsService.updateEvent(eventId, req.user.id, updateEventDto);
  }

  /**
   * Join an event
   */
  @Post(':id/join')
  @HttpCode(HttpStatus.OK)
  async joinEvent(
    @Param('id') eventId: string,
    @Request() req: any,
    @Body() joinEventDto: JoinEventDto,
  ) {
    return this.eventsService.joinEvent(eventId, req.user.id, joinEventDto.inviteCode);
  }

  /**
   * Leave an event
   */
  @Post(':id/leave')
  @HttpCode(HttpStatus.OK)
  async leaveEvent(@Param('id') eventId: string, @Request() req: any) {
    return this.eventsService.leaveEvent(eventId, req.user.id);
  }

  /**
   * Add a participant to event (admin only)
   */
  @Post(':id/participants')
  async addParticipant(
    @Param('id') eventId: string,
    @Request() req: any,
    @Body() addParticipantDto: AddParticipantDto,
  ) {
    return this.eventsService.addParticipant(eventId, req.user.id, addParticipantDto);
  }

  /**
   * List participants for an event
   */
  @Get(':id/participants')
  async getParticipants(
    @Param('id') eventId: string,
    @Request() req: any,
  ) {
    return this.eventsService.getEventParticipants(eventId, req.user.id);
  }

  /**
   * Remove a participant from event (admin only)
   */
  @Delete(':id/participants/:userId')
  async removeParticipant(
    @Param('id') eventId: string,
    @Param('userId') userId: string,
    @Request() req: any,
  ) {
    return this.eventsService.removeParticipant(eventId, req.user.id, userId);
  }

  /**
   * Create a rule for the event (admin only)
   */
  @Post(':id/rules')
  async createEventRule(
    @Param('id') eventId: string,
    @Request() req: any,
    @Body() createEventRuleDto: CreateEventRuleDto,
  ) {
    return this.eventsService.createEventRule(eventId, req.user.id, createEventRuleDto);
  }

  /**
   * List rules for an event
   */
  @Get(':id/rules')
  async getEventRules(
    @Param('id') eventId: string,
    @Request() req: any,
  ) {
    return this.eventsService.getEventRules(eventId, req.user.id);
  }

  /**
   * Assign points to a participant (admin only)
   */
  @Post(':id/points')
  async assignEventPoints(
    @Param('id') eventId: string,
    @Request() req: any,
    @Body() assignEventPointsDto: AssignEventPointsDto,
  ) {
    return this.eventsService.assignEventPoints(eventId, req.user.id, assignEventPointsDto);
  }

  /**
   * Create event invitation for non-friends (admin only)
   */
  @Post(':id/invitations')
  async createEventInvitation(
    @Param('id') eventId: string,
    @Request() req: any,
    @Body() createEventInvitationDto: CreateEventInvitationDto,
  ) {
    return this.eventsService.createEventInvitation(eventId, req.user.id, createEventInvitationDto);
  }

  /**
   * Use event invitation code
   */
  @Post(':id/invitations/use')
  @HttpCode(HttpStatus.OK)
  async useEventInvitation(
    @Param('id') eventId: string,
    @Request() req: any,
    @Body() body: { code: string },
  ) {
    return this.eventsService.useEventInvitation(eventId, req.user.id, body.code);
  }

  /**
   * Get event leaderboard
   */
  @Get(':id/leaderboard')
  async getEventLeaderboard(@Param('id') eventId: string) {
    return this.eventsService.getEventLeaderboard(eventId);
  }
}
