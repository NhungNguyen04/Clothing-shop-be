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
        name: { type: 'string', minLength: 2, example: 'T-Shirt', description: 'Product name (min 2 characters)' },
        description: { type: 'string', minLength: 10, example: 'Comfortable cotton t-shirt', description: 'Product description (min 10 characters)' },
        price: { type: 'number', minimum: 0.01, example: 29.99, description: 'Product price (must be positive)' },
        image: { type: 'array', items: { type: 'string' }, example: ['image1.jpg', 'image2.jpg'], description: 'Product images' },
        category: { type: 'string', enum: ['men', 'women', 'kids'], example: 'men', description: 'Product category' },
        subCategory: { type: 'string', enum: ['topwear', 'bottomwear', 'winterwear'], example: 'topwear', description: 'Product subcategory' },
        sellerId: { type: 'string', minLength: 1, example: 'seller-uuid', description: 'ID of the seller (required)' },
        stockSize: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              size: { type: 'string', enum: ['S', 'M', 'L', 'XL', 'XXL'], example: 'M', description: 'Size' },
              quantity: { type: 'number', minimum: 0, example: 10, description: 'Quantity (nonnegative integer)' }
            },
            required: ['size', 'quantity']
          },
          example: [{ size: 'M', quantity: 10 }, { size: 'L', quantity: 5 }],
          description: 'Stock by size'
        }
      },
      required: ['name', 'description', 'price', 'image', 'category', 'subCategory', 'sellerId', 'stockSize']
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
        name: { type: 'string', example: 'Updated T-Shirt', description: 'Product name' },
        description: { type: 'string', example: 'Updated description', description: 'Product description' },
        price: { type: 'number', example: 39.99, description: 'Product price' },
        categoryId: { type: 'string', example: 'category-uuid', description: 'ID of the product category' },
        images: { type: 'array', items: { type: 'string' }, example: ['image1.jpg', 'image2.jpg'], description: 'Product images' },
        stock: { type: 'number', example: 100, description: 'Available stock' },
        colors: { type: 'array', items: { type: 'string' }, example: ['Red', 'Blue', 'Black'], description: 'Available colors' },
        sizes: { type: 'array', items: { type: 'string' }, example: ['S', 'M', 'L', 'XL'], description: 'Available sizes' },
        isAvailable: { type: 'boolean', example: true, description: 'Product availability status' }
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