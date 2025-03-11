import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userService.findByEmail(email);
    
    if (!user) {
      return null;
    }

    if (user.password) {
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (isPasswordValid) {
        const { password, ...result } = user;
        return result;
        }
    }
    
    return null;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id };
    
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      access_token: this.jwtService.sign(payload),
    };
  }
}
