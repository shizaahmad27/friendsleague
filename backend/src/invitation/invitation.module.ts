import { Module } from '@nestjs/common';
import { InvitationService } from './invitation.service';
import { PrismaService } from '../common/prisma.service';

@Module({
  providers: [InvitationService, PrismaService],
  exports: [InvitationService],
})
export class UsersModule {}
