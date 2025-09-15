import { Controller, Get, Query, UseGuards } from '@nestjs/common';
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
}
