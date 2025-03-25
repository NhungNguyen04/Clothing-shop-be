import { ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  private readonly logger = new Logger(GoogleAuthGuard.name);

  constructor() { 
    super({
      // Add a custom state parameter handler
      state: (req) => {
        // If there's a redirect_uri in the query, store it in the state
        if (req.query.redirect_uri) {
          return JSON.stringify({
            redirectUri: req.query.redirect_uri,
          });
        }
        return undefined;
      }
    }); 
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const request = context.switchToHttp().getRequest();
      
      // Store the redirect_uri in the session if this is the initial request
      if (!request.url.includes('/callback') && request.query.redirect_uri) {
        this.logger.log(`Storing redirect URI: ${request.query.redirect_uri}`);
        if (!request.session) {
          request.session = {};
        }
        request.session.redirectUri = request.query.redirect_uri;
      }
      
      const activate = (await super.canActivate(context)) as boolean;
      
      // For the callback, ensure we have the user before trying to log in
      if (request.url.includes('/callback')) {
        if (request.user) {
          await super.logIn(request);
          this.logger.log('User logged in successfully');
        } else {
          this.logger.error('No user found in request after authentication');
        }
      }
      
      return activate;
    } catch (error) {
      this.logger.error(`Authentication error: ${error.message}`);
      throw error;
    }
  }
}