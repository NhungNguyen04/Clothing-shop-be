import { v4 as uuidv4 } from 'uuid';
import { Controller, Post, UseGuards, Request, Get, Req, Res, Logger, Query, Body } from "@nestjs/common"
import { AuthService } from "./auth.service"
import { LocalAuthGuard } from "./guards/local-auth.guard"
import { JwtAuthGuard } from "./guards/jwt-auth.guard"
import { GoogleAuthGuard } from "./guards/google-auth.guard"
import { Response, Request as ExpressRequest } from "express"

// Add this at module level to store data between requests
const AUTH_FLOWS = new Map<string, { platform: string, redirectUri: string, timestamp: number }>();

// Cleanup old entries every hour
setInterval(() => {
  const now = Date.now();
  for (const [id, data] of AUTH_FLOWS.entries()) {
    if (now - data.timestamp > 3600000) { // 1 hour
      AUTH_FLOWS.delete(id);
    }
  }
}, 3600000);

@Controller("auth")
export class AuthController {

  constructor(private authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req) {
    return this.authService.login(req.user);
  }

  // Completely replace the GoogleAuthGuard approach for the initial request
  @Get("google")
  async googleAuth(@Query() query, @Res() res: Response) {
    try {
      // Generate a unique state parameter
      const stateId = uuidv4();
      
      // Store the platform and redirectUri in our memory map
      const platform = query.platform || 'web';
      const redirectUri = query.redirect_uri || process.env.FRONTEND_URL;
      
      AUTH_FLOWS.set(stateId, {
        platform,
        redirectUri,
        timestamp: Date.now()
      });
      
      Logger.log(`Created auth flow ${stateId} with platform=${platform}, redirectUri=${redirectUri}`);
      
      // Build the Google OAuth URL manually with our state
      const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${process.env.GOOGLE_CLIENT_ID}` +
        `&redirect_uri=${encodeURIComponent(process.env.GOOGLE_CALLBACK_URL || '')}` +
        `&response_type=code` +
        `&scope=${encodeURIComponent('profile email')}` +
        `&state=${stateId}`;
        
      Logger.log(`Redirecting to Google: ${googleAuthUrl}`);
      
      // Redirect the user to Google
      return res.redirect(googleAuthUrl);
    } catch (error) {
      Logger.error(`Error initiating Google auth: ${error.message}`);
      return res.redirect(`${process.env.FRONTEND_URL}/auth-error?message=auth-initialization-failed`);
    }
  }

  // Keep the guard only for authentication, but handle redirects manually
  @UseGuards(GoogleAuthGuard)
  @Get("google/callback")
  async googleAuthCallback(@Req() req, @Query() query, @Res() res: Response) {
    Logger.log("==== GOOGLE CALLBACK ====");
    Logger.log(`Query state: ${query.state}`);
    Logger.log(`Raw user object: ${JSON.stringify(req.user)}`);
    
    try {
      // Get the user from the request (set by Passport)
      const user = req.user;
      
      if (!user) {
        Logger.error("No user found in request");
        return res.redirect(`${process.env.FRONTEND_URL}/auth-error?message=authentication-failed`);
      }
      
      // Retrieve our stored flow data using the state parameter
      let platform = 'web';
      let redirectUri = process.env.FRONTEND_URL;
      
      const stateId = query.state;

      // Fixed version with null-check
      const flowData = AUTH_FLOWS.get(stateId);
      if (flowData) {  // Add this check
        platform = flowData.platform;
        redirectUri = flowData.redirectUri;
        
        // Clean up after use
        AUTH_FLOWS.delete(stateId);
        
        Logger.log(`Retrieved flow data: platform=${platform}, redirectUri=${redirectUri}`);
      } else {
        Logger.warn(`No flow data found for state=${stateId}, using defaults`);
      }
      // Generate JWT token
      const loginResult = await this.authService.login(user);
      
      // Determine where to redirect based on our RELIABLE platform value
      if (platform === 'mobile') {
        let mobileRedirectUrl = redirectUri;
        
        if (redirectUri && redirectUri.includes('?')) {
          mobileRedirectUrl = `${redirectUri}&token=${loginResult.access_token}`;
        } else {
          mobileRedirectUrl = `${redirectUri}?token=${loginResult.access_token}`;
        }
        
        // Add user data to URL if needed
        if (user) {
          const userData = encodeURIComponent(JSON.stringify({
            id: user.id,
            email: user.email,
            name: user.name,
          }));
          mobileRedirectUrl += `&user=${userData}`;
        }
        
        Logger.log(`Redirecting to MOBILE app: ${mobileRedirectUrl}`);
        return res.redirect(mobileRedirectUrl);
      } else {
        const webRedirect = `${process.env.FRONTEND_URL}/auth-success?token=${loginResult.access_token}`;
        Logger.log(`Redirecting to WEB app: ${webRedirect}`);
        return res.redirect(webRedirect);
      }
    } catch (error) {
      Logger.error(`Error in Google callback: ${error.message}`);
      Logger.error(error.stack);
      return res.redirect(`${process.env.FRONTEND_URL}/auth-error?message=server-error`);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@Request() req) {
    const { password, ...user } = req.user;
    return user;
  }

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