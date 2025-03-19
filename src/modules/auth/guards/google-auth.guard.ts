import { Injectable, type ExecutionContext, Logger } from "@nestjs/common"
import { AuthGuard } from "@nestjs/passport"

@Injectable()
export class GoogleAuthGuard extends AuthGuard("google") {
  private readonly logger = new Logger(GoogleAuthGuard.name)

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()

    // Get platform and redirectUri from query params
    const platform = request.query.platform || "web"
    const redirectUri = request.query.redirectUri

    this.logger.log(`GoogleAuthGuard: platform=${platform}, redirectUri=${redirectUri}`)

    // Store platform info in the state parameter
    const stateData = {
      platform,
      redirectUri,
      timestamp: Date.now(),
    }

    // Encode state as base64
    const state = Buffer.from(JSON.stringify(stateData)).toString("base64")

    // Set the state parameter in the auth options
    const authOptions = {
      state,
    }

    // Store auth options in the request for Passport to use
    request.authInfo = authOptions

    return super.canActivate(context) as Promise<boolean>
  }
}

