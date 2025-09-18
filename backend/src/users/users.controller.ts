import { Controller, Get, Put, Query, UseGuards, Request, Body } from '@nestjs/common';
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
}
