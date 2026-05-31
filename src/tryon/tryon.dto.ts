import { IsNotEmpty, IsString } from 'class-validator';

export class TryOnRequestDto {
  @IsString()
  @IsNotEmpty()
  personImageUrl: string;

  @IsString()
  @IsNotEmpty()
  productImageUrl: string;
}
