import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { PrismaService } from '../common/prisma.service';
import { S3Service } from '../common/s3.service';

@Module({
    controllers: [ChatController],
    providers: [ChatService, ChatGateway, PrismaService, S3Service],
    exports: [ChatService, ChatGateway],
})
export class ChatModule {}