import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { EventsModule } from '../events/events.module';
import { PaymentModule } from '../payment/payment.module';

@Module({
  imports: [EventsModule, PaymentModule],
  controllers: [OrderController],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrderModule {}
