import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { SellerService } from '../seller/seller.service';

@Module({
  controllers: [UserController],
  providers: [UserService, SellerService],
  exports: [UserService],
})
export class UserModule {}
