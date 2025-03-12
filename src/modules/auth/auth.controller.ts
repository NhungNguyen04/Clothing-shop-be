import { Controller, Post, UseGuards, Request, Get, Req, Res, Logger } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { Response } from 'express';
import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context-host';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs'; // Add this import

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req) {
    return this.authService.login(req.user);
  }

  @UseGuards(GoogleAuthGuard)
  @Get('google')
  async googleAuth() {
    console.log("calling googleAuth");
    // The GoogleAuthGuard will initiate the Google OAuth flow
    // This route doesn't need a function body
  }

  @Get('google/callback')
  async googleAuthCallback(@Req() req, @Res() res: Response) {
    console.log("Received Google callback");
    
    try {
      // Use AuthGuard directly through a custom method to process the code
      const user = await this.handleGoogleAuth(req);
      
      if (!user) {
        console.error("Failed to authenticate user");
        return res.redirect(`${process.env.FRONTEND_URL}/auth-error?message=authentication-failed`);
      }
      
      // Generate JWT token
      const loginResult = await this.authService.login(user);
      console.log("Generated login result:", loginResult);
      
      // Redirect to frontend with token in URL params (not ideal for production)
      return res.redirect(`${process.env.FRONTEND_URL}/auth-success?token=${loginResult.access_token}`);
      
      // For production, consider using a temporary code that the frontend can exchange for a token
      // return res.redirect(`${process.env.FRONTEND_URL}/auth-success?code=${temporaryCode}`);
    } catch (error) {
      console.error("Error in Google callback:", error);
      return res.redirect(`${process.env.FRONTEND_URL}/auth-error?message=server-error`);
    }
  }

  private async handleGoogleAuth(req: any): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        const googleGuard = new (AuthGuard('google'))(undefined);
        
        // Execute the guard manually
        const canActivateResult = googleGuard.canActivate(new ExecutionContextHost([req]));
        
        // Handle different return types from canActivate
        if (canActivateResult instanceof Promise) {
          // Handle Promise return
          canActivateResult
            .then((result) => {
              if (result) {
                resolve(req.user);
              } else {
                reject(new Error("Authentication failed"));
              }
            })
            .catch((error) => reject(error));
        } else if (canActivateResult && 
                  typeof canActivateResult === 'object' && 
                  'subscribe' in canActivateResult) {
          // Handle Observable return (with proper type checking)
          (canActivateResult as Observable<boolean>).subscribe({
            next: (result) => {
              if (result) {
                resolve(req.user);
              } else {
                reject(new Error("Authentication failed"));
              }
            },
            error: (error) => reject(error)
          });
        } else {
          // Handle boolean return
          if (canActivateResult === true) {
            resolve(req.user);
          } else {
            reject(new Error("Authentication failed"));
          }
        }
      } catch (error) {
        reject(error);
      }
    });
  }
}