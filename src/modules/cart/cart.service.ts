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
        data: { 
          userId,
          totalCartValue: 0 // Initialize with zero
        },
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

    let cartItem;
    
    // Use a transaction to ensure data consistency
    await prisma.$transaction(async (tx) => {
      if (existingCartItem) {
        // If item exists, update the quantity and total price
        cartItem = await tx.cartItem.update({
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
        
        this.logger.log(`Updated quantity for existing cart item: ${cartItem.id}`);
      } else {
        // If item doesn't exist, create a new cart item
        cartItem = await tx.cartItem.create({
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
        
        this.logger.log(`Added new item to cart: ${cartItem.id}`);
      }

      // Update the cart's total value
      const cartItems = await tx.cartItem.findMany({
        where: {
          cartId: cart.id,
        },
      });

      const newTotalCartValue = cartItems.reduce((total, item) => total + item.totalPrice, 0);

      await tx.cart.update({
        where: {
          id: cart.id,
        },
        data: {
          totalCartValue: newTotalCartValue,
        },
      });
    });

    return cartItem;
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
      return { id: userId, cartItems: [], itemsBySeller: [], totalCartValue: 0 };
    }

    // Group items by seller
    const sellerMap = new Map();
    
    cart.cartItems.forEach(item => {
      const sellerId = item.sizeStock.product.sellerId;
      const sellerName = item.sizeStock.product.seller.managerName || 'Unknown Seller';
      
      if (!sellerMap.has(sellerId)) {
        sellerMap.set(sellerId, {
          sellerId,
          sellerName,
          items: [],
          totalValue: 0
        });
      }
      
      const sellerGroup = sellerMap.get(sellerId);
      sellerGroup.items.push(item);
      sellerGroup.totalValue += item.totalPrice;
    });
    
    const itemsBySeller = Array.from(sellerMap.values());

    return {
      ...cart,
      itemsBySeller
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

    // Use transaction to delete item and update cart total
    await prisma.$transaction(async (tx) => {
      // Delete the cart item
      await tx.cartItem.delete({
        where: {
          id: cartItemId,
        },
      });

      // Update the cart's total value
      const cartItems = await tx.cartItem.findMany({
        where: {
          cartId: cartItem.cartId,
        },
      });

      const newTotalCartValue = cartItems.reduce((total, item) => total + item.totalPrice, 0);

      await tx.cart.update({
        where: {
          id: cartItem.cartId,
        },
        data: {
          totalCartValue: newTotalCartValue,
        },
      });
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
    const priceDifference = newTotalPrice - cartItem.totalPrice;

    // Use transaction to update cart item and cart total
    let updatedCartItem;
    await prisma.$transaction(async (tx) => {
      // Update the cart item
      updatedCartItem = await tx.cartItem.update({
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

      // Update the cart's total value
      await tx.cart.update({
        where: {
          id: cartItem.cartId,
        },
        data: {
          totalCartValue: {
            increment: priceDifference
          },
        },
      });
    });

    this.logger.log(`Updated quantity for cart item: ${cartItemId} to ${quantity}`);
    return updatedCartItem;
  }

  async deleteCartItemsBySeller(userId: string, sellerId: string) {
    // Find the user's cart
    const cart = await prisma.cart.findFirst({
      where: { userId },
    });

    if (!cart) {
      throw new NotFoundException(`Cart not found for user: ${userId}`);
    }

    // Use transaction to delete cart items and update cart total
    const result = await prisma.$transaction(async (tx) => {
      // First identify the cart items to delete and their total value
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
        return { count: 0, totalPriceReduction: 0 };
      }

      const totalPriceReduction = itemsToDelete.reduce((total, item) => total + item.totalPrice, 0);

      // Delete the items
      const deleteResult = await tx.cartItem.deleteMany({
        where: {
          id: {
            in: itemsToDelete.map(item => item.id),
          },
        },
      });

      // Update the cart's total value
      await tx.cart.update({
        where: {
          id: cart.id,
        },
        data: {
          totalCartValue: {
            decrement: totalPriceReduction
          },
        },
      });

      return { 
        count: deleteResult.count, 
        totalPriceReduction 
      };
    });

    this.logger.log(`Deleted ${result.count} cart items from seller: ${sellerId}`);
    return {
      success: true,
      deletedCount: result.count,
      totalPriceReduction: result.totalPriceReduction,
      message: `${result.count} items removed from cart`,
    };
  }
}
