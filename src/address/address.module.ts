import { Module } from '@nestjs/common';
import { AddressService } from './address.service';
import { AddressController } from './address.controller';

@Module({
  controllers: [AddressController],
  providers: [AddressService],
  exports: [AddressService], // This is crucial - it allows other modules to use AddressService
})
export class AddressModule {}
