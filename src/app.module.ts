import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { AuthService } from './modules/auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import { SellerModule } from './modules/seller/seller.module';
import { LoggerMiddleware } from './utils/logger.middleware';
import { ProductModule } from './modules/product/product.module';
import { UploadController } from './modules/upload/upload.controller';
import { UploadService } from './modules/upload/upload.service';
import { UploadModule } from './modules/upload/upload.module';
import { ConfigModule } from '@nestjs/config';
import { OrderController } from './order/order.controller';
import { ReviewController } from './review/review.controller';
import { ShipmentController } from './shipment/shipment.controller';
import { OrderModule } from './order/order.module';
import { ReviewModule } from './review/review.module';
import { ShipmentModule } from './shipment/shipment.module';

@Module({
  imports: [
    UserModule,
    AuthModule,
    SellerModule,
    ProductModule,
    UploadModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    OrderModule,
    ReviewModule,
    ShipmentModule
  ],
  controllers: [
    AppController,
    UploadController,
    OrderController,
    ReviewController,
    ShipmentController
  ],
  providers: [AppService, AuthService, JwtService, UploadService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}