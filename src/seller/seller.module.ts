import { Module } from '@nestjs/common';
import { SellerService } from './seller.service';
import { SellerController } from './seller.controller';
import { ProductService } from '../product/product.service';
import { AddressModule } from '../address/address.module';

@Module({
  imports: [AddressModule],
  controllers: [SellerController],
  providers: [SellerService, ProductService],
  exports: [SellerService],
})
export class SellerModule {}
