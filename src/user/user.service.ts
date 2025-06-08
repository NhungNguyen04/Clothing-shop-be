import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { prisma } from '@/prisma/prisma';
import { CreateOAuthInput, CreateUserInput, UpdateUserInput } from '@/schemas';
import * as bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { SellerService } from '../seller/seller.service';

@Injectable()
export class UserService {
  constructor(private readonly sellerService: SellerService) {}
  
  async create(createUserDto: CreateUserInput) {
    try {
      const hashedPassword = await bcrypt.hash(createUserDto.password, 4);
      
      return await prisma.user.create({
        data: {
          email: createUserDto.email,
          name: createUserDto.name,
          password: hashedPassword,
        },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          const target = error.meta?.target as string[];
          if (target?.includes('email')) {
            throw new ConflictException('User with this email already exists');
          }
        }
      }
      throw error; 
    }
  }

  async createOAuth(createOAuth: CreateOAuthInput) {
    try {
      
      return await prisma.user.create({
        data: {
          email: createOAuth.email,
          name: createOAuth.name,
          isOAuth: true,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    } catch (error) {
      // Handle Prisma's unique constraint error
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          const target = error.meta?.target as string[];
          if (target?.includes('email')) {
            throw new ConflictException('User with this email already exists');
          }
        }
      }
      throw error; // Rethrow other errors
    }
  }

  async findAll() {
    return prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findOne(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      include: {
        seller: {
          select: {
            id: true
          }
        }
      }
    });
  }

  async update(id: string, updateData: UpdateUserInput) {
    const user = await prisma.user.findUnique({ 
      where: { id },
    });
    
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const data: any = { ...updateData };
    
    if (updateData.password) {
      data.password = await bcrypt.hash(updateData.password, 10);
    }

    return prisma.user.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    const user = await prisma.user.findUnique({ 
      where: { id },
    });
    
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    if (user.role === 'SELLER') {
      const seller = await prisma.seller.findFirst({ where: { userId: id } });
      if (seller) {
        await this.sellerService.remove(seller.id);
      }
    }
    
    return prisma.user.delete({
      where: { id },
    });
  }
}
