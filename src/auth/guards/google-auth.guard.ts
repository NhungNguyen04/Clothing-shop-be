import { Injectable, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  private readonly logger = new Logger(GoogleAuthGuard.name);

  constructor() {
    // No custom configuration, let our controller handle everything
    super();
  }

  // Log errors for debugging
  handleRequest(err, user, info) {
    if (err) {
      this.logger.error(`Google auth error: ${err.message}`);
    }
    return user;
  }
}