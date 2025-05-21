import { CreateOrderInput, UpdateOrderInput } from '@/schemas';
import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@/prisma/prisma';
import { Order, OrderItem, OrderStatus } from '@prisma/client';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class OrderService {
  constructor(private notificationService: NotificationService) {}

  // Create a new order with order items
  async create(createOrderDto: CreateOrderInput): Promise<Order> {
    // Calculate total price from all order items
    const totalItemsPrice = createOrderDto.orderItems.reduce(
      (sum, item) => sum + (item.quantity * item.price), 
      0
    );

    // Create the order with its items in a transaction
    const newOrder = await prisma.$transaction(async (tx) => {
      // 1. Create the order
      const order = await tx.order.create({
        data: {
          userId: createOrderDto.userId,
          sellerId: createOrderDto.sellerId,
          phoneNumber: createOrderDto.phoneNumber,
          address: createOrderDto.address,
          postalCode: createOrderDto.postalCode,
          paymentMethod: createOrderDto.paymentMethod,
          totalPrice: totalItemsPrice,
          status: OrderStatus.PENDING,
          paymentStatus: 'PENDING',
        },
      });

      // 2. Create all order items linked to this order
      for (const item of createOrderDto.orderItems) {
        await tx.orderItem.create({
          data: {
            orderId: order.id,
            sizeStockId: item.sizeStockId,
            quantity: item.quantity,
            totalPrice: item.quantity * item.price,
          },
        });

        // 3. Update the size stock quantity
        await tx.sizeStock.update({
          where: { id: item.sizeStockId },
          data: {
            quantity: {
              decrement: item.quantity,
            },
          },
        });
       
      }

      await tx.product.updateMany({
        where: {
          id: { in: createOrderDto.orderItems.map(item => item.sizeStockId) }
        },
        data: {
          stockQuantity: {
            decrement: createOrderDto.orderItems.reduce((sum, item) => sum + item.quantity, 0)
          }
        }
      });
      // 4. Create shipment record
      await tx.shipment.create({
        data: {
          orderId: order.id,
          status: 'PENDING',
        },
      });

      return order;
    });

    // Create notification for seller about new order
    await this.notificationService.createNotification({
      userId: createOrderDto.sellerId,
      message: `New order #${newOrder.id} has been placed.`,
    });

    // Create notification for customer about order confirmation
    await this.notificationService.createNotification({
      userId: createOrderDto.userId,
      message: `Your order #${newOrder.id} has been confirmed and is being processed.`,
    });

    return newOrder;
  }

  async createFromCart(userId: string, cartId: string, orderData: any): Promise<Order[]> {
    // Get cart with all items
    const cart = await prisma.cart.findUnique({
      where: { id: cartId },
      include: { 
        cartItems: {
          include: { 
            sizeStock: { 
              include: { product: true } 
            } 
          }
        }
      }
    });

    if (!cart || cart.cartItems.length === 0) {
      throw new NotFoundException('Cart is empty or not found');
    }

    // Filter only the selected cart items if selectedCartItemIds is provided
    const selectedCartItems = orderData.selectedCartItemIds && orderData.selectedCartItemIds.length > 0
      ? cart.cartItems.filter(item => orderData.selectedCartItemIds.includes(item.id))
      : cart.cartItems;

    if (selectedCartItems.length === 0) {
      throw new NotFoundException('No cart items selected for checkout');
    }
    
    // Group items by seller
    const itemsBySeller = {};
    for (const item of selectedCartItems) {
      const sellerId = item.sizeStock.product.sellerId;
      if (!itemsBySeller[sellerId]) itemsBySeller[sellerId] = [];
      itemsBySeller[sellerId].push(item);
    }

    // Create an order for each seller
    const orders: Order[] = [];
    for (const [sellerId, items] of Object.entries(itemsBySeller)) {
      const typedItems = items as typeof cart.cartItems;
      // Calculate total price
      const totalPrice = typedItems.reduce((sum, item) => sum + item.totalPrice, 0);
      
      // Create order
      const order = await prisma.$transaction(async (tx) => {
        // 1. Create the order
        const newOrder = await tx.order.create({
          data: {
            userId,
            sellerId,
            phoneNumber: orderData.phoneNumber,
            address: orderData.address,
            postalCode: orderData.postalCode,
            paymentMethod: orderData.paymentMethod,
            totalPrice,
            status: OrderStatus.PENDING,
            paymentStatus: 'PENDING',
          },
        });

        // 2. Create all order items
        for (const item of typedItems) {
          await tx.orderItem.create({
            data: {
              orderId: newOrder.id,
              sizeStockId: item.sizeStockId,
              quantity: item.quantity,
              totalPrice: item.totalPrice,
            },
          });

          // 3. Update the size stock quantity
          await tx.sizeStock.update({
            where: { id: item.sizeStockId },
            data: {
              quantity: {
                decrement: item.quantity,
              },
            },
          });

          // 4. Delete cart item
          await tx.cartItem.delete({
            where: { id: item.id }
          });
        }

        await tx.product.updateMany({
        where: {
          id: { in: typedItems.map(item => item.sizeStock.productId) }
        },
        data: {
          stockQuantity: {
            decrement: typedItems.reduce((sum, item) => sum + item.quantity, 0)
          }
        }
      });

        // 5. Create shipment record
        await tx.shipment.create({
          data: {
            orderId: newOrder.id,
            status: 'PENDING',
          },
        });

        return newOrder;
      });

      orders.push(order);

      // Send notifications
      await this.notificationService.createNotification({
        userId: sellerId,
        message: `New order #${order.id} has been placed.`,
      });
    }

    // Recalculate cart total value after removing selected items
    await this.recalculateCartTotal(cartId);

    // Send notification to customer
    await this.notificationService.createNotification({
      userId,
      message: `Your order${orders.length > 1 ? 's have' : ' has'} been confirmed and ${orders.length > 1 ? 'are' : 'is'} being processed.`,
    });

    return orders;
  }

  // Helper method to recalculate cart total after checkout
  private async recalculateCartTotal(cartId: string): Promise<void> {
    const cart = await prisma.cart.findUnique({
      where: { id: cartId },
      include: { cartItems: true }
    });
    
    if (cart) {
      const newTotal = cart.cartItems.reduce((sum, item) => sum + item.totalPrice, 0);
      await prisma.cart.update({
        where: { id: cartId },
        data: { totalCartValue: newTotal }
      });
    }
  }

  async findBySeller(sellerId: string): Promise<Order[]> {
    const orders = await prisma.order.findMany({
      where: {
        sellerId: sellerId
      },
      include: {
        user: true,
        orderItems: {
          include: {
            sizeStock: {
              include: {
                product: true
              }
            }
          }
        },
        shipment: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return orders;
  }

  async findByUser(userId: string): Promise<Order[]> {
    const orders = await prisma.order.findMany({
      where: {
        userId: userId
      },
      include: {
        seller: true,
        orderItems: {
          include: {
            sizeStock: {
              include: {
                product: true
              }
            }
          }
        },
        shipment: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return orders;
  }

  async findOne(orderId: string): Promise<Order> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        seller: true,
        orderItems: {
          include: {
            sizeStock: {
              include: {
                product: true
              }
            }
          }
        },
        shipment: true
      }
    });
    
    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }
    
    return order;
  }

  async update(orderId: string, updateOrderDto: UpdateOrderInput): Promise<Order> {
    // First, find the order
    const order = await this.findOne(orderId);

    // Update order in a transaction if needed
    return await prisma.$transaction(async (tx) => {
      // Update the order
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          status: updateOrderDto.status,
          paymentStatus: updateOrderDto.paymentStatus,
          // Add other fields that can be updated
        },
        include: {
          orderItems: true,
          shipment: true
        }
      });

      // Update shipment status if needed
      if (updateOrderDto.shipmentStatus) {
        await tx.shipment.update({
          where: { orderId: orderId },
          data: {
            status: updateOrderDto.shipmentStatus,
            deliveryDate: updateOrderDto.deliveryDate
          }
        });
      }

      // Send notification about order status update
      if (updateOrderDto.status && updateOrderDto.status !== order.status) {
        await this.notificationService.createNotification({
          userId: order.userId,
          message: `Order #${orderId} status has been updated to ${updateOrderDto.status}.`
        });
      }

      return updatedOrder;
    });
  }

  async delete(orderId: string): Promise<Order> {
    // First, check if order exists
    const order = await this.findOne(orderId);

    // Delete order and all related items in a transaction
    return await prisma.$transaction(async (tx) => {
      // Delete order items
      await tx.orderItem.deleteMany({
        where: { orderId: orderId }
      });

      // Delete shipment
      await tx.shipment.delete({
        where: { orderId: orderId }
      });

      // Delete the order
      const deletedOrder = await tx.order.delete({
        where: { id: orderId }
      });

      return deletedOrder;
    });
  }
}