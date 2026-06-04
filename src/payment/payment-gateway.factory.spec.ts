import { BadRequestException } from '@nestjs/common';
import { PaymentMethod } from '@prisma/client';
import { PaymentGatewayFactory } from './payment-gateway.factory';
import { PaymentGateway } from './payment-gateway.interface';

describe('PaymentGatewayFactory', () => {
  const vnpayGateway: PaymentGateway = {
    buildPaymentUrl: jest.fn(),
    verifyCallback: jest.fn(),
  };

  it('returns the VNPAY gateway for VNPAY payments', () => {
    const factory = new PaymentGatewayFactory(vnpayGateway as any);

    expect(factory.create(PaymentMethod.VNPAY)).toBe(vnpayGateway);
  });

  it('rejects payment methods without an external gateway', () => {
    const factory = new PaymentGatewayFactory(vnpayGateway as any);

    expect(() => factory.create(PaymentMethod.COD)).toThrow(BadRequestException);
  });
});
