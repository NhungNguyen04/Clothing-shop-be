import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ConversationService } from './conversation.service';
import { MessageService } from '../message/message.service';
import { Injectable, Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/conversations',
})
export class ConversationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(ConversationGateway.name);
  
  @WebSocketServer() server: Server;

  constructor(
    private readonly conversationService: ConversationService,
    private readonly messageService: MessageService,
  ) {}

  async handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (!userId) {
      client.disconnect();
      return;
    }
    
    this.logger.log(`Client connected: ${client.id}, userId: ${userId}`);
    client.data.userId = userId;
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinConversation')
  handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() conversationId: string,
  ) {
    this.logger.log(`Client ${client.id} joining conversation ${conversationId}`);
    client.join(`conversation:${conversationId}`);
    return { status: 'success' };
  }

  @SubscribeMessage('leaveConversation')
  handleLeaveConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() conversationId: string,
  ) {
    this.logger.log(`Client ${client.id} leaving conversation ${conversationId}`);
    client.leave(`conversation:${conversationId}`);
    return { status: 'success' };
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; content: string },
  ) {
    try {
      const userId = client.data.userId;
      if (!userId) {
        return { status: 'error', message: 'Not authenticated' };
      }

      const message = await this.messageService.createMessage(
        data.conversationId,
        userId,
        data.content,
      );

      return { status: 'success', message };
    } catch (error) {
      this.logger.error('Error sending message:', error);
      return { status: 'error', message: error.message };
    }
  }
}
