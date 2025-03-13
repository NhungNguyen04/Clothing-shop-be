import { CreateSellerInput } from '@/schemas';

export class CreateSellerDto implements CreateSellerInput {
  userId: string;
  address: string;
  phone: string;
}
