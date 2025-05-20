import { CreateOrderInput, UpdateOrderInput } from '@/schemas'; // UpdateOrderInput for updating orders
import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@/prisma/prisma';
import { Order } from '@prisma/client';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class OrderService {
  constructor(private notificationService: NotificationService) {}

  // Create a new order
  async create(createOrderDto: CreateOrderInput): Promise<Order> {
    const newOrder: Order = await prisma.order.create({
      data: {
        totalPrice: createOrderDto.totalPrice,
        status: createOrderDto.status,
        customerName: createOrderDto.customerName,
        address: createOrderDto.address,
        phoneNumber: createOrderDto.phoneNumber,
        userId: createOrderDto.userId,
        productId: createOrderDto.productId,
        quantity: createOrderDto.quantity,
        price: createOrderDto.price,
        sellerId: createOrderDto.sellerId,
        size: createOrderDto.size,
      },
    });

    return newOrder;
  }

  async findBySeller(sellerId: string): Promise<Order[]> {
    const orders = await prisma.order.findMany(
      {
        where: {
          sellerId: sellerId
        },
        include: {
          user: true,
          product: true,
        }
      }
    )
    if (!orders) {
      throw new NotFoundException(`Orders with ID ${sellerId} not found`);
    }
    return orders
  }

  async findByUser(userId: string): Promise<Order[]> {
    const orders = await prisma.order.findMany({
      where: {
        userId: userId
      },
      include: {
        product: true,
      }
    });
    
    if (!orders || orders.length === 0) {
      throw new NotFoundException(`No orders found for user with ID ${userId}`);
    }
    
    return orders;
  }

  async findOne(orderId: string): Promise<Order> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }
    return order;
  }

  async update(
    orderId: string,
    updateOrderDto: UpdateOrderInput,
  ): Promise<Order> {
    // First, find the order to get the user ID
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    // Update the order
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: updateOrderDto.status,
      },
    });

    // Send notification to the user about the order status update
    if (updateOrderDto.status && updateOrderDto.status !== order.status) {
      await this.notificationService.createOrderStatusNotification(
        order.userId,
        orderId,
        updateOrderDto.status
      );
    }

    return updatedOrder;
  }

  async delete(orderId: string): Promise<Order> {
    const deletedOrder = await prisma.order.delete({
      where: { id: orderId },
    });

    if (!deletedOrder) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    return deletedOrder;
  }
}
