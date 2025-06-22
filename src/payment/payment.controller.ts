import { Controller, Post, Body, Req, Res, Get, Query, HttpStatus, BadRequestException } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { Response, Request } from 'express';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  /**
   * Create VNPAY payment
   */
  @Post('create-vnpay-payment')
  async createVnpayPayment(
    @Body() body: { orderId: string },
    @Req() req: Request,
    @Res() res: Response
  ) {
    try {
      const { orderId } = body;
      
      if (!orderId) {
        throw new BadRequestException('Order ID is required');
      }
      
      // Get the client's IP address
      const ipAddr = req.headers['x-forwarded-for'] || 
                    req.connection.remoteAddress || 
                    req.socket.remoteAddress ||
                    '127.0.0.1';
      
      // Create payment URL
      const paymentUrl = await this.paymentService.createVnpayPaymentUrl(
        orderId, 
        typeof ipAddr === 'string' ? ipAddr : ipAddr[0]
      );
      
      return res.status(HttpStatus.OK).json({ paymentUrl });
    } catch (error) {
      console.error('Error creating VNPAY payment:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Failed to create payment',
        error: error.message
      });
    }
  }
  
  /**
   * Handle VNPAY return
   */
  @Get('vnpay-return')
  async vnpayReturn(@Query() query: any, @Res() res: Response) {
    try {
      const result = await this.paymentService.processVnpayReturn(query);
      
      if (result.success) {
        // Payment successful - redirect to success page
        // You may want to customize this URL based on your frontend routes
        return res.redirect(`/payment/success?orderId=${result.orderId}`);
      } else {
        // Payment failed - redirect to failure page
        return res.redirect(`/payment/failure?message=${result.message}`);
      }
    } catch (error) {
      console.error('Error processing VNPAY return:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Error processing payment return',
        error: error.message
      });
    }
  }
  
  /**
   * Get VNPAY payment status (optional endpoint for checking payment status)
   */
  @Get('vnpay-status/:orderId')
  async getVnpayStatus(@Req() req: Request, @Res() res: Response) {
    try {
      // Implement payment status check if needed
      // This could query your database to check the current payment status
      
      return res.status(HttpStatus.OK).json({
        message: 'Payment status retrieved successfully',
        // Add additional payment status details here
      });
    } catch (error) {
      console.error('Error getting VNPAY payment status:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Failed to get payment status',
        error: error.message
      });
    }
  }
}
