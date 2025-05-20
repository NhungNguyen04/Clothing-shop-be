import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ConversationService } from './conversation.service';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';

@ApiTags('conversations')
@Controller('conversations')
export class ConversationController {
  constructor(private readonly conversationService: ConversationService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new conversation between user and seller' })
  @ApiResponse({ status: 201, description: 'Conversation created successfully.' })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string', example: 'user123' },
        sellerId: { type: 'string', example: 'seller456' },
      },
      required: ['userId', 'sellerId'],
    },
  })
  async createConversation(
    @Body('userId') userId: string,
    @Body('sellerId') sellerId: string,
  ) {
    return this.conversationService.createConversation(userId, sellerId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get conversation by ID' })
  @ApiResponse({ status: 200, description: 'The conversation has been found.' })
  @ApiResponse({ status: 404, description: 'Conversation not found.' })
  @ApiParam({ name: 'id', description: 'Conversation ID', example: 'conv123' })
  async getConversation(@Param('id') id: string) {
    return this.conversationService.getConversation(id);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get all conversations for a specific user' })
  @ApiResponse({ status: 200, description: 'User conversations retrieved successfully.' })
  @ApiParam({ name: 'userId', description: 'User ID', example: 'user123' })
  async getUserConversations(@Param('userId') userId: string) {
    return this.conversationService.getUserConversations(userId);
  }

  @Get('seller/:sellerId')
  @ApiOperation({ summary: 'Get all conversations for a specific seller' })
  @ApiResponse({ status: 200, description: 'Seller conversations retrieved successfully.' })
  @ApiParam({ name: 'sellerId', description: 'Seller ID', example: 'seller456' })
  async getSellerConversations(@Param('sellerId') sellerId: string) {
    return this.conversationService.getSellerConversations(sellerId);
  }
}
