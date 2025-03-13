import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { AuthService } from './modules/auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import { SellerModule } from './modules/seller/seller.module';

@Module({
  imports: [
    UserModule,
    AuthModule,
    SellerModule
  ],
  controllers: [
    AppController
  ],
  providers: [AppService, AuthService, JwtService],
})
export class AppModule {}
