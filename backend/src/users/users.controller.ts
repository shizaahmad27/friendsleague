import { Controller, Get, Put, Query, UseGuards, Request, Body, Param } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ChatGateway } from '../chat/chat.gateway';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private usersService: UsersService,
    private chatGateway: ChatGateway,
  ) {}

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
    const result = await this.usersService.updateGlobalOnlineStatus(req.user.id, body.showOnlineStatus);
    
    // Emit privacy setting change to all connected users
    this.chatGateway.server.emit('privacy:global-changed', {
      userId: req.user.id,
      showOnlineStatus: body.showOnlineStatus,
      timestamp: new Date().toISOString(),
    });
    
    return result;
  }

  @Put('privacy-settings/friend/:friendId')
  async updateFriendOnlineStatusVisibility(
    @Request() req: any,
    @Param('friendId') friendId: string,
    @Body() body: { hideOnlineStatus: boolean }
  ) {
    const result = await this.usersService.updateFriendOnlineStatusVisibility(
      req.user.id, 
      friendId, 
      body.hideOnlineStatus
    );
    
    // Emit privacy setting change to the specific friend
    this.chatGateway.server.to(friendId).emit('privacy:friend-changed', {
      userId: req.user.id,
      targetUserId: friendId,
      hideOnlineStatus: body.hideOnlineStatus,
      timestamp: new Date().toISOString(),
    });
    
    return result;
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

  @Put('privacy-settings/location-sharing')
  async updateLocationSharing(
    @Request() req: any,
    @Body() body: { locationSharingEnabled: boolean }
  ) {
    const result = await this.usersService.updateLocationSharing(req.user.id, body.locationSharingEnabled);
    
    // Emit location sharing change to all connected users
    this.chatGateway.server.emit('privacy:location-sharing-changed', {
      userId: req.user.id,
      locationSharingEnabled: body.locationSharingEnabled,
      timestamp: new Date().toISOString(),
    });
    
    return result;
  }

  @Put('profile')
  async updateProfile(
    @Request() req: any,
    @Body() updateProfileDto: UpdateProfileDto
  ) {
    return this.usersService.updateProfile(req.user.id, updateProfileDto);
  }

  @Get('me')
  async getCurrentUser(@Request() req: any) {
    return this.usersService.findById(req.user.id);
  }
}
