import { OrderStatus } from '@prisma/client';
import {
  CancelledOrderState,
  DeliveredOrderState,
  OrderState,
  PendingOrderState,
  ShippedOrderState,
} from './order-state.interface';

export class OrderStateFactory {
  private static readonly states: Record<OrderStatus, OrderState> = {
    [OrderStatus.PENDING]: new PendingOrderState(),
    [OrderStatus.SHIPPED]: new ShippedOrderState(),
    [OrderStatus.DELIVERED]: new DeliveredOrderState(),
    [OrderStatus.CANCELLED]: new CancelledOrderState(),
  };

  static from(status: OrderStatus): OrderState {
    const state = this.states[status];

    if (!state) {
      throw new Error('Invalid order status.');
    }

    return state;
  }
}
