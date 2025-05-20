import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiQuery } from '@nestjs/swagger';

@ApiTags('Cart')
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @ApiOperation({ summary: 'Get user cart' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Returns user cart items' })
  @Get(':userId')
  async getUserCart(@Param('userId') userId: string) {
    return this.cartService.getUserCart(userId);
  }

  @ApiOperation({ summary: 'Add item to cart' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiBody({ type: AddToCartDto })
  @ApiResponse({ status: 201, description: 'Item added to cart' })
  @Post(':userId')
  async addToCart(
    @Param('userId') userId: string,
    @Body() addToCartDto: AddToCartDto
  ) {
    return this.cartService.addToCart(userId, addToCartDto);
  }

  @ApiOperation({ summary: 'Update cart item quantity' })
  @ApiParam({ name: 'cartItemId', description: 'Cart item ID' })
  @ApiQuery({ name: 'userId', description: 'User ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        quantity: { type: 'number', example: 3 }
      },
      required: ['quantity']
    }
  })
  @ApiResponse({ status: 200, description: 'Cart item quantity updated' })
  @Patch('item/:cartItemId')
  async updateCartItemQuantity(
    @Param('cartItemId') cartItemId: string,
    @Query('userId') userId: string,
    @Body() body: { quantity: number }
  ) {
    return this.cartService.updateCartItemQuantity(cartItemId, userId, body.quantity);
  }

  @ApiOperation({ summary: 'Delete cart item' })
  @ApiParam({ name: 'cartItemId', description: 'Cart item ID' })
  @ApiQuery({ name: 'userId', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Cart item deleted' })
  @Delete('item/:cartItemId')
  async deleteCartItem(
    @Param('cartItemId') cartItemId: string,
    @Query('userId') userId: string
  ) {
    return this.cartService.deleteCartItem(cartItemId, userId);
  }

  @ApiOperation({ summary: 'Delete all items from a seller' })
  @ApiParam({ name: 'sellerId', description: 'Seller ID' })
  @ApiQuery({ name: 'userId', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'All items from seller deleted' })
  @Delete('seller/:sellerId')
  async deleteCartItemsBySeller(
    @Param('sellerId') sellerId: string,
    @Query('userId') userId: string
  ) {
    return this.cartService.deleteCartItemsBySeller(userId, sellerId);
  }
}
