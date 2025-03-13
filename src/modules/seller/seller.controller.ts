import { Controller, Get, Post, Body, Patch, Param, Delete, Query, HttpStatus, HttpException } from '@nestjs/common';
import { SellerService } from './seller.service';
import { CreateSellerDto } from './dto/creteSeller';
import { UpdateSellerDto } from './dto/updateSeller.dto';
import { createSellerSchema, updateSellerSchema } from '@/schemas';

@Controller('sellers')
export class SellerController {
  constructor(private readonly sellerService: SellerService) {}

  @Post()
  async create(@Body() createSellerDto: CreateSellerDto) {
    try {
      const validationResult = createSellerSchema.safeParse(createSellerDto);
      
      if (!validationResult.success) {
        return {
          success: false,
          message: 'Validation failed',
          error: validationResult.error.format(),
          data: null
        };
      }
      
      const result = await this.sellerService.create(validationResult.data);
      return result;
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to process request',
        error: error.name,
        data: null
      };
    }
  }

  @Get()
  async findAll() {
    try {
      return await this.sellerService.findAll();
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to retrieve sellers',
        error: error.name,
        data: null
      };
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      return await this.sellerService.findOne(id);
    } catch (error) {
      return {
        success: false,
        message: error.message || `Failed to find seller with ID ${id}`,
        error: error.name,
        data: null
      };
    }
  }

  @Get('user/:userId')
  async findByUserId(@Param('userId') userId: string) {
    try {
      return await this.sellerService.findByUserId(userId);
    } catch (error) {
      return {
        success: false,
        message: error.message || `Failed to find seller with user ID ${userId}`,
        error: error.name,
        data: null
      };
    }
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateSellerDto: UpdateSellerDto) {
    try {
      const validationResult = updateSellerSchema.safeParse(updateSellerDto);
      
      if (!validationResult.success) {
        return {
          success: false,
          message: 'Validation failed',
          error: validationResult.error.format(),
          data: null
        };
      }
      
      return await this.sellerService.update(id, validationResult.data);
    } catch (error) {
      return {
        success: false,
        message: error.message || `Failed to update seller with ID ${id}`,
        error: error.name,
        data: null
      };
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      return await this.sellerService.remove(id);
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
