import { Controller, Get, Param, ParseEnumPipe, Query } from '@nestjs/common';
import { SizeStockService } from './sizeStock.service';
import { Size } from '@prisma/client';

@Controller('size-stock')
export class SizeStockController {
  constructor(private readonly sizeStockService: SizeStockService) {}

  @Get()
  async findAll() {
    return this.sizeStockService.findAll();
  }

  @Get('product/:productId/size/:size')
  async findBySizeAndProductId(
    @Param('productId') productId: string,
    @Param('size', new ParseEnumPipe(Size)) size: Size,
  ) {
    return this.sizeStockService.findBySizeAndProductId(size, productId);
  }
}
