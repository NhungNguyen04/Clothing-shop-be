import { Injectable, OnModuleInit } from '@nestjs/common';
import { DomainEventName } from '../../events/domain-event.interface';
import { DomainEventPublisher } from '../../events/domain-event-publisher.service';
import { NotificationService } from '../notification.service';

type PaymentSucceededPayload = {
  orderId: string;
  userId: string;
};

@Injectable()
export class PaymentNotificationObserver implements OnModuleInit {
  constructor(
    private readonly events: DomainEventPublisher,
    private readonly notificationService: NotificationService,
  ) {}

  onModuleInit(): void {
    this.events.subscribe<PaymentSucceededPayload>(DomainEventName.PaymentSucceeded, async ({ payload }) => {
      await this.notificationService.createNotification({
        userId: payload.userId,
        message: `Your payment for order ${payload.orderId} was successful.`,
      });
    });
  }
}
