import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { AuthService } from '../auth.service';
import { Request } from 'express';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly logger = new Logger(GoogleStrategy.name);

  constructor(private authService: AuthService) {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      scope: ['email', 'profile'],
      passReqToCallback: true,
      state: true
    } as any);
  }

  async validate(
    req: Request,
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    this.logger.log(`Google strategy validate called`);
    this.logger.log(`Request query: ${JSON.stringify(req.query)}`);
    this.logger.log(`Request state: ${req.query.state}`);

    const { name, emails, photos } = profile;
    
    // Start with default values
    let platform = 'web';
    let redirectUri = process.env.FRONTEND_URL;
    
    // Try to get platform/redirectUri from state parameter
    if (req.query.state) {
      try {
        // State can either be a string or already parsed object
        let state;
        if (typeof req.query.state === 'string') {
          state = JSON.parse(decodeURIComponent(req.query.state));
        } else {
          state = req.query.state;
        }
        
        this.logger.log(`Parsed state: ${JSON.stringify(state)}`);
        
        if (state && state.platform) {
          platform = state.platform;
          this.logger.log(`Found platform in state: ${platform}`);
        }
        
        if (state && state.redirectUri) {
          redirectUri = state.redirectUri;
          this.logger.log(`Found redirectUri in state: ${redirectUri}`);
        }
      } catch (e) {
        this.logger.error(`Error parsing state parameter: ${e.message}`);
      }
    }
    
    // Check if URL parameters contain platform/redirectUri 
    // (fallback - should use state instead)
    if (req.query.platform) {
      platform = req.query.platform as string;
      this.logger.log(`Found platform in query: ${platform}`);
    }
    
    if (req.query.redirect_uri) {
      redirectUri = req.query.redirect_uri as string;
      this.logger.log(`Found redirectUri in query: ${redirectUri}`);
    }
    
    // Log final values
    this.logger.log(`Final platform: ${platform}`);
    this.logger.log(`Final redirectUri: ${redirectUri}`);

    const user = {
      email: emails[0].value,
      name: `${name.givenName} ${name.familyName}`,
      picture: photos[0].value,
      accessToken,
      platform,
      redirectUri
    };

    // Get or create user in database
    const userFromDb = await this.authService.validateOAuthUser(user);
    this.logger.log(`User from DB: ${JSON.stringify(userFromDb)}`);

    if (!userFromDb) {
      return done(null, false);
    }
    
    // IMPORTANT: Always override the platform and redirectUri with our values
    const userWithRedirectInfo = {
      ...userFromDb,
      platform,
      redirectUri
    };
    
    this.logger.log(`Final user with redirect info: ${JSON.stringify(userWithRedirectInfo)}`);
    return done(null, userWithRedirectInfo);
  }
}