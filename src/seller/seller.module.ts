import { Module } from '@nestjs/common';
import { SellerService } from './seller.service';
import { SellerController } from './seller.controller';
import { ProductService } from '../product/product.service';

@Module({
  imports: [],
  controllers: [SellerController],
  providers: [SellerService, ProductService],
  exports: [SellerService],
})
export class SellerModule {}
