import { CreateOrderInput, createOrderSchema, UpdateOrderInput, updateOrderSchema } from '@/schemas';
import { Body, Controller, Get, Param, Post, Delete, Patch } from '@nestjs/common';
import { OrderService } from './order.service';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';

@ApiTags('Orders')
@Controller('orders')
export class OrderController {
    
    constructor(private readonly orderService: OrderService) {}

    @ApiOperation({ summary: 'Create a new order' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                userId: { type: 'string', example: 'user-uuid' },
                items: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            productId: { type: 'string', example: 'product-uuid' },
                            quantity: { type: 'number', example: 2 },
                            price: { type: 'number', example: 29.99 }
                        }
                    }
                },
                shippingAddress: { type: 'string', example: '123 Main St, City' },
                // Add other required properties
            },
            required: ['userId', 'items']
        }
    })
    @ApiResponse({ status: 201, description: 'Order created successfully' })
    @ApiResponse({ status: 400, description: 'Validation failed' })
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

    @ApiOperation({ summary: 'Get orders by seller ID' })
    @ApiParam({ name: 'sellerId', description: 'Seller ID' })
    @ApiResponse({ status: 200, description: 'Returns seller orders' })
    @ApiResponse({ status: 404, description: 'No orders found' })
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

    @ApiOperation({ summary: 'Get order by ID' })
    @ApiParam({ name: 'orderId', description: 'Order ID' })
    @ApiResponse({ status: 200, description: 'Returns order details' })
    @ApiResponse({ status: 404, description: 'Order not found' })
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

    @ApiOperation({ summary: 'Update order' })
    @ApiParam({ name: 'orderId', description: 'Order ID' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                status: { type: 'string', example: 'PROCESSING' },
                shippingAddress: { type: 'string', example: 'Updated address' },
                // Add other updatable properties
            }
        }
    })
    @ApiResponse({ status: 200, description: 'Order updated successfully' })
    @ApiResponse({ status: 404, description: 'Order not found' })
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

    @ApiOperation({ summary: 'Delete order' })
    @ApiParam({ name: 'orderId', description: 'Order ID' })
    @ApiResponse({ status: 200, description: 'Order deleted successfully' })
    @ApiResponse({ status: 404, description: 'Order not found' })
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

    @ApiOperation({ summary: 'Get user orders' })
    @ApiParam({ name: 'userId', description: 'User ID' })
    @ApiResponse({ status: 200, description: 'Returns user orders' })
    @Get('/user/:userId')
    async get(@Param('userId') userId: string) {
        try {
            const orders = await this.orderService.findByUser(userId);
            return {
                success: true,
                message: 'Orders fetched successfully',
                error: null,
                data: orders
            };
        } catch (error) {
            return {
                success: false,
                message: error.message || 'Failed to fetch user orders',
                error: error.name,
                data: null
            };
        }
    }
}
