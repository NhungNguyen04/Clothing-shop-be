import { updateUserSchema, UpdateUserInput } from '@/schemas';
import { CreateUserDto } from './createUser';

export class UpdateUserDto implements Partial<CreateUserDto> {
  email?: string;
  name?: string;
  password?: string;
  
  static validate(data: unknown) {
    return updateUserSchema.safeParse(data);
  }
}
