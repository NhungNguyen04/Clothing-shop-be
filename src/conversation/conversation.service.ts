import { prisma } from '@/prisma/prisma';
import { Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class ConversationService {
  constructor() {}

  async createConversation(userId: string, sellerId: string) {
    // Check if conversation already exists
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        userId,
        sellerId,
      },
    });

    if (existingConversation) {
      return existingConversation;
    }

    // Create new conversation
    return prisma.conversation.create({
      data: {
        userId,
        sellerId,
      },
    });
  }

  async getConversation(conversationId: string) {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: {
          orderBy: {
            createdAt: 'asc',
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        seller: {
          select: {
            id: true,
            managerName: true,
            user: {
              select: {
                name: true,
                image: true,
              },
            },
          },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException(`Conversation with ID ${conversationId} not found`);
    }

    return conversation;
  }

  async getUserConversations(userId: string) {
    return prisma.conversation.findMany({
      where: { userId },
      include: {
        messages: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
        seller: {
          select: {
            id: true,
            managerName: true,
            user: {
              select: {
                name: true,
                image: true,
              },
            },
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
  }

  async getSellerConversations(sellerId: string) {
    return prisma.conversation.findMany({
      where: { sellerId },
      include: {
        messages: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
  }
}
