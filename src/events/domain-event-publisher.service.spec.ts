import { DomainEventName } from './domain-event.interface';
import { DomainEventPublisher } from './domain-event-publisher.service';

describe('DomainEventPublisher', () => {
  it('publishes events to subscribed handlers in order', async () => {
    const publisher = new DomainEventPublisher();
    const calls: string[] = [];

    publisher.subscribe(DomainEventName.OrderPlaced, () => { calls.push('first'); });
    publisher.subscribe(DomainEventName.OrderPlaced, async () => { calls.push('second'); });

    await publisher.publish({
      name: DomainEventName.OrderPlaced,
      payload: { orderId: 'order-1' },
    });

    expect(calls).toEqual(['first', 'second']);
  });

  it('ignores events without subscribers', async () => {
    const publisher = new DomainEventPublisher();

    await expect(
      publisher.publish({ name: DomainEventName.PaymentSucceeded, payload: {} }),
    ).resolves.toBeUndefined();
  });
});

