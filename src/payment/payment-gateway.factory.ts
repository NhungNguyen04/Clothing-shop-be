import { BadRequestException, Injectable } from '@nestjs/common';
import { PaymentMethod } from '@prisma/client';
import { PaymentGateway } from './payment-gateway.interface';
import { VnpayPaymentGateway } from './vnpay-payment.gateway';

@Injectable()
export class PaymentGatewayFactory {
  constructor(private readonly vnpayGateway: VnpayPaymentGateway) {}

  create(method: PaymentMethod): PaymentGateway {
    if (method === PaymentMethod.VNPAY) {
      return this.vnpayGateway;
    }

    throw new BadRequestException(`Payment method ${method} does not use an external gateway`);
  }
}
