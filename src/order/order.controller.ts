import { CreateOrderInput, createOrderSchema, UpdateOrderInput, updateOrderSchema } from '@/schemas';
import { Body, Controller, Get, Param, Post, Delete, Patch } from '@nestjs/common';
import { OrderService } from './order.service';

@Controller('orders')
export class OrderController {
    
    constructor(private readonly orderService: OrderService) {}

    @Post()
    async create(@Body() createOrderDto: CreateOrderInput) {
        try {
            const validationResult = createOrderSchema.safeParse(createOrderDto);

            if (!validationResult.success) {
                return {
                    success: false,
                    message: 'Validation failed',
                    error: validationResult.error.format(),
                    data: null
                };
            }

            const newOrder = await this.orderService.create(validationResult.data);
            return {
                success: true,
                message: 'Order created successfully',
                error: null,
                data: newOrder
            };
        } catch (error) {
            return {
                success: false,
                message: error.message || 'Failed to process request',
                error: error.name,
                data: null
            };
        }
    }

    @Get('/seller/:sellerId')
    async findBySeller(@Param('sellerId') sellerId: string) {
        try {
            const orders = await this.orderService.findBySeller(sellerId)
            if (!orders) {
                return {
                    success: false,
                    message: `Orders with ID ${sellerId} not found`,
                    error: null,
                    data: null
                };
            }
            return {
                success: true,
                message: 'Order fetched successfully',
                error: null,
                data: orders
            };
        } catch (error) {
            return {
                success: false,
                message: error.message || 'Failed to fetch order',
                error: error.name,
                data: null
            };
        }
    }

    @Get(':orderId')
    async findOne(@Param('orderId') orderId: string) {
        try {
            const order = await this.orderService.findOne(orderId);
            if (!order) {
                return {
                    success: false,
                    message: `Order with ID ${orderId} not found`,
                    error: null,
                    data: null
                };
            }
            return {
                success: true,
                message: 'Order fetched successfully',
                error: null,
                data: order
            };
        } catch (error) {
            return {
                success: false,
                message: error.message || 'Failed to fetch order',
                error: error.name,
                data: null
            };
        }
    }

    @Patch(':orderId')
    async update(@Param('orderId') orderId: string, @Body() updateOrderDto: UpdateOrderInput) {
        try {
            const validationResult = updateOrderSchema.safeParse(updateOrderDto);

            if (!validationResult.success) {
                return {
                    success: false,
                    message: 'Validation failed',
                    error: validationResult.error.format(),
                    data: null
                };
            }

            const updatedOrder = await this.orderService.update(orderId, validationResult.data);
            if (!updatedOrder) {
                return {
                    success: false,
                    message: `Order with ID ${orderId} not found`,
                    error: null,
                    data: null
                };
            }

            return {
                success: true,
                message: 'Order updated successfully',
                error: null,
                data: updatedOrder
            };
        } catch (error) {
            return {
                success: false,
                message: error.message || 'Failed to update order',
                error: error.name,
                data: null
            };
        }
    }

    @Delete(':orderId')
    async delete(@Param('orderId') orderId: string) {
        try {
            const deletedOrder = await this.orderService.delete(orderId);
            if (!deletedOrder) {
                return {
                    success: false,
                    message: `Order with ID ${orderId} not found`,
                    error: null,
                    data: null
                };
            }

            return {
                success: true,
                message: 'Order deleted successfully',
                error: null,
                data: deletedOrder
            };
        } catch (error) {
            return {
                success: false,
                message: error.message || 'Failed to delete order',
                error: error.name,
                data: null
            };
        }
    }
}
