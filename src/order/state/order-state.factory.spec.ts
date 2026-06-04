import { OrderStatus } from '@prisma/client';
import { OrderStateFactory } from './order-state.factory';

describe('OrderStateFactory', () => {
  it('advances pending and shipped orders', () => {
    expect(OrderStateFactory.from(OrderStatus.PENDING).nextStatus()).toBe(OrderStatus.SHIPPED);
    expect(OrderStateFactory.from(OrderStatus.SHIPPED).nextStatus()).toBe(OrderStatus.DELIVERED);
  });

  it('blocks terminal status advancement', () => {
    expect(() => OrderStateFactory.from(OrderStatus.DELIVERED).nextStatus()).toThrow(
      'Order is already delivered. No further status update possible.',
    );
    expect(() => OrderStateFactory.from(OrderStatus.CANCELLED).nextStatus()).toThrow(
      'Order is cancelled. No further status update possible.',
    );
  });

  it('allows cancellation only before terminal states', () => {
    expect(OrderStateFactory.from(OrderStatus.PENDING).canCancel()).toBe(true);
    expect(OrderStateFactory.from(OrderStatus.SHIPPED).canCancel()).toBe(true);
    expect(OrderStateFactory.from(OrderStatus.DELIVERED).canCancel()).toBe(false);
    expect(OrderStateFactory.from(OrderStatus.CANCELLED).canCancel()).toBe(false);
  });
});
