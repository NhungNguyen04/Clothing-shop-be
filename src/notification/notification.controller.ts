import { Controller, Get, Post, Body, Param, Delete, Put, UseGuards, Req } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { Notification } from '@prisma/client';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';

@ApiTags('notifications')
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @ApiOperation({ summary: 'Get all user notifications', description: 'Retrieves all notifications for a user' })
  @ApiResponse({ status: 200, description: 'Returns an array of notifications' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @Get('user/:userId')
  async getUserNotifications(@Param('userId') userId: string): Promise<Notification[]> {
    return this.notificationService.getNotificationsByUserId(userId);
  }

  @ApiOperation({ summary: 'Get unread notifications', description: 'Retrieves all unread notifications for a user' })
  @ApiResponse({ status: 200, description: 'Returns an array of unread notifications' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @Get('user/:userId/unread')
  async getUnreadNotifications(@Param('userId') userId: string): Promise<Notification[]> {
    return this.notificationService.getUnreadNotifications(userId);
  }

  @ApiOperation({ summary: 'Get notification count', description: 'Retrieves the total count of notifications for a user' })
  @ApiResponse({ status: 200, description: 'Returns the count of notifications', type: Object })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @Get('user/:userId/count')
  async getNotificationCount(@Param('userId') userId: string): Promise<{ count: number }> {
    const count = await this.notificationService.getNotificationCount(userId);
    return { count };
  }

  @ApiOperation({ summary: 'Create notification', description: 'Creates a new notification for a user' })
  @ApiBody({ 
    type: Object, 
    description: 'Notification data',
    schema: {
      properties: {
        userId: { type: 'string', description: 'ID of the user to notify' },
        message: { type: 'string', description: 'Notification message' }
      }
    }
  })
  @ApiResponse({ status: 201, description: 'Notification created successfully' })
  @Post()
  async createNotification(
    @Body() data: { userId: string; message: string },
  ): Promise<Notification> {
    const notification = await this.notificationService.createNotification(data);
    if (!notification) {
      throw new Error('Failed to create notification');
    }
    return notification;
  }

  @ApiOperation({ summary: 'Mark notification as read', description: 'Marks a specific notification as read' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiResponse({ status: 200, description: 'Notification marked as read' })
  @Put(':id/read')
  async markAsRead(@Param('id') id: string): Promise<Notification> {
    return this.notificationService.markAsRead(id);
  }

  @ApiOperation({ summary: 'Mark all notifications as read', description: 'Marks all notifications of a user as read' })
  @ApiResponse({ status: 200, description: 'All notifications marked as read', type: Object })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @Put('user/:userId/read-all')
  async markAllAsRead(@Param('userId') userId: string): Promise<{ success: boolean; count: number }> {
    const result = await this.notificationService.markAllAsRead(userId);
    return { 
      success: true, 
      count: result.count 
    };
  }

  @ApiOperation({ summary: 'Delete notification', description: 'Deletes a specific notification' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiResponse({ status: 200, description: 'Notification deleted successfully' })
  @Delete(':id')
  async deleteNotification(@Param('id') id: string): Promise<Notification> {
    return this.notificationService.deleteNotification(id);
  }

  @ApiOperation({ summary: 'Delete all notifications', description: 'Deletes all notifications of the authenticated user' })
  @ApiResponse({ status: 200, description: 'All notifications deleted successfully', type: Object })
  @Delete('/user/:userId')
  async deleteAllNotifications(@Param('userId') userId: string): Promise<{ success: boolean; count: number }> {
    const result = await this.notificationService.deleteAllNotifications(userId);
    return { 
      success: true, 
      count: result.count 
    };
  }
}
