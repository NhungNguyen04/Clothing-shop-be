import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback, StrategyOptions } from 'passport-google-oauth20';
import { AuthService } from '../auth.service';
import { Request } from 'express';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private authService: AuthService) {
    console.log('- callback url', process.env.GOOGLE_CALLBACK_URL);
    super({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      scope: ['email', 'profile'],
      passReqToCallback: true,
      session: false,
    } as any);
  }

  async validate(
    req: Request,
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    console.log('google strategy validate', profile);

    const { name, emails, photos } = profile;
    
    // Determine if this is a mobile request and get the redirect URI
    let platform = 'web';
    let redirectUri = process.env.FRONTEND_URL;
    
    // Check state parameter which may contain our stored redirect URI
    if (req.query.state) {
      try {
        const state = JSON.parse(decodeURIComponent(req.query.state as string));
        if (state.redirectUri) {
          redirectUri = state.redirectUri;
          // If it starts with "exp:" it's a mobile app
          if (redirectUri && redirectUri.startsWith('exp:')) {
            platform = 'mobile';
          }
        }
      } catch (e) {
        console.error('Error parsing state parameter:', e);
      }
    }

    const user = {
      email: emails[0].value,
      name: `${name.givenName} ${name.familyName}`,
      picture: photos[0].value,
      accessToken,
      // Add the platform and redirectUri to the user object
      platform,
      redirectUri
    };

    const userFromDb = await this.authService.validateOAuthUser(user);
    console.log('userFromDb', userFromDb);

    if (!userFromDb) {
      return done(null, false);
    }
    
    // Pass the platform and redirectUri to the controller
    const userWithRedirectInfo = {
      ...userFromDb,
      platform,
      redirectUri
    };
    
    done(null, userWithRedirectInfo);
  }
}