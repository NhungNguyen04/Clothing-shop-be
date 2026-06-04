import { Injectable } from '@nestjs/common';
import { PaymentMethod, PaymentStatus } from '@prisma/client';
import { prisma } from '@/prisma/prisma';
import { PaymentGatewayFactory } from './payment-gateway.factory';
import { DomainEventName } from '../events/domain-event.interface';
import { DomainEventPublisher } from '../events/domain-event-publisher.service';

@Injectable()
export class PaymentService {
  constructor(
    private readonly paymentGatewayFactory: PaymentGatewayFactory,
    private readonly events: DomainEventPublisher,
  ) {}

  /**
   * Create a payment URL for VNPAY
   */
  async createVnpayPaymentUrl(orderId: string, ipAddr: string): Promise<string> {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId }
      });
      
      if (!order) {
        throw new Error('Order not found');
      }
      
      process.env.TZ = 'Asia/Ho_Chi_Minh';
      
      const amount = Math.floor(order.totalPrice * 100);
      const orderInfo = `Payment for order ${orderId}`;
      
      await prisma.order.update({
        where: { id: orderId },
        data: { paymentMethod: PaymentMethod.VNPAY }
      });
      
      const gateway = this.paymentGatewayFactory.create(PaymentMethod.VNPAY);
      return gateway.buildPaymentUrl({
        orderId,
        ipAddr,
        amount,
        orderInfo,
      });
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
      const gateway = this.paymentGatewayFactory.create(PaymentMethod.VNPAY);
      const isValidSignature = gateway.verifyCallback(params);
      
      if (!isValidSignature) {
        return { success: false, message: 'Invalid signature' };
      }
      
      const orderId = params['vnp_TxnRef'];
      const responseCode = params['vnp_ResponseCode'];
      const transactionId = params['vnp_TransactionNo'];
      const payDate = params['vnp_PayDate'];
      
      const order = await prisma.order.findUnique({
        where: { id: orderId }
      });
      
      if (!order) {
        return { success: false, message: 'Order not found' };
      }
      
      if (responseCode === '00') {
        await prisma.order.update({
          where: { id: orderId },
          data: { 
            paymentStatus: PaymentStatus.SUCCESS
          }
        });
        
        console.log(`Payment successful: Order ${orderId}, Transaction ID: ${transactionId}, Date: ${payDate}`);
        
        await this.events.publish({
          name: DomainEventName.PaymentSucceeded,
          payload: { orderId, userId: order.userId },
        });
        
        return { 
          success: true, 
          orderId,
          message: 'Payment successful',
          transactionId,
          payDate
        };
      } else {
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
      const gateway = this.paymentGatewayFactory.create(PaymentMethod.VNPAY);
      const isValidSignature = gateway.verifyCallback(params);
      
      if (!isValidSignature) {
        return { rspCode: '97', message: 'Checksum failed' };
      }
      
      const orderId = params['vnp_TxnRef'];
      const responseCode = params['vnp_ResponseCode'];
      const transactionId = params['vnp_TransactionNo'];
      
      const order = await prisma.order.findUnique({
        where: { id: orderId }
      });
      
      if (!order) {
        return { rspCode: '01', message: 'Order not found' };
      }
      
      const vnpAmount = Number(params['vnp_Amount']) / 100;
      if (vnpAmount !== order.totalPrice) {
        return { rspCode: '04', message: 'Amount invalid' };
      }
      
      if (order.paymentStatus !== PaymentStatus.PENDING) {
        return { rspCode: '02', message: 'This order has been updated to the payment status' };
      }
      
      if (responseCode === '00') {
        await prisma.order.update({
          where: { id: orderId },
          data: { 
            paymentStatus: PaymentStatus.SUCCESS
          }
        });
        
        console.log(`IPN Success: Order ${orderId}, Transaction ID: ${transactionId}, Date: ${params['vnp_PayDate']}`);
        
        await this.events.publish({
          name: DomainEventName.PaymentSucceeded,
          payload: { orderId, userId: order.userId },
        });
        
        return { rspCode: '00', message: 'Success' };
      } else {
        console.log(`Payment failed with code: ${responseCode}`);
        
        return { rspCode: '00', message: 'Success' };
      }
    } catch (error) {
      console.error('Error processing VNPAY IPN:', error);
      return { rspCode: '99', message: 'Unknown error' };
    }
  }
}

