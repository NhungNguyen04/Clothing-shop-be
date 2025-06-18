import { Module } from '@nestjs/common';
import { SellerReportController } from './sellerReport.controller';
import { SellerReportService } from './sellerReport.service';
import { SellerModule } from '../seller/seller.module';

@Module({
  imports: [SellerModule],
  controllers: [SellerReportController],
  providers: [SellerReportService],
  exports: [SellerReportService],
})
export class SellerReportModule {}
