import { Injectable } from '@nestjs/common';
import { VNPay, ProductCode, VnpLocale, dateFormat, VnpCurrCode } from 'vnpay';
import { vnpayConfig } from './vnpay.config';
import { PaymentGateway, PaymentUrlRequest } from './payment-gateway.interface';

@Injectable()
export class VnpayPaymentGateway implements PaymentGateway {
  private readonly vnpay: VNPay;

  constructor() {
    this.vnpay = new VNPay({
      tmnCode: vnpayConfig.vnp_TmnCode,
      secureSecret: vnpayConfig.vnp_HashSecret as string,
    });
  }

  buildPaymentUrl(request: PaymentUrlRequest): string {
    return this.vnpay.buildPaymentUrl({
      vnp_TxnRef: request.orderId,
      vnp_IpAddr: request.ipAddr,
      vnp_Amount: request.amount,
      vnp_OrderInfo: request.orderInfo,
      vnp_OrderType: ProductCode.Other,
      vnp_Locale: VnpLocale.VN,
      vnp_ReturnUrl: vnpayConfig.vnp_ReturnUrl,
      vnp_CreateDate: dateFormat(new Date(), 'yyyyMMddHHmmss'),
      vnp_CurrCode: VnpCurrCode.VND,
    });
  }

  verifyCallback(params: Record<string, unknown>): boolean {
    return this.vnpay.verifyReturnUrl(params as any).isVerified;
  }
}

