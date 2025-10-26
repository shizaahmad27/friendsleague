import { Controller, Get, Put, Query, UseGuards, Request, Body, Param } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('search')
  async searchUsers(@Query('username') username: string) {
    if (!username || username.trim().length < 2) {
      return [];
    }
    
    return this.usersService.searchUsers(username.trim());
  }

  @Get('friends')
  async getUserFriends(@Request() req: any) {
    return this.usersService.getUserFriends(req.user.id);
  }

  @Put('online-status')
  async updateOnlineStatus(
    @Request() req: any,
    @Body() body: { isOnline: boolean }
  ) {
    return this.usersService.updateOnlineStatus(req.user.id, body.isOnline);
  }

  // Privacy Settings Endpoints
  @Get('privacy-settings')
  async getPrivacySettings(@Request() req: any) {
    return this.usersService.getPrivacySettings(req.user.id);
  }

  @Put('privacy-settings/global')
  async updateGlobalOnlineStatus(
    @Request() req: any,
    @Body() body: { showOnlineStatus: boolean }
  ) {
    return this.usersService.updateGlobalOnlineStatus(req.user.id, body.showOnlineStatus);
  }

  @Put('privacy-settings/friend/:friendId')
  async updateFriendOnlineStatusVisibility(
    @Request() req: any,
    @Param('friendId') friendId: string,
    @Body() body: { hideOnlineStatus: boolean }
  ) {
    return this.usersService.updateFriendOnlineStatusVisibility(
      req.user.id, 
      friendId, 
      body.hideOnlineStatus
    );
  }

  @Get('privacy-settings/friend/:friendId')
  async getFriendOnlineStatusVisibility(
    @Request() req: any,
    @Param('friendId') friendId: string
  ) {
    const hideOnlineStatus = await this.usersService.getFriendOnlineStatusVisibility(
      req.user.id, 
      friendId
    );
    return { hideOnlineStatus };
  }
}
