export const vnpayConfig = {
  vnp_TmnCode: process.env.VNPAY_TMN_CODE || 'YOUR_MERCHANT_CODE',
  vnp_HashSecret: process.env.VNPAY_HASH_SECRET || 'YOUR_SECRET_KEY',
  vnp_Url: process.env.VNPAY_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
  vnp_ReturnUrl: process.env.VNPAY_RETURN_URL || 'http://localhost:3000/api/payment/vnpay-return',
  vnp_ApiUrl: process.env.VNPAY_API_URL || 'https://sandbox.vnpayment.vn/merchant_webapi/api/transaction',
};
