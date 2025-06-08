import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateAddressInput, UpdateAddressInput } from '../../schemas';
import { prisma } from '@/prisma/prisma';

@Injectable()
export class AddressService {
  constructor() {}

  // Create a new address
  async create(createAddressDto: CreateAddressInput) {
    // Create address without latitude/longitude - they will be processed later
    return prisma.address.create({
      data: {
        userId: createAddressDto.userId,
        sellerId: createAddressDto.sellerId,
        phoneNumber: createAddressDto.phoneNumber,
        address: createAddressDto.address,
        postalCode: createAddressDto.postalCode,
        street: createAddressDto.street,
        ward: createAddressDto.ward,
        district: createAddressDto.district,
        province: createAddressDto.province,
      },
    });
  }

  // Get all addresses
  async findAll() {
    return prisma.address.findMany();
  }

  // Get addresses by user ID
  async findByUserId(userId: string) {
    return prisma.address.findMany({
      where: { userId },
    });
  }

  // Get addresses by seller ID
  async findBySellerId(sellerId: string) {
    return prisma.address.findMany({
      where: { sellerId },
    });
  }

  // Get an address by ID
  async findOne(id: string) {
    const address = await prisma.address.findUnique({
      where: { id },
    });

    if (!address) {
      throw new NotFoundException(`Address with ID ${id} not found`);
    }

    return address;
  }

  // Update an address
  async update(id: string, updateAddressDto: UpdateAddressInput) {
    // Check if address exists
    await this.findOne(id);

    return prisma.address.update({
      where: { id },
      data: updateAddressDto,
    });
  }

  // Update or add latitude and longitude for an address
  async updateCoordinates(id: string, latitude: number, longitude: number) {
    // Check if address exists
    await this.findOne(id);

    return prisma.address.update({
      where: { id },
      data: { latitude, longitude },
    });
  }

  // Delete an address
  async remove(id: string) {
    // Check if address exists
    await this.findOne(id);

    return prisma.address.delete({
      where: { id },
    });
  }
}
