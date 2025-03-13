import { UpdateSellerInput } from '@/schemas';

export class UpdateSellerDto implements UpdateSellerInput {
  address?: string;
  phone?: string;
}
