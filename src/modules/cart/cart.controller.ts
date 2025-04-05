import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  // Get user's cart - /cart/:userId
  @Get(':userId')
  async getUserCart(@Param('userId') userId: string) {
    return this.cartService.getUserCart(userId);
  }

  // Add item to cart - /cart/:userId
  @Post(':userId')
  async addToCart(
    @Param('userId') userId: string,
    @Body() addToCartDto: AddToCartDto
  ) {
    return this.cartService.addToCart(userId, addToCartDto);
  }

  // Update cart item quantity - /cart/item/:cartItemId
  @Patch('item/:cartItemId')
  async updateCartItemQuantity(
    @Param('cartItemId') cartItemId: string,
    @Query('userId') userId: string,
    @Body() body: { quantity: number }
  ) {
    return this.cartService.updateCartItemQuantity(cartItemId, userId, body.quantity);
  }

  // Delete a cart item - /cart/item/:cartItemId
  @Delete('item/:cartItemId')
  async deleteCartItem(
    @Param('cartItemId') cartItemId: string,
    @Query('userId') userId: string
  ) {
    return this.cartService.deleteCartItem(cartItemId, userId);
  }

  // Delete all items from a seller - /cart/:userId/seller
  @Delete('seller/:sellerId')
  async deleteCartItemsBySeller(
    @Param('sellerId') sellerId: string,
    @Query('userId') userId: string
  ) {
    return this.cartService.deleteCartItemsBySeller(userId, sellerId);
  }
}
