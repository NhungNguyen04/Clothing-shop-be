import { CreateOrderInput, createOrderSchema } from '@/schemas';
import { Body, Controller, Get, Post } from '@nestjs/common';
import { OrderService } from './order.service';

@Controller('orders')
export class OrderController {
    
    constructor(private readonly orderService: OrderService){}

    @Post()
    async create(@Body() createOrderDto : CreateOrderInput ) {
        try {
            const validationResult = createOrderSchema.safeParse(createOrderDto)

            if (!validationResult.success) {
                return {
                    success: false,
                    message: 'Validation failed',
                    error: validationResult.error.format(),
                    data: null
                  };
            }
            const newOrder = await this.orderService.create(validationResult.data)
            return newOrder
        } 
        catch (error) {
            return {
                success: false,
                message: error.message || 'Failed to process request',
                error: error.name,
                data: null
            }
        }
    }

    @Get()
    async findAll() {
        return "Hello World"
    }
}
