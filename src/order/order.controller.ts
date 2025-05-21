import { 
  CreateOrderInput, createOrderSchema, 
  UpdateOrderInput, updateOrderSchema, 
  CartToOrderInput, cartToOrderSchema 
} from '@/schemas';
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
                userId: { type: 'string' },
                sellerId: { type: 'string' },
                phoneNumber: { type: 'string' },
                address: { type: 'string' },
                postalCode: { type: 'string' },
                paymentMethod: { type: 'string', enum: ['COD', 'VIETQR'] },
                orderItems: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            sizeStockId: { type: 'string' },
                            quantity: { type: 'number' },
                            price: { type: 'number' }
                        }
                    }
                }
            },
            required: ['userId', 'sellerId', 'phoneNumber', 'address', 'orderItems']
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
            const orders = await this.orderService.findBySeller(sellerId);
            return {
                success: true,
                message: 'Orders fetched successfully',
                error: null,
                data: orders
            };
        } catch (error) {
            return {
                success: false,
                message: error.message || 'Failed to fetch orders',
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
                status: { 
                    type: 'string', 
                    enum: ['PENDING', 'SHIPPED', 'DELIVERED', 'CANCELLED'] 
                },
                paymentStatus: { 
                    type: 'string', 
                    enum: ['PENDING', 'SUCCESS'] 
                },
                shipmentStatus: { type: 'string' },
                deliveryDate: { type: 'string', format: 'date-time' },
                cancelReason: { type: 'string' }
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
    async findByUser(@Param('userId') userId: string) {
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

    @ApiOperation({ summary: 'Create order from selected cart items' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                cartId: { type: 'string' },
                userId: { type: 'string' },
                phoneNumber: { type: 'string' },
                address: { type: 'string' },
                postalCode: { type: 'string' },
                paymentMethod: { type: 'string', enum: ['COD', 'VIETQR'] },
                selectedCartItemIds: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'IDs of selected cart items to checkout'
                }
            },
            required: ['cartId', 'userId', 'phoneNumber', 'address', 'selectedCartItemIds']
        }
    })
    @ApiResponse({ status: 201, description: 'Order created successfully from cart' })
    @Post('/from-cart')
    async createFromCart(@Body() cartToOrderDto: CartToOrderInput) {
        try {
            const validationResult = cartToOrderSchema.safeParse(cartToOrderDto);

            if (!validationResult.success) {
                return {
                    success: false,
                    message: 'Validation failed',
                    error: validationResult.error.format(),
                    data: null
                };
            }

            const { cartId, userId, ...orderData } = validationResult.data;
            const orders = await this.orderService.createFromCart(userId, cartId, orderData);
            
            return {
                success: true,
                message: 'Orders created successfully from selected cart items',
                error: null,
                data: orders
            };
        } catch (error) {
            return {
                success: false,
                message: error.message || 'Failed to create orders from cart',
                error: error.name,
                data: null
            };
        }
    }
}