import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { SellerModule } from '../seller/seller.module';
import { AddressModule } from '../address/address.module';

@Module({
  imports: [SellerModule, AddressModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
