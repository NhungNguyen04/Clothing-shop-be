import { CreateOrderInput, UpdateOrderInput } from '@/schemas'; // UpdateOrderInput for updating orders
import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@/prisma/prisma';
import { Order } from '@prisma/client';

@Injectable()
export class OrderService {
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

  async findBySeller(sellerId: string) : Promise<Order[]> {
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
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: updateOrderDto.status,
      },
    });

    if (!updatedOrder) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
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
