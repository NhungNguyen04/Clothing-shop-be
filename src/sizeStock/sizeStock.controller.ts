import { Controller, Get, Param, ParseEnumPipe, Query } from '@nestjs/common';
import { SizeStockService } from './sizeStock.service';
import { Size } from '@prisma/client';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

@ApiTags('size-stock')
@Controller('size-stock')
export class SizeStockController {
  constructor(private readonly sizeStockService: SizeStockService) {}

  @ApiOperation({ summary: 'Get all size stocks' })
  @ApiResponse({ status: 200, description: 'Returns all size stocks' })
  @Get()
  async findAll() {
    return this.sizeStockService.findAll();
  }

  @ApiOperation({ summary: 'Get size stock by product ID and size' })
  @ApiParam({ name: 'productId', description: 'Product ID' })
  @ApiParam({ name: 'size', enum: Size, description: 'Size enum value' })
  @ApiResponse({ status: 200, description: 'Returns the size stock' })
  @Get('product/:productId/size/:size')
  async findBySizeAndProductId(
    @Param('productId') productId: string,
    @Param('size', new ParseEnumPipe(Size)) size: Size,
  ) {
    return this.sizeStockService.findBySizeAndProductId(size, productId);
  }
}