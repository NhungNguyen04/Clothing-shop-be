import { prisma } from '@/prisma/prisma';
import { Injectable } from '@nestjs/common';
import { Notification, Prisma } from '@prisma/client';

@Injectable()
export class NotificationService {
  constructor() {}

  /**
   * Create a new notification
   */
  async createNotification(data: {
    userId: string;
    message: string;
  }): Promise<Notification> {
    return prisma.notification.create({
      data
    });
  }

  /**
   * Create notifications for multiple users with the same message
   */
  async createNotificationForMultipleUsers(userIds: string[], message: string): Promise<number> {
    const notifications = await prisma.notification.createMany({
      data: userIds.map(userId => ({
        userId,
        message
      })),
    });

    return notifications.count;
  }

  /**
   * Get all notifications for a user
   */
  async getNotificationsByUserId(userId: string): Promise<Notification[]> {
    return prisma.notification.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Get unread notifications for a user
   */
  async getUnreadNotifications(userId: string): Promise<Notification[]> {
    return prisma.notification.findMany({
      where: {
        userId,
        isRead: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(id: string): Promise<Notification> {
    return prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<Prisma.BatchPayload> {
    return prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });
  }

  /**
   * Delete a notification
   */
  async deleteNotification(id: string): Promise<Notification> {
    return prisma.notification.delete({
      where: { id },
    });
  }

  /**
   * Delete all notifications for a user
   */
  async deleteAllNotifications(userId: string): Promise<Prisma.BatchPayload> {
    return prisma.notification.deleteMany({
      where: { userId },
    });
  }

  /**
   * Get notification count for a user
   */
  async getNotificationCount(userId: string): Promise<number> {
    return prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });
  }

  /**
   * Create order status update notification
   */
  async createOrderStatusNotification(
    userId: string, 
    orderId: string, 
    newStatus: string
  ): Promise<Notification> {
    const message = `Your order #${orderId.substring(0, 8)} status has been updated to ${newStatus}`;
    return this.createNotification({
      userId,
      message
    });
  }
}
