import { Module } from '@nestjs/common';
import { InvitationsController } from './invitations.controller';
import { InvitationsService } from './invitations.service';
import { PrismaService } from '../common/prisma.service';

@Module({
  controllers: [InvitationsController],
  providers: [InvitationsService, PrismaService],
  exports: [InvitationsService],
})
export class InvitationsModule {}
