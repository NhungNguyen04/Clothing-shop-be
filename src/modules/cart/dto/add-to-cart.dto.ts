import { IsEnum, IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';
import { Size } from '@prisma/client';

export class AddToCartDto {
  @IsNotEmpty()
  @IsString()
  productId: string;

  @IsNotEmpty()
  @IsEnum(Size)
  size: Size;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  quantity: number;
}
