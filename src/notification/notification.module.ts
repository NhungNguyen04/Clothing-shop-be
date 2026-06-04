import { Module } from '@nestjs/common';
import { EventsModule } from '../events/events.module';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { OrderNotificationObserver } from './observers/order-notification.observer';
import { PaymentNotificationObserver } from './observers/payment-notification.observer';

@Module({
  imports: [EventsModule],
  controllers: [NotificationController],
  providers: [NotificationService, OrderNotificationObserver, PaymentNotificationObserver],
  exports: [NotificationService],
})
export class NotificationModule {}
