import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { prisma } from '@/prisma/prisma';
import { Prisma } from '@prisma/client';
import { CreateSellerInput, UpdateSellerInput } from '@/schemas';
import { AddressService } from '../address/address.service';

@Injectable()
export class SellerService {
  constructor(private readonly addressService: AddressService) {}

  async create(createSellerDto: CreateSellerInput) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: createSellerDto.userId },
      });

      if (!user) {
        throw new NotFoundException(
          `User with ID ${createSellerDto.userId} not found`,
        );
      }
      
      const { addressInfo, ...sellerData } = createSellerDto;
      
      // Create the seller first
      const seller = await prisma.seller.create({
        data: {
          userId: user?.id,
          email: sellerData.email,
          managerName: sellerData.managerName,
          status: sellerData.status,
        },
      });

      // Use AddressService to create the address
      const address = await this.addressService.create({
        sellerId: seller.id,
        phoneNumber: addressInfo.phoneNumber,
        address: addressInfo.address,
        postalCode: addressInfo.postalCode,
        street: addressInfo.street,
        ward: addressInfo.ward,
        district: addressInfo.district,
        province: addressInfo.province,
      });

      // Update user role to SELLER
      await prisma.user.update({
        where: { id: seller.userId },
        data: { role: 'SELLER' },
      });

      return { 
        seller: {
          ...seller,
          address
        }
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          const target = error.meta?.target as string[];
          if (target?.includes('userId')) {
            throw new ConflictException(
              'Seller with this user ID already exists',
            );
          }
        }
      }
      throw error;
    }
  }

  async findAll() {
    const sellers = await prisma.seller.findMany({
      include: {
        user: true,
        products: {
          select: {
            id: true,
            name: true,
            price: true,
            image: true,
            category: true,
          },
        },
      },
    });

    return { sellers };
  }

  async findOne(id: string) {
    const seller = await prisma.seller.findUnique({
      where: { id },
      include: {
        user: true,
        products: true,
      },
    });

    if (!seller) {
      throw new NotFoundException(`Seller with ID ${id} not found`);
    }

    return { seller };
  }

  async findByUserId(userId: string) {
    const seller = await prisma.seller.findUnique({
      where: { userId },
      include: {
        user: true,
        products: true,
      },
    });

    if (!seller) {
      throw new NotFoundException(`Seller with user ID ${userId} not found`);
    }

    return { seller };
  }

  async update(id: string, updateSellerDto: UpdateSellerInput) {
    // Check if seller exists
    const existingSeller = await prisma.seller.findUnique({
      where: { id },
    });

    if (!existingSeller) {
      throw new NotFoundException(`Seller with ID ${id} not found`);
    }

    const { ...sellerData } = updateSellerDto;

    // Update seller data
    const updatedSeller = await prisma.seller.update({
      where: { id },
      data: sellerData,
    });

    return { updatedSeller };
  }

  async remove(id: string) {
    const seller = await prisma.seller.findUnique({
      where: { id },
      include: { products: true },
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

    return { deletedSeller };
  }

  async updateStatus(id: string, status: 'PENDING' | 'APPROVED' | 'REJECTED') {
    const seller = await prisma.seller.findUnique({
      where: { id },
    });

    if (!seller) {
      throw new NotFoundException(`Seller with ID ${id} not found`);
    }

    // Check if the status is already set to the requested value
    if (seller.status === status) {
      throw new ConflictException(`Seller with ID ${id} already has status ${status}`);
    }

    const updatedSeller = await prisma.seller.update({
      where: { id },
      data: { status },
      include: { user: true },
    });

    return { updatedSeller };
  }
}
