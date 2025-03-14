import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { prisma } from "@/prisma/prisma";
import { CreateProductInput, UpdateProductInput } from "@/schemas";

@Injectable()
export class ProductService {

  constructor() {}

  async create(createProductDto: CreateProductInput) {
    const sizes = createProductDto.stockSize.map(item => item.size);
    const uniqueSizes = new Set(sizes);
    
    if (sizes.length !== uniqueSizes.size) {
      throw new BadRequestException('Each size must be unique in stockSize array');
    }

    const existingSeller = await prisma.seller.findUnique({
      where: { id: createProductDto.sellerId },
    });

    if (!existingSeller) {
      throw new NotFoundException(`Seller with ID ${createProductDto.sellerId} not found`);
    }

    // Calculate stockQuantity as sum of all quantities in stockSize
    const stockQuantity = createProductDto.stockSize.reduce(
      (total, item) => total + item.quantity, 
      0
    );

    // create product
    const product = await prisma.product.create({
      data: {
        name: createProductDto.name,
        description: createProductDto.description,
        price: createProductDto.price,
        image: createProductDto.image,
        category: createProductDto.category,
        subCategory: createProductDto.subCategory,
        stockQuantity,
        sellerId: createProductDto.sellerId,
        stockSize: {
          create: createProductDto.stockSize.map(item => ({
            size: item.size,
            quantity: item.quantity,
          })),
        },
      },
      include: { 
        seller: true,
        stockSize: true // Include the stockSize relation in the response
      },
    });

    return {
      ...product,
      stockSize: product.stockSize.map(item => ({
        size: item.size,
        quantity: item.quantity
      }))
    };
  }

  async findAll() {
    return prisma.product.findMany({
      include: {
        seller: true,
        stockSize: true
      }
    });
  }

  async findOne(id: string) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        seller: true,
        stockSize: true
      }
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  async update(id: string, updateData: UpdateProductInput) {
    const product = await prisma.product.findUnique({ where: { id } });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    const data: any = { ...updateData };

    if (updateData.stockSize) {
      const sizes = updateData.stockSize.map(item => item.size);
      const uniqueSizes = new Set(sizes);
      
      if (sizes.length !== uniqueSizes.size) {
        throw new BadRequestException('Each size must be unique in stockSize array');
      }

      data.stockQuantity = updateData.stockSize.reduce(
        (total, item) => total + item.quantity, 
        0
      );

      data.stockSize = {
        deleteMany: { productId: id },
        create: updateData.stockSize.map(item => ({
          size: item.size,
          quantity: item.quantity,
        })),
      };
    }

    return prisma.product.update({
      where: { id },
      data,
      include: {
        seller: true,
        stockSize: true
      }
    });
  } 

  async remove(id: string) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: { stockSize: true }
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    if (product.stockSize.length > 0) {
      await prisma.sizeStock.deleteMany({
        where: { productId: id }
      });
    }

    return prisma.product.delete({ where: { id } });
  }
}