import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AddressService } from './address.service';
import { CreateAddressInput, UpdateAddressInput } from '../../schemas';
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';

@ApiTags('addresses')
@Controller('addresses')
export class AddressController {
  constructor(private readonly addressService: AddressService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new address' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string', example: 'user-uuid' },
        sellerId: { type: 'string', example: 'seller-uuid' },
        phoneNumber: { type: 'string', example: '+1234567890' },
        address: { type: 'string', example: '123 Main St' },
        postalCode: { type: 'string', example: '12345' },
        street: { type: 'string', example: 'Main St' },
        ward: { type: 'string', example: 'Ward 1' },
        district: { type: 'string', example: 'District 1' },
        province: { type: 'string', example: 'Province 1' },
      },
      required: ['userId', 'address'],
    },
  })
  create(@Body() createAddressDto: CreateAddressInput) {
    return this.addressService.create(createAddressDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all addresses or filter by user/seller ID' })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'sellerId', required: false })
  findAll(
    @Query('userId') userId?: string,
    @Query('sellerId') sellerId?: string,
  ) {
    if (userId) {
      return this.addressService.findByUserId(userId);
    }
    if (sellerId) {
      return this.addressService.findBySellerId(sellerId);
    }
    return this.addressService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an address by ID' })
  @ApiParam({ name: 'id', description: 'Address ID' })
  findOne(@Param('id') id: string) {
    return this.addressService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an address' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        phoneNumber: { type: 'string', example: '+1234567890' },
        address: { type: 'string', example: '123 Main St' },
        postalCode: { type: 'string', example: '12345' },
        street: { type: 'string', example: 'Main St' },
        ward: { type: 'string', example: 'Ward 1' },
        district: { type: 'string', example: 'District 1' },
        province: { type: 'string', example: 'Province 1' },
      },
    },
  })
  @ApiParam({ name: 'id', description: 'Address ID' })

  update(
    @Param('id') id: string,
    @Body() updateAddressDto: UpdateAddressInput,
  ) {
    return this.addressService.update(id, updateAddressDto);
  }

  @Patch(':id/coordinates')
  @ApiOperation({ summary: 'Update address coordinates' })
  @ApiParam({ name: 'id', description: 'Address ID' })
  updateCoordinates(
    @Param('id') id: string,
    @Body() coords: { latitude: number; longitude: number },
  ) {
    return this.addressService.updateCoordinates(id, coords.latitude, coords.longitude);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an address' })
  @ApiParam({ name: 'id', description: 'Address ID' })
  remove(@Param('id') id: string) {
    return this.addressService.remove(id);
  }
}
