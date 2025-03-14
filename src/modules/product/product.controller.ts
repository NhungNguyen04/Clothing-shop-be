import { Body, Controller, Delete, Get, Param, Post } from "@nestjs/common";
import { CreateProductInput, createProductSchema } from "@/schemas";
import { ProductService } from "./product.service";

@Controller('products')
export class ProductController {

  constructor(private readonly productService: ProductService) {}
  
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

  @Get()
  async findAll() {
    try {
      const result = await this.productService.findAll();
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