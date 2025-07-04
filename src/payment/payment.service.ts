import { Injectable } from '@nestjs/common';
import { vnpayConfig } from './vnpay.config';
import { createHmac } from 'crypto';
import * as qs from 'querystring';
import { PaymentMethod, PaymentStatus } from '@prisma/client';
import { prisma } from '@/prisma/prisma';
import {VNPay, ignoreLogger, ProductCode, VnpLocale, dateFormat, VnpCurrCode} from 'vnpay';

@Injectable()
export class PaymentService {
  private vnpay: VNPay;

  constructor() {
    this.vnpay = new VNPay({
      tmnCode: vnpayConfig.vnp_TmnCode,
      secureSecret: vnpayConfig.vnp_HashSecret as string,
    });
  }

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
      
      // Set timezone
      process.env.TZ = 'Asia/Ho_Chi_Minh';
      
      const amount = Math.floor(order.totalPrice * 100); // Convert to smallest currency unit (cents)
      const orderInfo = `Payment for order ${orderId}`;
      
      // Update order payment method
      await prisma.order.update({
        where: { id: orderId },
        data: { paymentMethod: PaymentMethod.VNPAY }
      });
      
      // Create payment URL using VNPay library
      const paymentUrl = this.vnpay.buildPaymentUrl({
        vnp_TxnRef: orderId,
        vnp_IpAddr: ipAddr,
        vnp_Amount: amount,
        vnp_OrderInfo: orderInfo,
        vnp_OrderType: ProductCode.Other,
        vnp_Locale: VnpLocale.VN,
        vnp_ReturnUrl: vnpayConfig.vnp_ReturnUrl,
        vnp_CreateDate: dateFormat(new Date(), 'yyyyMMddHHmmss'),
        vnp_CurrCode: VnpCurrCode.VND,
      });
      
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
      // Verify the return data from VNPay
      const isValidSignature = this.vnpay.verifyReturnUrl(params);
      
      if (!isValidSignature) {
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
            paymentStatus: PaymentStatus.SUCCESS
          }
        });
        
        // Store transactionId and payDate in a transaction log or metadata table if needed
        console.log(`Payment successful: Order ${orderId}, Transaction ID: ${transactionId}, Date: ${payDate}`);
        
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
        // Payment failed, but we keep it in pending status
        // as VNPAY might retry or the user might try again
        console.log(`Payment failed with code: ${responseCode}`);
        
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
   * Process VNPAY IPN (Instant Payment Notification)
   * This is called by VNPAY servers to confirm payment status
   */
  async processVnpayIpn(params: any): Promise<any> {
    try {
      // Verify the IPN data using VNPay library
      const isValidSignature = this.vnpay.verifyReturnUrl(params);
      
      if (!isValidSignature) {
        return { rspCode: '97', message: 'Checksum failed' };
      }
      
      // Get transaction details
      const orderId = params['vnp_TxnRef'];
      const responseCode = params['vnp_ResponseCode'];
      const transactionId = params['vnp_TransactionNo'];
      
      // Find the order
      const order = await prisma.order.findUnique({
        where: { id: orderId }
      });
      
      if (!order) {
        return { rspCode: '01', message: 'Order not found' };
      }
      
      // Check amount matches
      const vnpAmount = Number(params['vnp_Amount']) / 100; // Convert from smallest currency unit
      if (vnpAmount !== order.totalPrice) {
        return { rspCode: '04', message: 'Amount invalid' };
      }
      
      // Check if order payment has already been updated
      if (order.paymentStatus !== PaymentStatus.PENDING) {
        return { rspCode: '02', message: 'This order has been updated to the payment status' };
      }
      
      // Process based on response code
      if (responseCode === '00') {
        // Payment successful
        await prisma.order.update({
          where: { id: orderId },
          data: { 
            paymentStatus: PaymentStatus.SUCCESS
          }
        });
        
        // Log transaction details
        console.log(`IPN Success: Order ${orderId}, Transaction ID: ${transactionId}, Date: ${params['vnp_PayDate']}`);
        
        // Create a notification for the user
        await prisma.notification.create({
          data: {
            userId: order.userId,
            message: `Your payment for order ${orderId} was successful.`,
            isRead: false
          }
        });
        
        return { rspCode: '00', message: 'Success' };
      } else {
        // Payment failed - we keep it as PENDING since VNPay might retry
        console.log(`Payment failed with code: ${responseCode}`);
        
        return { rspCode: '00', message: 'Success' }; // still return success to acknowledge receipt
      }
    } catch (error) {
      console.error('Error processing VNPAY IPN:', error);
      return { rspCode: '99', message: 'Unknown error' };
    }
  }
    // Helper methods are now provided by the VNPay library
}
