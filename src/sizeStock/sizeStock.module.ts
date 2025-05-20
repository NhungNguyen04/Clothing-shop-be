import { Module } from '@nestjs/common';
import { SizeStockController } from './sizeStock.controller';
import { SizeStockService } from './sizeStock.service';

@Module({
  imports: [],
  controllers: [SizeStockController],
  providers: [SizeStockService],
  exports: [SizeStockService],
})
export class SizeStockModule {}
