import { Controller, Post, Get, Put, Delete, Body, Param, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { InvitationService, InvitationWithUsers } from './invitation.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('invitations')
@UseGuards(JwtAuthGuard)
export class InvitationController {
  constructor(private invitationService: InvitationService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createInvitation(
    @Request() req: any,
    @Body() body: { inviteeId: string }
  ): Promise<InvitationWithUsers> {
    const { inviteeId } = body;
    return this.invitationService.createInvitation(req.user.id, inviteeId);
  }

  @Get()
  async getInvitations(@Request() req: any): Promise<InvitationWithUsers[]> {
    return this.invitationService.getInvitations(req.user.id);
  }

  @Get('pending')
  async getPendingInvitations(@Request() req: any): Promise<InvitationWithUsers[]> {
    return this.invitationService.getPendingInvitations(req.user.id);
  }

  @Put(':id/accept')
  @HttpCode(HttpStatus.OK)
  async acceptInvitation(
    @Request() req: any,
    @Param('id') invitationId: string
  ): Promise<InvitationWithUsers> {
    return this.invitationService.acceptInvitation(invitationId, req.user.id);
  }

  @Put(':id/reject')
  @HttpCode(HttpStatus.OK)
  async rejectInvitation(
    @Request() req: any,
    @Param('id') invitationId: string
  ): Promise<InvitationWithUsers> {
    return this.invitationService.rejectInvitation(invitationId, req.user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async cancelInvitation(
    @Request() req: any,
    @Param('id') invitationId: string
  ): Promise<InvitationWithUsers> {
    return this.invitationService.cancelInvitation(invitationId, req.user.id);
  }

  @Post('use-code')
  @HttpCode(HttpStatus.OK)
  async useInviteCode(
    @Request() req: any,
    @Body() body: { code: string }
  ): Promise<{ success: boolean; message: string; invitationId?: string }> {
    const { code } = body;
    return this.invitationService.useInviteCode(req.user.id, code);
  }

  @Get('my-code')
  async getMyInviteCode(@Request() req: any): Promise<{ code: string; username: string }> {
    return this.invitationService.getMyInviteCode(req.user.id);
  }
}
