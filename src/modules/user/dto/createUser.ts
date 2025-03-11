import { createUserSchema, CreateUserInput } from '@/schemas';

export class CreateUserDto implements CreateUserInput {
  email: string;
  name: string;
  password: string;
  
  static validate(data: unknown) {
    return createUserSchema.safeParse(data);
  }
}
