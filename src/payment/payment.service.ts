import { Injectable } from '@nestjs/common';
import { vnpayConfig } from './vnpay.config';
import { createHmac } from 'crypto';
import * as qs from 'querystring';
import { PaymentMethod, PaymentStatus } from '@prisma/client';
import { prisma } from '@/prisma/prisma';

@Injectable()
export class PaymentService {
  constructor() {}

  /**
   * Create a payment URL for VNPAY
   */
  async createVnpayPaymentUrl(orderId: string, ipAddr: string): Promise<string> {
    try {
      // Find order in database
      const order = await prisma.order.findUnique({
        where: { id: orderId }
      });
      
      if (!order) {
        throw new Error('Order not found');
      }
      
      // Create date format for VNPAY
      const date = new Date();
      const createDate = this.dateFormat(date, 'yyyyMMddHHmmss');
      const orderInfo = `Payment for order ${orderId}`;
      const amount = Math.floor(order.totalPrice * 100); // Convert to smallest currency unit (cents)
      const currCode = 'VND';
      const locale = 'vn';
      
      // Update order payment method
      await prisma.order.update({
        where: { id: orderId },
        data: { paymentMethod: PaymentMethod.VNPAY }
      });
      
      // Create VNPAY parameters
      let vnp_Params: any = {
        vnp_Version: '2.1.0',
        vnp_Command: 'pay',
        vnp_TmnCode: vnpayConfig.vnp_TmnCode,
        vnp_Locale: locale,
        vnp_CurrCode: currCode,
        vnp_TxnRef: orderId,
        vnp_OrderInfo: orderInfo,
        vnp_OrderType: 'other',
        vnp_Amount: amount,
        vnp_ReturnUrl: vnpayConfig.vnp_ReturnUrl,
        vnp_IpAddr: ipAddr,
        vnp_CreateDate: createDate,
      };
        // Sort parameters before signing
      const sortedParams = this.sortObject(vnp_Params);
      const signData = qs.stringify(sortedParams);
      const hmac = createHmac('sha512', vnpayConfig.vnp_HashSecret);
      const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
      
      vnp_Params['vnp_SecureHash'] = signed;
      
      // Create the payment URL
      const paymentUrl = vnpayConfig.vnp_Url + '?' + qs.stringify(vnp_Params);
      
      return paymentUrl;
    } catch (error) {
      console.error('Error creating VNPAY payment URL:', error);
      throw error;
    }
  }
  
  /**
   * Process VNPAY payment return
   */
  async processVnpayReturn(params: any): Promise<any> {
    try {
      const secureHash = params['vnp_SecureHash'];
      
      // Remove secure hash from params before verifying
      const vnpParams = { ...params };
      delete vnpParams['vnp_SecureHash'];
      delete vnpParams['vnp_SecureHashType'];
        // Verify signature
      const sortedParams = this.sortObject(vnpParams);
      const signData = qs.stringify(sortedParams);
      const hmac = createHmac('sha512', vnpayConfig.vnp_HashSecret);
      const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
      
      if (secureHash !== signed) {
        return { success: false, message: 'Invalid signature' };
      }
      
      // Get transaction details
      const orderId = params['vnp_TxnRef'];
      const responseCode = params['vnp_ResponseCode'];
      const transactionId = params['vnp_TransactionNo'];
      const payDate = params['vnp_PayDate'];
      
      // Find the order
      const order = await prisma.order.findUnique({
        where: { id: orderId }
      });
      
      if (!order) {
        return { success: false, message: 'Order not found' };
      }
      
      // Check payment status
      if (responseCode === '00') {
        // Payment successful
        await prisma.order.update({
          where: { id: orderId },
          data: { 
            paymentStatus: PaymentStatus.SUCCESS,
            // Store additional transaction details if needed
          }
        });
        
        // Create a notification for the user
        await prisma.notification.create({
          data: {
            userId: order.userId,
            message: `Your payment for order ${orderId} was successful.`,
            isRead: false
          }
        });
        
        return { 
          success: true, 
          orderId,
          message: 'Payment successful',
          transactionId,
          payDate
        };
      } else {
        // Payment failed
        return { 
          success: false, 
          message: 'Payment failed', 
          responseCode,
          orderId
        };
      }
    } catch (error) {
      console.error('Error processing VNPAY return:', error);
      throw error;
    }
  }
  
  /**
   * Helper function to sort an object by keys
   */
  private sortObject(obj: any): any {
    const sorted: any = {};
    const keys = Object.keys(obj).sort();
    
    for (const key of keys) {
      if (obj.hasOwnProperty(key)) {
        sorted[key] = obj[key];
      }
    }
    
    return sorted;
  }
  
  /**
   * Helper function to format date
   */
  private dateFormat(date: Date, format: string): string {
    const pad = (n: number): string => (n < 10 ? '0' + n : n.toString());
    
    const yyyy = date.getFullYear().toString();
    const MM = pad(date.getMonth() + 1);
    const dd = pad(date.getDate());
    const HH = pad(date.getHours());
    const mm = pad(date.getMinutes());
    const ss = pad(date.getSeconds());
    
    return format
      .replace('yyyy', yyyy)
      .replace('MM', MM)
      .replace('dd', dd)
      .replace('HH', HH)
      .replace('mm', mm)
      .replace('ss', ss);
  }
}
