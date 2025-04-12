import { Injectable, NotFoundException } from '@nestjs/common';
import { Size } from '@prisma/client';
import { prisma } from '@/prisma/prisma';

@Injectable()
export class SizeStockService {
  constructor() {}

  async findAll() {
    return prisma.sizeStock.findMany({
      include: {
        product: true,
      },
    });
  }

  async findBySizeAndProductId(size: Size, productId: string) {
    const sizeStock = await prisma.sizeStock.findFirst({
      where: {
        size,
        productId,
      },
      include: {
        product: true,
      },
    });

    if (!sizeStock) {
      throw new NotFoundException(`Size stock with size ${size} for product ${productId} not found`);
    }

    return sizeStock;
  }
}
