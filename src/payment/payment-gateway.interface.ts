export interface PaymentUrlRequest {
  orderId: string;
  ipAddr: string;
  amount: number;
  orderInfo: string;
}

export interface PaymentGateway {
  buildPaymentUrl(request: PaymentUrlRequest): string;
  verifyCallback(params: Record<string, unknown>): boolean;
}
