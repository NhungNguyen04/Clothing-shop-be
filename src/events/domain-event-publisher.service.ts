import { Injectable } from '@nestjs/common';
import { DomainEvent, DomainEventHandler, DomainEventName } from './domain-event.interface';

@Injectable()
export class DomainEventPublisher {
  private readonly handlers = new Map<DomainEventName, DomainEventHandler[]>();

  subscribe<TPayload>(eventName: DomainEventName, handler: DomainEventHandler<TPayload>): void {
    const handlers = this.handlers.get(eventName) ?? [];
    handlers.push(handler as DomainEventHandler);
    this.handlers.set(eventName, handlers);
  }

  async publish<TPayload>(event: DomainEvent<TPayload>): Promise<void> {
    const handlers = this.handlers.get(event.name) ?? [];

    for (const handler of handlers) {
      await handler(event as DomainEvent);
    }
  }
}
