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

@Injectable()
export class SellerService {
  constructor() {}

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

      // Then create the address with a reference to the seller
      const address = await prisma.address.create({
        data: {
          sellerId: seller.id,
          address: addressInfo.address,
          phoneNumber: addressInfo.phoneNumber,
          postalCode: addressInfo.postalCode,
          street: addressInfo.street,
          ward: addressInfo.ward,
          district: addressInfo.district,
          province: addressInfo.province,
        },
      });

      // Update the seller with the addressId
      const updatedSeller = await prisma.seller.update({
        where: { id: seller.id },
        data: { addressId: address.id },
        include: { address: true, user: true },
      });

      // Update user role to SELLER
      await prisma.user.update({
        where: { id: seller.userId },
        data: { role: 'SELLER' },
      });

      return { seller: updatedSeller };
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
        address: true,
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
        address: true,
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
        address: true,
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
      include: { address: true },
    });

    if (!existingSeller) {
      throw new NotFoundException(`Seller with ID ${id} not found`);
    }

    // Extract address-related fields
    const { addressInfo, ...sellerData } = updateSellerDto;

    // Update seller data
    const updatedSellerData = await prisma.seller.update({
      where: { id },
      data: sellerData,
    });

    // Update address if provided
    if (addressInfo && existingSeller.addressId) {
      await prisma.address.update({
        where: { id: existingSeller.addressId },
        data: {
          // Ensure non-nullable fields have default values
          address: addressInfo.address ?? existingSeller.address?.address ?? "",
          phoneNumber: addressInfo.phoneNumber ?? existingSeller.address?.phoneNumber ?? "",
          postalCode: addressInfo.postalCode,
          street: addressInfo.street,
          ward: addressInfo.ward,
          district: addressInfo.district,
          province: addressInfo.province,
        },
      });
    }
    // Create new address if seller doesn't have one yet
    else if (addressInfo && !existingSeller.addressId) {
      const newAddress = await prisma.address.create({
        data: {
          sellerId: id,
          // Ensure non-nullable fields have default values
          address: addressInfo.address ?? "",
          phoneNumber: addressInfo.phoneNumber ?? "",
          postalCode: addressInfo.postalCode,
          street: addressInfo.street,
          ward: addressInfo.ward,
          district: addressInfo.district,
          province: addressInfo.province,
        },
      });
      
      // Link the address to the seller
      await prisma.seller.update({
        where: { id },
        data: { addressId: newAddress.id },
      });
    }

    // Get the updated seller with address
    const updatedSeller = await prisma.seller.findUnique({
      where: { id },
      include: { address: true, user: true },
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

    // Delete any addresses linked to this seller
    await prisma.address.deleteMany({
      where: { sellerId: id }
    });

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
}
