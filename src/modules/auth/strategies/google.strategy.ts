import { Injectable, Logger } from "@nestjs/common"
import { PassportStrategy } from "@nestjs/passport"
import { Strategy, type VerifyCallback, type StrategyOptions as BaseStrategyOptions } from "passport-google-oauth20"

interface StrategyOptions extends Omit<BaseStrategyOptions, 'passReqToCallback'> {
  passReqToCallback: true;
}
import { AuthService } from "../auth.service"

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, "google") {

  constructor(
    private authService: AuthService,
  ) {
    const clientID = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET
    const callbackURL = process.env.GOOGLE_CALLBACK_URL

    super({
      clientID,
      clientSecret,
      callbackURL,
      scope: ["email", "profile"],
      // Important: Set this to true to receive the request in validate
      passReqToCallback: true,
    } as unknown as StrategyOptions)

    Logger.log(`Initializing Google Strategy with callback URL: ${callbackURL}`)
  }

  async validate(
    request: any,
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    Logger.log(`Google strategy validating profile: ${profile.displayName}`)

    try {
      // Extract state parameter if available
      let platform = "web"
      let redirectUri = null

      if (request.query && request.query.state) {
        try {
          const stateData = JSON.parse(Buffer.from(request.query.state, "base64").toString())
          platform = stateData.platform || "web"
          redirectUri = stateData.redirectUri
          Logger.log(`State data: platform=${platform}, redirectUri=${redirectUri}`)
        } catch (e) {
          Logger.error(`Failed to parse state: ${e.message}`)
        }
      }

      const { name, emails, photos } = profile
      const user = {
        email: emails[0].value,
        name: `${name.givenName} ${name.familyName}`,
        picture: photos[0].value,
        accessToken,
        // Store platform and redirectUri in user object for later use
        platform,
        redirectUri,
      }

      const userFromDb = await this.authService.validateOAuthUser(user)
      Logger.log(`User from DB: ${JSON.stringify(userFromDb)}`)

      if (!userFromDb) {
        return done(null, false)
      }

      // Add platform and redirectUri to the user object
      const userWithPlatform = {
        ...userFromDb,
        platform,
        redirectUri,
      }

      done(null, userWithPlatform)
    } catch (error) {
      Logger.error(`Error in Google strategy validate: ${error.message}`)
      done(error, false)
    }
  }
}

