import { CreateOrderInput } from '@/schemas';
import { Injectable } from '@nestjs/common';
import { prisma } from '@/prisma/prisma';
import { Prisma } from '@prisma/client';
@Injectable()
export class OrderService {
    async create(createOrderDto: CreateOrderInput) {
    const newOrder = await prisma.order.create(
            {
                data: {
                    totalPrice: createOrderDto.totalPrice,
                    status: createOrderDto.status,
                    customerName: createOrderDto.customerName,
                    address: createOrderDto.address, 
                    phoneNumber: createOrderDto.phoneNumber,
                    orderDetails: {
                        create: createOrderDto.orderDetails.map(item => ({
                            productId: item.productId,
                            size: item.size,
                            quantity: item.quantity,
                            price: item.price
                        }))
                    }
                }
            }
        )
        return newOrder
    }
}
