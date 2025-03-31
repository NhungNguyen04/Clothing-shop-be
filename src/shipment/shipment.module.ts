import { Module } from '@nestjs/common';
import { ShipmentService } from './shipment.service';

@Module({
  providers: [ShipmentService]
})
export class ShipmentModule {}
