import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-google-oauth20';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly logger = new Logger(GoogleStrategy.name);

  constructor(private authService: AuthService) {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      scope: ['email', 'profile'],
      passReqToCallback: false  // Add this line to match the expected type
    } as any);
  }

  async validate(accessToken: string, refreshToken: string, profile: any) {
    this.logger.log(`Google auth strategy validating user ${profile.emails[0].value}`);
    
    const { name, emails, photos } = profile;
    const user = {
      email: emails[0].value,
      name: `${name.givenName} ${name.familyName}`,
      picture: photos[0].value,
      accessToken
    };
    
    const userFromDb : any = await this.authService.validateOAuthUser(user);
    this.logger.log(`User from DB: ${JSON.stringify(userFromDb)}`);
    
    if (!userFromDb) {
      return null;
    }
    userFromDb.picture = photos[0].value;
    return userFromDb;
  }
}