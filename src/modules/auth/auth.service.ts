import { Injectable, UnauthorizedException, Logger } from "@nestjs/common"
import { JwtService } from "@nestjs/jwt"
import { UserService } from "../user/user.service"
import * as bcrypt from "bcryptjs"

@Injectable()
export class AuthService {

  private readonly tempCodeStorage = new Map<string, { user: any; expiresAt: number }>()

  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userService.findByEmail(email)

    if (!user) {
      return null;
    }

    if (user.password) {
      const isPasswordValid = await bcrypt.compare(password, user.password)
      if (isPasswordValid) {
        const { password, ...result } = user
        return result
      }
    }

    return null
  }

  async validateOAuthUser(userDetails: any) {
    const { email, name } = userDetails

    let user = await this.userService.findByEmail(email)

    if (user) {
      return user
    } else {
      const newUser = await this.userService.createOAuth({ email, name })
      user = await this.userService.findByEmail(newUser.email)
      return user
    }
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id }

    // Generate a temporary code for mobile clients
    const tempCode = this.generateTempCode(user)

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        idSeller: user.seller.id
      },
      access_token: this.jwtService.sign(payload),
      temp_code: tempCode, // This can be used by mobile clients
    }
  }

  // Generate a temporary code that can be exchanged for a token
  private generateTempCode(user: any): string {
    const code = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)

    // Store the code with an expiration (5 minutes)
    const expiresAt = Date.now() + 5 * 60 * 1000
    this.tempCodeStorage.set(code, { user, expiresAt })

    // Schedule cleanup
    setTimeout(
      () => {
        this.tempCodeStorage.delete(code)
      },
      5 * 60 * 1000,
    )

    return code
  }

  // Exchange a temporary code for a token
  async exchangeCodeForToken(code: string) {
    const storedData = this.tempCodeStorage.get(code)

    if (!storedData || Date.now() > storedData.expiresAt) {
      Logger.error(`Invalid or expired code: ${code}`)
      throw new UnauthorizedException("Invalid or expired code")
    }

    // Delete the code so it can't be used again
    this.tempCodeStorage.delete(code)

    // Return the login data
    return this.login(storedData.user)
  }
}

