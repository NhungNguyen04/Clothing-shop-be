import { OrderStatus } from '@prisma/client';

export interface OrderState {
  readonly status: OrderStatus;
  nextStatus(): OrderStatus;
  canCancel(): boolean;
  cancellationErrorMessage(): string;
}

abstract class BaseOrderState implements OrderState {
  abstract readonly status: OrderStatus;

  abstract nextStatus(): OrderStatus;

  canCancel(): boolean {
    return true;
  }

  cancellationErrorMessage(): string {
    return 'Order cannot be cancelled as it is already cancelled or delivered.';
  }
}

export class PendingOrderState extends BaseOrderState {
  readonly status = OrderStatus.PENDING;

  nextStatus(): OrderStatus {
    return OrderStatus.SHIPPED;
  }
}

export class ShippedOrderState extends BaseOrderState {
  readonly status = OrderStatus.SHIPPED;

  nextStatus(): OrderStatus {
    return OrderStatus.DELIVERED;
  }
}

export class DeliveredOrderState extends BaseOrderState {
  readonly status = OrderStatus.DELIVERED;

  nextStatus(): OrderStatus {
    throw new Error('Order is already delivered. No further status update possible.');
  }

  canCancel(): boolean {
    return false;
  }
}

export class CancelledOrderState extends BaseOrderState {
  readonly status = OrderStatus.CANCELLED;

  nextStatus(): OrderStatus {
    throw new Error('Order is cancelled. No further status update possible.');
  }

  canCancel(): boolean {
    return false;
  }
}
