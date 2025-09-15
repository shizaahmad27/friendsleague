import { Controller, Post, Get, Body, UseGuards, Request, Param } from '@nestjs/common';
import { InvitationsService } from './invitations.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CreateInvitationDto, UseInvitationDto } from './dto/invitation.dto';

@Controller('invitations')
@UseGuards(JwtAuthGuard)
export class InvitationsController {
  constructor(private invitationsService: InvitationsService) {}

  @Post()
  async createInvitation(@Request() req, @Body() createInvitationDto: CreateInvitationDto) {
    const userId = req.user.id;
    return this.invitationsService.createInvitation(userId, createInvitationDto);
  }

  @Get()
  async getInvitations(@Request() req) {
    const userId = req.user.id;
    return this.invitationsService.getInvitations(userId);
  }

  @Post('use')
  async useInvitation(@Request() req, @Body() useInvitationDto: UseInvitationDto) {
    const userId = req.user.id;
    return this.invitationsService.useInvitation(userId, useInvitationDto);
  }

  @Get('my-code')
  async getMyInviteCode(@Request() req) {
    const userId = req.user.id;
    return this.invitationsService.getMyInviteCode(userId);
  }
}
