import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Shipment')
@Controller('shipment')
export class ShipmentController {}
