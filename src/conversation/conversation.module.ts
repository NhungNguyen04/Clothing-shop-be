import { Module } from '@nestjs/common';
import { ConversationController } from './conversation.controller';
import { ConversationService } from './conversation.service';
import { ConversationGateway } from './conversation.gateway';
import { MessageService } from '../message/message.service';

@Module({
  controllers: [ConversationController],
  providers: [ConversationService, ConversationGateway, MessageService],
  exports: [ConversationService],
})
export class ConversationModule {}
