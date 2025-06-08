import { Controller, Get, Post, Body, Patch, Param, Delete, Query, HttpStatus, HttpException } from '@nestjs/common';
import { SellerService } from './seller.service';
import { CreateSellerInput, createSellerSchema, UpdateSellerInput, updateSellerSchema } from '@/schemas';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';

@ApiTags('Sellers')
@Controller('sellers')
export class SellerController {
  constructor(private readonly sellerService: SellerService) {}

  @ApiOperation({ summary: 'Create a new seller' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string', example: 'user-uuid' },
        name: { type: 'string', example: 'Store Name' },
        description: { type: 'string', example: 'Store description' },
        // Add other properties based on your seller schema
      },
      required: ['userId', 'name']
    }
  })
  @ApiResponse({ status: 201, description: 'Seller created successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @Post()
  async create(@Body() createSellerDto: CreateSellerInput) {
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

  @ApiOperation({ summary: 'Get all sellers' })
  @ApiResponse({ status: 200, description: 'Returns all sellers' })
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

  @ApiOperation({ summary: 'Get seller by ID' })
  @ApiParam({ name: 'id', description: 'Seller ID' })
  @ApiResponse({ status: 200, description: 'Returns seller details' })
  @ApiResponse({ status: 404, description: 'Seller not found' })
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

  @ApiOperation({ summary: 'Get seller by user ID' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Returns seller details' })
  @ApiResponse({ status: 404, description: 'Seller not found' })
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

  @ApiOperation({ summary: 'Update seller' })
  @ApiParam({ name: 'id', description: 'Seller ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Updated Store Name' },
        description: { type: 'string', example: 'Updated store description' },
        // Add other updatable properties
      }
    }
  })
  @ApiResponse({ status: 200, description: 'Seller updated successfully' })
  @ApiResponse({ status: 404, description: 'Seller not found' })
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateSellerDto: UpdateSellerInput) {
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

  @ApiOperation({ summary: 'Delete seller' })
  @ApiParam({ name: 'id', description: 'Seller ID' })
  @ApiResponse({ status: 200, description: 'Seller deleted successfully' })
  @ApiResponse({ status: 404, description: 'Seller not found' })
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

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update seller status' })
  @ApiParam({ name: 'id', description: 'Seller ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['PENDING' , 'APPROVED' , 'REJECTED'], example: 'active' }
      },
      required: ['status']
    }
  })
  @ApiResponse({ status: 200, description: 'Seller status updated successfully' })
  @ApiResponse({ status: 404, description: 'Seller not found' })
  async updateStatus(@Param('id') id: string, @Body() body: { status: 'PENDING' | 'APPROVED' | 'REJECTED' }) {
    try {
      const { status } = body;
      if (!status) {
        throw new HttpException('Status is required', HttpStatus.BAD_REQUEST);
      }


      return await this.sellerService.updateStatus(id, status);
    } catch (error) {
      return {
        success: false,
        message: error.message || `Failed to update status for seller with ID ${id}`,
        error: error.name,
        data: null
      };
    }
  }
}
