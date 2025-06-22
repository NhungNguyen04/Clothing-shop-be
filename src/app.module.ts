import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { AuthService } from './auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import { SellerModule } from './seller/seller.module';
import { LoggerMiddleware } from './utils/logger.middleware';
import { ProductModule } from './product/product.module';
import { UploadController } from './upload/upload.controller';
import { UploadService } from './upload/upload.service';
import { UploadModule } from './upload/upload.module';
import { ConfigModule } from '@nestjs/config';
import { OrderController } from './order/order.controller';
import { ReviewController } from './review/review.controller';
import { ShipmentController } from './shipment/shipment.controller';
import { OrderModule } from './order/order.module';
import { ReviewModule } from './review/review.module';
import { ShipmentModule } from './shipment/shipment.module';
import { CartModule } from './cart/cart.module';
import { SizeStockModule } from './sizeStock/sizeStock.module';
import { MessageModule } from './message/message.module';
import { NotificationModule } from './notification/notification.module';
import { AddressModule } from './address/address.module';
import { ConversationModule } from './conversation/conversation.module';
import { ReportModule } from './report/report.module';
import { SellerReportModule } from './sellerReport/sellerReport.module';
import { PaymentModule } from './payment/payment.module';


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
    ShipmentModule,
    CartModule,
    SizeStockModule,
    ConversationModule,
    MessageModule,
    NotificationModule,
    AddressModule,
    ReportModule,
    SellerReportModule,
    PaymentModule
  ],
  controllers: [
    AppController,
    UploadController,
    OrderController,
    ReviewController,
    ShipmentController,
  ],
  providers: [AppService, AuthService, JwtService, UploadService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}