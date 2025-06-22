
/**
 * VNPay Configuration
 * Set up with environment variables to keep sensitive data secure
 */

export const vnpayConfig = {
  // VNPay Terminal ID (provided by VNPay)
  vnp_TmnCode: process.env.VNPAY_TMN_CODE || 'YOUR_VNPAY_TMN_CODE',
  
  // VNPay Secret Key for Secure Hash (provided by VNPay)
  vnp_HashSecret: process.env.VNPAY_HASH_SECRET || 'YOUR_VNPAY_HASH_SECRET',
  
  // VNPay API URL - use sandbox for testing, production for live
  vnp_Url: process.env.VNPAY_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
  
  // Your return URL that VNPay will redirect to after payment
  vnp_ReturnUrl: process.env.VNPAY_RETURN_URL || 'http://localhost:3300/payment/vnpay-return',
  
  // VNPay API URL for API operations (query, refund)
  vnp_ApiUrl: process.env.VNPAY_API_URL || 'https://sandbox.vnpayment.vn/merchant_webapi/api/transaction'
};

