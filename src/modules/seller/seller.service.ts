import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { prisma } from '@/prisma/prisma';
import { CreateSellerDto } from './dto/creteSeller';
import { UpdateSellerDto } from './dto/updateSeller.dto';

@Injectable()
export class SellerService {
  constructor() {}

  async create(createSellerDto: CreateSellerDto) {
    try {
      // Check if user exists first
      const existingUser = await prisma.user.findUnique({
        where: { id: createSellerDto.userId },
      });

      if (!existingUser) {
        throw new NotFoundException(`User with ID ${createSellerDto.userId} not found`);
      }

      // Check if user is already a seller
      const existingSeller = await prisma.seller.findUnique({
        where: { userId: createSellerDto.userId },
      });

      if (existingSeller) {
        throw new ConflictException(`User with ID ${createSellerDto.userId} is already a seller`);
      }

      const seller = await prisma.seller.create({
        data: createSellerDto,
        include: { user: true },
      });

      // Update user role to SELLER
      await prisma.user.update({
        where: { id: seller.userId },
        data: { role: 'SELLER' },
    });
    
      return {
        success: true,
        message: 'Seller created successfully',
        data: seller
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to create seller',
        error: error.name,
        data: null
      };
    }
  }

  async findAll() {
    try {
      const sellers = await prisma.seller.findMany({
        include: {
          user: true,
          products: {
            select: {
              id: true,
              name: true,
              price: true,
              image: true,
              category: true
            }
          }
        },
      });

      return {
        success: true,
        message: 'Sellers retrieved successfully',
        data: sellers
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to retrieve sellers',
        error: error.name,
        data: null
      };
    }
  }

  async findOne(id: string) {
    try {
      const seller = await prisma.seller.findUnique({
        where: { id },
        include: { 
          user: true,
          products: true 
        },
      });

      if (!seller) {
        throw new NotFoundException(`Seller with ID ${id} not found`);
      }

      return {
        success: true,
        message: 'Seller retrieved successfully',
        data: seller
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || `Failed to find seller with ID ${id}`,
        error: error.name,
        data: null
      };
    }
  }

  async findByUserId(userId: string) {
    try {
      const seller = await prisma.seller.findUnique({
        where: { userId },
        include: { 
          user: true,
          products: true 
        },
      });

      if (!seller) {
        throw new NotFoundException(`Seller with user ID ${userId} not found`);
      }

      return {
        success: true,
        message: 'Seller retrieved successfully',
        data: seller
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || `Failed to find seller with user ID ${userId}`,
        error: error.name,
        data: null
      };
    }
  }

  async update(id: string, updateSellerDto: UpdateSellerDto) {
    try {
      // Check if seller exists
      const existingSeller = await prisma.seller.findUnique({
        where: { id }
      });

      if (!existingSeller) {
        throw new NotFoundException(`Seller with ID ${id} not found`);
      }

      const updatedSeller = await prisma.seller.update({
        where: { id },
        data: updateSellerDto,
      });

      return {
        success: true,
        message: 'Seller updated successfully',
        data: updatedSeller
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || `Failed to update seller with ID ${id}`,
        error: error.name,
        data: null
      };
    }
  }

  async remove(id: string) {
    try {
      // Check if seller exists first
      const seller = await prisma.seller.findUnique({
        where: { id },
        include: { products: true }
      });

      if (!seller) {
        throw new NotFoundException(`Seller with ID ${id} not found`);
      }

      // Delete all products from this seller first if any exist
      if (seller.products.length > 0) {
        await prisma.product.deleteMany({
          where: { sellerId: id },
        });
      }

      // Delete the seller
      const deletedSeller = await prisma.seller.delete({
        where: { id },
      });

      // Update user role back to CUSTOMER
      await prisma.user.update({
        where: { id: seller.userId },
        data: { role: 'CUSTOMER' },
      });

      return {
        success: true,
        message: 'Seller deleted successfully',
        data: deletedSeller
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || `Failed to delete seller with ID ${id}`,
        error: error.name,
        data: null
      };
    }
  }
}
