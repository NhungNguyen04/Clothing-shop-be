export const DomainEventName = {
  OrderPlaced: 'order.placed',
  OrderConfirmed: 'order.confirmed',
  OrderStatusPatched: 'order.status.patched',
  OrderStatusAdvanced: 'order.status.advanced',
  OrderCancelled: 'order.cancelled',
  PaymentSucceeded: 'payment.succeeded',
} as const;

export type DomainEventName = typeof DomainEventName[keyof typeof DomainEventName];

export interface DomainEvent<TPayload = Record<string, unknown>> {
  name: DomainEventName;
  payload: TPayload;
}

export type DomainEventHandler<TPayload = Record<string, unknown>> = (
  event: DomainEvent<TPayload>,
) => Promise<void> | void;
