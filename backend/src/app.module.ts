import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PrismaService } from './common/prisma.service';
import { ThrottlerModule } from '@nestjs/throttler';
import { InvitationModule } from './invitation/invitation.module';
import { ChatModule } from './chat/chat.module';
import { LeaguesModule } from './leagues/leagues.module';
import { EventsModule } from './events/events.module';
import { UploadModule } from './upload/upload.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([{
      ttl: 60000, 
      limit: 10, 
    }]),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    UsersModule,
    InvitationModule,
    ChatModule,
    LeaguesModule,
    EventsModule,
    UploadModule,
  ],
  providers: [PrismaService],
})
export class AppModule {}
