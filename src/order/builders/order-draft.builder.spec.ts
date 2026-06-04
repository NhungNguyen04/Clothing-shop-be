import { OrderStatus, PaymentMethod, PaymentStatus } from '@prisma/client';
import { OrderDraftBuilder } from './order-draft.builder';

describe('OrderDraftBuilder', () => {
  it('builds an order draft with existing defaults', () => {
    const draft = OrderDraftBuilder.from({
      userId: 'user-1',
      sellerId: 'seller-1',
      phoneNumber: '0123456789',
      address: '123 Main St',
      totalPrice: 100,
    }).build();

    expect(draft).toMatchObject({
      userId: 'user-1',
      sellerId: 'seller-1',
      phoneNumber: '0123456789',
      address: '123 Main St',
      paymentMethod: PaymentMethod.COD,
      totalPrice: 100,
      status: OrderStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
    });
  });

  it('keeps explicit payment method and optional postal code', () => {
    const draft = OrderDraftBuilder.from({
      userId: 'user-1',
      sellerId: 'seller-1',
      phoneNumber: '0123456789',
      address: '123 Main St',
      postalCode: '70000',
      paymentMethod: PaymentMethod.VNPAY,
      totalPrice: 100,
    }).build();

    expect(draft.postalCode).toBe('70000');
    expect(draft.paymentMethod).toBe(PaymentMethod.VNPAY);
  });

  it('rejects incomplete drafts', () => {
    expect(() => new OrderDraftBuilder().forCustomer('user-1').build()).toThrow(
      'Cannot build order draft without sellerId',
    );
  });
});
