import { Test, TestingModule } from '@nestjs/testing';
import { DomainEventPublisher } from '../events/domain-event-publisher.service';
import { OrderService } from './order.service';

describe('OrderService', () => {
  let service: OrderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        {
          provide: DomainEventPublisher,
          useValue: { publish: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<OrderService>(OrderService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
