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
import { LeaguesService } from './leagues.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import {
  CreateLeagueDto,
  UpdateLeagueDto,
  AddMemberDto,
  CreateRuleDto,
  AssignPointsDto,
  JoinLeagueDto,
} from './dto/leagues.dto';

@Controller('leagues')
@UseGuards(JwtAuthGuard)
export class LeaguesController {
  constructor(private leaguesService: LeaguesService) {}

  /**
   * Create a new league
   */
  @Post()
  async createLeague(@Request() req: any, @Body() createLeagueDto: CreateLeagueDto) {
    return this.leaguesService.createLeague(req.user.id, createLeagueDto);
  }

  /**
   * Get all leagues (public + user's leagues)
   */
  @Get()
  async getLeagues(@Request() req: any) {
    return this.leaguesService.getLeagues(req.user.id);
  }

  /**
   * Get a specific league by ID
   */
  @Get(':id')
  async getLeagueById(@Param('id') leagueId: string, @Request() req: any) {
    return this.leaguesService.getLeagueById(leagueId, req.user.id);
  }

  /**
   * Update league information (admin only)
   */
  @Put(':id')
  async updateLeague(
    @Param('id') leagueId: string,
    @Request() req: any,
    @Body() updateLeagueDto: UpdateLeagueDto,
  ) {
    return this.leaguesService.updateLeague(leagueId, req.user.id, updateLeagueDto);
  }

  /**
   * Join a league
   */
  @Post(':id/join')
  @HttpCode(HttpStatus.OK)
  async joinLeague(
    @Param('id') leagueId: string,
    @Request() req: any,
    @Body() joinLeagueDto: JoinLeagueDto,
  ) {
    return this.leaguesService.joinLeague(leagueId, req.user.id, joinLeagueDto.inviteCode);
  }

  /**
   * Leave a league
   */
  @Post(':id/leave')
  @HttpCode(HttpStatus.OK)
  async leaveLeague(@Param('id') leagueId: string, @Request() req: any) {
    return this.leaguesService.leaveLeague(leagueId, req.user.id);
  }

  /**
   * Add a member to league (admin only)
   */
  @Post(':id/members')
  async addMember(
    @Param('id') leagueId: string,
    @Request() req: any,
    @Body() addMemberDto: AddMemberDto,
  ) {
    return this.leaguesService.addMember(leagueId, req.user.id, addMemberDto);
  }

  /**
   * Remove a member from league (admin only)
   */
  @Delete(':id/members/:userId')
  async removeMember(
    @Param('id') leagueId: string,
    @Param('userId') userId: string,
    @Request() req: any,
  ) {
    return this.leaguesService.removeMember(leagueId, req.user.id, userId);
  }

  /**
   * Grant admin rights to a member (admin only)
   */
  @Post(':id/admins/:userId')
  async grantAdminRights(
    @Param('id') leagueId: string,
    @Param('userId') userId: string,
    @Request() req: any,
  ) {
    return this.leaguesService.grantAdminRights(leagueId, req.user.id, userId);
  }

  /**
   * Revoke admin rights from a member (admin only)
   */
  @Delete(':id/admins/:userId')
  async revokeAdminRights(
    @Param('id') leagueId: string,
    @Param('userId') userId: string,
    @Request() req: any,
  ) {
    return this.leaguesService.revokeAdminRights(leagueId, req.user.id, userId);
  }

  /**
   * Create a rule for the league (admin only)
   */
  @Post(':id/rules')
  async createRule(
    @Param('id') leagueId: string,
    @Request() req: any,
    @Body() createRuleDto: CreateRuleDto,
  ) {
    return this.leaguesService.createRule(leagueId, req.user.id, createRuleDto);
  }

  /**
   * Assign points to a member (admin only)
   */
  @Post(':id/points')
  async assignPoints(
    @Param('id') leagueId: string,
    @Request() req: any,
    @Body() assignPointsDto: AssignPointsDto,
  ) {
    return this.leaguesService.assignPoints(leagueId, req.user.id, assignPointsDto);
  }

  /**
   * Get league leaderboard
   */
  @Get(':id/leaderboard')
  async getLeaderboard(@Param('id') leagueId: string) {
    return this.leaguesService.getLeaderboard(leagueId);
  }
}
