import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { MessageService } from './message.service';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';

@ApiTags('messages')
@Controller('messages')
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get message by ID' })
  @ApiResponse({ status: 200, description: 'The message has been found.' })
  @ApiResponse({ status: 404, description: 'Message not found.' })
  @ApiParam({ name: 'id', description: 'Message ID', example: 'msg123' })
  async getMessage(@Param('id') id: string) {
    return this.messageService.getMessage(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new message in a conversation' })
  @ApiResponse({ status: 201, description: 'Message created successfully.' })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({ status: 404, description: 'Conversation not found.' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        senderId: { type: 'string', example: 'user123' },
        conversationId: { type: 'string', example: 'conv456' },
        content: { type: 'string', example: 'Hello, I have a question about your product.' },
      },
      required: ['senderId', 'conversationId', 'content'],
    },
  })
  async createMessage(
    @Body('senderId') senderId: string,
    @Body('conversationId') conversationId: string,
    @Body('content') content: string,
  ) {
    return this.messageService.createMessage(conversationId, senderId, content);
  }

  @Get('conversation/:conversationId')
  @ApiOperation({ summary: 'Get all messages for a specific conversation' })
  @ApiResponse({ status: 200, description: 'Messages retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Conversation not found.' })
  @ApiParam({ name: 'conversationId', description: 'Conversation ID', example: 'conv456' })
  async getConversationMessages(@Param('conversationId') conversationId: string) {
    return this.messageService.getConversationMessages(conversationId);
  }
}
