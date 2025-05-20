import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { CreateProductInput, createProductSchema, UpdateProductInput } from "@/schemas";
import { ProductService } from "./product.service";
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiQuery } from '@nestjs/swagger';

@ApiTags('Products')
@Controller('products')
export class ProductController {

  constructor(private readonly productService: ProductService) {}
  
  @ApiOperation({ summary: 'Create a new product' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'T-Shirt' },
        description: { type: 'string', example: 'Comfortable cotton t-shirt' },
        price: { type: 'number', example: 29.99 },
        sellerId: { type: 'string', example: 'seller-uuid' },
        categoryId: { type: 'string', example: 'category-uuid' },
        // Add other properties as needed
      },
      required: ['name', 'price', 'sellerId']
    }
  })
  @ApiResponse({ status: 201, description: 'Product created successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @Post()
  async createProduct(@Body() createProductDto: CreateProductInput) {
    try {
      const validated = await createProductSchema.safeParse(createProductDto);
      if (!validated.success) {
        return {
          success: false,
          message: 'Validation failed',
          error: validated.error.format(),
          data: null
        };
      }

      const result = await this.productService.create(validated.data);
      return {
        success: true,
        message: 'Product created successfully',
        error: null,
        data: result
      }
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to process request',
        error: error.response?.error || error.name,
        data: null
      };
    }
  }

  @ApiOperation({ summary: 'Get all products' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiResponse({ status: 200, description: 'Returns all products' })
  @Get()
  async findAll(@Query('page') page: string = '0', @Query('limit') limit: string = '0') {
    try {
      const pageNumber = parseInt(page, 10);
      const limitNumber = parseInt(limit, 10);
      const result = await this.productService.findAll(pageNumber, limitNumber);
      return {
        success: true,
        message: 'Products fetched successfully',
        error: null,
        data: result
      }
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to process request',
        error: error.response?.error || error.name,
        data: null
      };
    }
  }

  @ApiOperation({ summary: 'Get products by seller' })
  @ApiParam({ name: 'id', description: 'Seller ID' })
  @ApiResponse({ status: 200, description: 'Returns seller products' })
  @Get('/seller/:id')
  async findBySeller(@Param('id') id: string) {
    try {
      const result = await this.productService.findBySeller(id)
      return {
        success: true,
        message: 'Product fetched successfully',
        error: null,
        data: result
      }
    }
    catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to process request',
        error: error.response?.error || error.name,
        data: null
      };
    }
  }

  @ApiOperation({ summary: 'Get product by ID' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({ status: 200, description: 'Returns product details' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const result = await this.productService.findOne(id);
      return {
        success: true,
        message: 'Product fetched successfully',
        error: null,
        data: result
      }
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to process request',
        error: error.response?.error || error.name,
        data: null
      };
    }
  }

  @ApiOperation({ summary: 'Update product' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Updated T-Shirt' },
        description: { type: 'string', example: 'Updated description' },
        price: { type: 'number', example: 39.99 },
        // Add other properties as needed
      }
    }
  })
  @ApiResponse({ status: 200, description: 'Product updated successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateData: UpdateProductInput) {
    try {
      const result = await this.productService.update(id, updateData)
      return {
        success: true,
        message: 'Product updated successfully',
        error: null,
        data: result
      }
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to process request',
        error: error.response?.error || error.name,
        data: null
      };
    }
  }

  @ApiOperation({ summary: 'Delete product' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({ status: 200, description: 'Product deleted successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      const result = await this.productService.remove(id);
      return {
        success: true,
        message: 'Product deleted successfully',
        error: null,
        data: result
      }
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to process request',
        error: error.response?.error || error.name,
        data: null
      };
    }
  }
}