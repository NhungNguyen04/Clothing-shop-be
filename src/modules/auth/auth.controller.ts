import { Controller, Post, UseGuards, Request, Get, Req, Res, Logger, Query, Body } from "@nestjs/common"
import { AuthService } from "./auth.service"
import { LocalAuthGuard } from "./guards/local-auth.guard"
import { JwtAuthGuard } from "./guards/jwt-auth.guard"
import { GoogleAuthGuard } from "./guards/google-auth.guard"
import { Response } from "express"

@Controller("auth")
export class AuthController {

  constructor(private authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req) {
    return this.authService.login(req.user);
  }

  @UseGuards(GoogleAuthGuard)
  @Get("google")
  async googleAuth(@Query() query) {
    Logger.log(`Initiating Google Auth with query params: ${JSON.stringify(query)}`)
    // The guard will handle the redirect
  }

  @UseGuards(GoogleAuthGuard)
@Get("google/callback")
async googleAuthCallback(@Req() req, @Res() res: Response) {
  Logger.log("Received Google callback")
  Logger.log(`User platform: ${req.user?.platform}, redirectUri: ${req.user?.redirectUri}`)

  try {
    // Get the user from the request (set by Passport)
    const user = req.user

    if (!user) {
      Logger.error("No user found in request")
      return res.redirect(`${process.env.FRONTEND_URL}/auth-error?message=authentication-failed`)
    }

    // Extract platform and redirectUri from the user object (set in Google strategy)
    const platform = user.platform || "web"
    const redirectUri = user.redirectUri || process.env.FRONTEND_URL

    Logger.log(`User authenticated: ${user.email}, platform: ${platform}, redirectUri: ${redirectUri}`)

    // Generate JWT token
    const loginResult = await this.authService.login(user)

    if (platform === "mobile") {
      // IMPORTANT CHANGE: For mobile, we need to use a specially formatted URL
      // The token should be properly included in the query parameters
      let mobileRedirectUrl = redirectUri
      
      // Ensure we're adding parameters correctly - if redirectUri already has parameters
      if (redirectUri.includes('?')) {
        mobileRedirectUrl = `${redirectUri}&token=${loginResult.access_token}`
      } else {
        mobileRedirectUrl = `${redirectUri}?token=${loginResult.access_token}`
      }
      
      Logger.log(`Redirecting to mobile app: ${mobileRedirectUrl}`)
      return res.redirect(mobileRedirectUrl)
    } else {
      // For web
      Logger.log(`Redirecting to web: ${process.env.FRONTEND_URL}/auth-success`)
      return res.redirect(`${process.env.FRONTEND_URL}/auth-success?token=${loginResult.access_token}`)
    }
  } catch (error) {
    Logger.error(`Error in Google callback: ${error.message}`)
    return res.redirect(`${process.env.FRONTEND_URL}/auth-error?message=server-error`)
  }
}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@Request() req) {
    // The user object is attached to the request by the JwtAuthGuard
    const { password, ...user } = req.user;
    return user;
  }

  // New endpoint for token exchange (useful for mobile)
  @Post('token-exchange')
  async exchangeToken(@Body() body: { code: string }) {
    try {
      const { code } = body;
      const tokenData = await this.authService.exchangeCodeForToken(code);
      return tokenData;
    } catch (error) {
      Logger.error(`Error exchanging code for token: ${error.message}`);
      throw error;
    }
  }
}

