import { Injectable, OnModuleInit } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { DomainEventName } from '../../events/domain-event.interface';
import { DomainEventPublisher } from '../../events/domain-event-publisher.service';
import { NotificationService } from '../notification.service';

type OrderPlacedPayload = {
  orderId: string;
  sellerId: string;
};

type OrderConfirmedPayload = {
  userId: string;
  orderId?: string;
  orderCount?: number;
};

type OrderStatusPayload = {
  orderId: string;
  userId: string;
  status: OrderStatus;
};

type OrderCancelledPayload = {
  orderId: string;
  userId: string;
};

@Injectable()
export class OrderNotificationObserver implements OnModuleInit {
  constructor(
    private readonly events: DomainEventPublisher,
    private readonly notificationService: NotificationService,
  ) {}

  onModuleInit(): void {
    this.events.subscribe<OrderPlacedPayload>(DomainEventName.OrderPlaced, async ({ payload }) => {
      await this.notificationService.createNotification({
        userId: payload.sellerId,
        message: `New order #${payload.orderId} has been placed.`,
      });
    });

    this.events.subscribe<OrderConfirmedPayload>(DomainEventName.OrderConfirmed, async ({ payload }) => {
      await this.notificationService.createNotification({
        userId: payload.userId,
        message: this.buildOrderConfirmationMessage(payload),
      });
    });

    this.events.subscribe<OrderStatusPayload>(DomainEventName.OrderStatusPatched, async ({ payload }) => {
      await this.notificationService.createNotification({
        userId: payload.userId,
        message: `Order #${payload.orderId} status has been updated to ${payload.status}.`,
      });
    });

    this.events.subscribe<OrderStatusPayload>(DomainEventName.OrderStatusAdvanced, async ({ payload }) => {
      await this.notificationService.createNotification({
        userId: payload.userId,
        message: `Your order #${payload.orderId} status has been updated to ${payload.status}.`,
      });
    });

    this.events.subscribe<OrderCancelledPayload>(DomainEventName.OrderCancelled, async ({ payload }) => {
      await this.notificationService.createNotification({
        userId: payload.userId,
        message: `Your order #${payload.orderId} has been cancelled.`,
      });
    });
  }

  private buildOrderConfirmationMessage(payload: OrderConfirmedPayload): string {
    if (payload.orderId) {
      return `Your order #${payload.orderId} has been confirmed and is being processed.`;
    }

    const orderCount = payload.orderCount ?? 1;
    return `Your order${orderCount > 1 ? 's have' : ' has'} been confirmed and ${orderCount > 1 ? 'are' : 'is'} being processed.`;
  }
}
