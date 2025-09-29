import { Module } from '@nestjs/common';
import { LeaguesController } from './leagues.controller';
import { LeaguesService } from './leagues.service';
import { PrismaService } from '../common/prisma.service';

@Module({
  controllers: [LeaguesController],
  providers: [LeaguesService, PrismaService],
  exports: [LeaguesService],
})
export class LeaguesModule {}
