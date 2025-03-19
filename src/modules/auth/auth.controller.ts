import { Controller, Post, UseGuards, Request, Get, Req, Res, Logger, Query, Body } from "@nestjs/common"
import { AuthService } from "./auth.service"
import { LocalAuthGuard } from "./guards/local-auth.guard"
import { GoogleAuthGuard } from "./guards/google-auth.guard"
import { Response } from "express"
import { ExecutionContextHost } from "@nestjs/core/helpers/execution-context-host"
import { AuthGuard } from "@nestjs/passport"
import { Observable } from "rxjs"
import { JwtAuthGuard } from "./guards/jwt-auth.guard"

@Controller("auth")
export class AuthController {
  private readonly logger = new Logger(AuthController.name)

  constructor(private authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req) {
    return this.authService.login(req.user);
  }

  @UseGuards(GoogleAuthGuard)
  @Get("google")
  async googleAuth(@Query('platform') platform: string, @Query('redirectUri') redirectUri?: string) {
    this.logger.log(`Initiating Google Auth for platform: ${platform}, redirectUri: ${redirectUri}`)

    // Store platform and redirectUri in session if needed
    // This will be handled by the GoogleAuthGuard
  }

  @Get("google/callback")
  async googleAuthCallback(@Req() req, @Res() res: Response, @Query('state') state: string) {
    this.logger.log("Received Google callback with state:", state)

    try {
      // Parse the state parameter to get platform info
      let platform = "web"
      let redirectUri = process.env.FRONTEND_URL

      if (state) {
        try {
          const stateData = JSON.parse(Buffer.from(state, "base64").toString())
          platform = stateData.platform || "web"
          redirectUri = stateData.redirectUri || process.env.FRONTEND_URL
          this.logger.log(`Parsed state data: platform=${platform}, redirectUri=${redirectUri}`)
        } catch (e) {
          this.logger.error("Failed to parse state parameter:", e)
        }
      }

      // Use AuthGuard directly through a custom method to process the code
      const user = await this.handleGoogleAuth(req)

      if (!user) {
        this.logger.error("Failed to authenticate user")
        if (platform === "mobile") {
          // For mobile, redirect to a deep link that the app can handle
          return res.redirect(`${redirectUri}?error=authentication-failed`)
        } else {
          // For web
          return res.redirect(`${process.env.FRONTEND_URL}/auth-error?message=authentication-failed`)
        }
      }

      // Generate JWT token
      const loginResult = await this.authService.login(user)
      this.logger.log("Generated login result for user:", user.email)

      if (platform === "mobile") {
        // For mobile, redirect to the app's deep link with the token
        return res.redirect(`${redirectUri}?token=${loginResult.access_token}`)
      } else {
        // For web
        return res.redirect(`${process.env.FRONTEND_URL}/auth-success?token=${loginResult.access_token}`)
      }
    } catch (error) {
      this.logger.error("Error in Google callback:", error)
      return res.redirect(`${process.env.FRONTEND_URL}/auth-error?message=server-error`)
    }
  }

  // New endpoint for token exchange (useful for mobile)
  @Post('token-exchange')
  async exchangeToken(@Body() body: { code: string }) {
    try {
      const { code } = body;
      const tokenData = await this.authService.exchangeCodeForToken(code);
      return tokenData;
    } catch (error) {
      this.logger.error("Error exchanging code for token:", error);
      throw error;
    }
  }

  private async handleGoogleAuth(req: any): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        const googleGuard = new (AuthGuard("google"))(undefined)

        // Execute the guard manually
        const canActivateResult = googleGuard.canActivate(new ExecutionContextHost([req]))

        // Handle different return types from canActivate
        if (canActivateResult instanceof Promise) {
          // Handle Promise return
          canActivateResult
            .then((result) => {
              if (result) {
                resolve(req.user)
              } else {
                reject(new Error("Authentication failed"))
              }
            })
            .catch((error) => reject(error))
        } else if (canActivateResult && typeof canActivateResult === "object" && "subscribe" in canActivateResult) {
          // Handle Observable return (with proper type checking)
          ;(canActivateResult as Observable<boolean>).subscribe({
            next: (result) => {
              if (result) {
                resolve(req.user)
              } else {
                reject(new Error("Authentication failed"))
              }
            },
            error: (error) => reject(error),
          })
        } else {
          // Handle boolean return
          if (canActivateResult === true) {
            resolve(req.user)
          } else {
            reject(new Error("Authentication failed"))
          }
        }
      } catch (error) {
        reject(error)
      }
    })
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@Request() req) {
    // The user object is attached to the request by the JwtAuthGuard
    const { password, ...user } = req.user;
    return user;
  }
}

