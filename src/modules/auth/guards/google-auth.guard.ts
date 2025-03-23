import { ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  private readonly logger = new Logger(GoogleAuthGuard.name);

  constructor() { 
    super(); 
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const activate = (await super.canActivate(context)) as boolean;
      const request = context.switchToHttp().getRequest();
      
      // For the initial auth request (not the callback), we don't need to login
      if (!request.url.includes('/callback')) {
        return activate;
      }
      
      // For the callback, ensure we have the user before trying to log in
      if (request.user) {
        await super.logIn(request);
        this.logger.log('User logged in successfully');
      } else {
        this.logger.error('No user found in request after authentication');
      }
      
      return activate;
    } catch (error) {
      this.logger.error(`Authentication error: ${error.message}`);
      throw error;
    }
  }
}