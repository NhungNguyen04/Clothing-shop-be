import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post(':userId')
  async addToCart(
    @Param('userId') userId: string,
    @Body() addToCartDto: AddToCartDto
  ) {
    return this.cartService.addToCart(userId, addToCartDto);
  }

  @Get(':userId')
  async getUserCart(@Param('userId') userId: string) {
    return this.cartService.getUserCart(userId);
  }

  @Delete(':userId/item/:cartItemId')
  async deleteCartItem(
    @Param('userId') userId: string,
    @Param('cartItemId') cartItemId: string
  ) {
    return this.cartService.deleteCartItem(cartItemId, userId);
  }

  @Patch(':userId/item/:cartItemId')
  async updateCartItemQuantity(
    @Param('userId') userId: string,
    @Param('cartItemId') cartItemId: string,
    @Body() body: { quantity: number }
  ) {
    return this.cartService.updateCartItemQuantity(cartItemId, userId, body.quantity);
  }

  @Get(':userId/seller/:sellerId')
  async getCartItemsBySeller(
    @Param('userId') userId: string,
    @Param('sellerId') sellerId: string
  ) {
    return this.cartService.getCartItemsBySeller(userId, sellerId);
  }

  @Delete(':userId/seller/:sellerId')
  async deleteCartItemsBySeller(
    @Param('userId') userId: string,
    @Param('sellerId') sellerId: string
  ) {
    return this.cartService.deleteCartItemsBySeller(userId, sellerId);
  }
}
