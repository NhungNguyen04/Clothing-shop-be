import { Module } from '@nestjs/common';
import { DomainEventPublisher } from './domain-event-publisher.service';

@Module({
  providers: [DomainEventPublisher],
  exports: [DomainEventPublisher],
})
export class EventsModule {}
