import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { PaymentGatewayFactory } from './payment-gateway.factory';
import { VnpayPaymentGateway } from './vnpay-payment.gateway';

@Module({
  controllers: [PaymentController],
  providers: [PaymentService, PaymentGatewayFactory, VnpayPaymentGateway],
  exports: [PaymentService]
})
export class PaymentModule {}
