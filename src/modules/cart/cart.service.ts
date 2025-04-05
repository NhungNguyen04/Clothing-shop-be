import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@/prisma/prisma';
import { AddToCartDto } from './dto/add-to-cart.dto';

@Injectable()
export class CartService {
  private readonly logger = new Logger(CartService.name);

  constructor() {}

  async addToCart(userId: string, addToCartDto: AddToCartDto) {
    const { productId, size, quantity } = addToCartDto;

    // Find the product first to ensure it exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { seller: true }
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    // Find the specific size stock for this product
    const sizeStock = await prisma.sizeStock.findFirst({
      where: {
        productId,
        size
      }
    });

    if (!sizeStock) {
      throw new NotFoundException(`Size ${size} not available for product ${productId}`);
    }

    if (sizeStock.quantity < quantity) {
      throw new BadRequestException(`Not enough stock available. Only ${sizeStock.quantity} items left for size ${size}`);
    }

    // Check if user has a cart, if not create one
    let cart = await prisma.cart.findFirst({
      where: { userId },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
      });
      this.logger.log(`Created new cart for user: ${userId}`);
    }

    // Check if the item with the same sizeStock already exists in the cart
    const existingCartItem = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        sizeStockId: sizeStock.id,
      },
    });

    // Calculate total price for this item
    const itemTotalPrice = product.price * quantity;

    if (existingCartItem) {
      // If item exists, update the quantity and total price
      const updatedCartItem = await prisma.cartItem.update({
        where: { id: existingCartItem.id },
        data: {
          quantity: existingCartItem.quantity + quantity,
          totalPrice: existingCartItem.totalPrice + itemTotalPrice,
        },
        include: {
          sizeStock: {
            include: {
              product: true
            }
          }
        }
      });
      
      this.logger.log(`Updated quantity for existing cart item: ${updatedCartItem.id}`);
      return updatedCartItem;
    } else {
      // If item doesn't exist, create a new cart item
      const newCartItem = await prisma.cartItem.create({
        data: {
          userId,
          cartId: cart.id,
          sizeStockId: sizeStock.id,
          quantity,
          totalPrice: itemTotalPrice,
        },
        include: {
          sizeStock: {
            include: {
              product: true
            }
          }
        }
      });
      
      this.logger.log(`Added new item to cart: ${newCartItem.id}`);
      return newCartItem;
    }
  }

  async getUserCart(userId: string) {
    const cart = await prisma.cart.findFirst({
      where: { userId },
      include: {
        cartItems: {
          include: {
            sizeStock: {
              include: {
                product: {
                  include: {
                    seller: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!cart) {
      return { id: userId, cartItems: [] };
    }

    // Calculate total cart value
    const totalCartValue = cart.cartItems.reduce(
      (total, item) => total + item.totalPrice,
      0
    );

    return {
      ...cart,
      totalCartValue
    };
  }

  async deleteCartItem(cartItemId: string, userId: string) {
    // First, verify the cart item exists and belongs to the user
    const cartItem = await prisma.cartItem.findFirst({
      where: {
        id: cartItemId,
        userId,
      },
      include: {
        cart: true,
      },
    });

    if (!cartItem) {
      throw new NotFoundException(`Cart item with ID ${cartItemId} not found or doesn't belong to the user`);
    }

    // Delete the cart item
    await prisma.cartItem.delete({
      where: {
        id: cartItemId,
      },
    });

    this.logger.log(`Deleted cart item: ${cartItemId}`);
    return { success: true, message: 'Cart item deleted successfully' };
  }

  async updateCartItemQuantity(cartItemId: string, userId: string, quantity: number) {
    if (quantity <= 0) {
      throw new BadRequestException('Quantity must be greater than 0');
    }

    // Find the cart item and verify it belongs to the user
    const cartItem = await prisma.cartItem.findFirst({
      where: {
        id: cartItemId,
        userId,
      },
      include: {
        sizeStock: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!cartItem) {
      throw new NotFoundException(`Cart item with ID ${cartItemId} not found or doesn't belong to the user`);
    }

    // Check if there's enough stock
    if (cartItem.sizeStock.quantity < quantity) {
      throw new BadRequestException(
        `Not enough stock available. Only ${cartItem.sizeStock.quantity} items available.`
      );
    }

    // Calculate new total price
    const unitPrice = cartItem.sizeStock.product.price;
    const newTotalPrice = unitPrice * quantity;

    // Update the cart item
    const updatedCartItem = await prisma.cartItem.update({
      where: {
        id: cartItemId,
      },
      data: {
        quantity,
        totalPrice: newTotalPrice,
      },
      include: {
        sizeStock: {
          include: {
            product: true,
          },
        },
      },
    });

    this.logger.log(`Updated quantity for cart item: ${cartItemId} to ${quantity}`);
    return updatedCartItem;
  }

  async getCartItemsBySeller(userId: string, sellerId: string) {
    // First check if the user has a cart
    const cart = await prisma.cart.findFirst({
      where: { userId },
      include: {
        cartItems: {
          where: {
            sizeStock: {
              product: {
                sellerId,
              },
            },
          },
          include: {
            sizeStock: {
              include: {
                product: {
                  include: {
                    seller: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!cart || cart.cartItems.length === 0) {
      return { items: [], totalValue: 0 };
    }

    // Calculate total value for this seller's items
    const totalValue = cart.cartItems.reduce((total, item) => total + item.totalPrice, 0);

    return {
      items: cart.cartItems,
      totalValue,
    };
  }

  async deleteCartItemsBySeller(userId: string, sellerId: string) {
    // Find the user's cart
    const cart = await prisma.cart.findFirst({
      where: { userId },
    });

    if (!cart) {
      throw new NotFoundException(`Cart not found for user: ${userId}`);
    }

    // Delete cart items from this seller in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // First identify the cart items to delete
      const itemsToDelete = await tx.cartItem.findMany({
        where: {
          cartId: cart.id,
          sizeStock: {
            product: {
              sellerId,
            },
          },
        },
      });

      if (itemsToDelete.length === 0) {
        return { count: 0 };
      }

      // Delete the items
      const deleteResult = await tx.cartItem.deleteMany({
        where: {
          id: {
            in: itemsToDelete.map(item => item.id),
          },
        },
      });

      return deleteResult;
    });

    this.logger.log(`Deleted ${result.count} cart items from seller: ${sellerId}`);
    return {
      success: true,
      deletedCount: result.count,
      message: `${result.count} items removed from cart`,
    };
  }
}
