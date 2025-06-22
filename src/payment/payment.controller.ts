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
      
      // Get the client's IP address - sanitize to handle proxy forwarding
      let ipAddr = req.headers['x-forwarded-for'] || 
                  req.connection.remoteAddress || 
                  req.socket.remoteAddress ||
                  '127.0.0.1';
      
      // Clean up IP address - IMPORTANT for proper signature generation
      if (typeof ipAddr !== 'string') {
        ipAddr = Array.isArray(ipAddr) ? ipAddr[0] : String(ipAddr);
      }
      
      // If IP contains commas (multiple proxies), take just the original client IP
      if (ipAddr.includes(',')) {
        ipAddr = ipAddr.split(',')[0].trim();
      }
      
      console.log('Creating VNPAY payment for order:', orderId, 'IP:', ipAddr);
      
      // Create payment URL
      const paymentUrl = await this.paymentService.createVnpayPaymentUrl(
        orderId, 
        ipAddr
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
   * Handle VNPAY return - IMPORTANT: This route must match what you registered with VNPAY
   * If you registered with VNPAY using "/payment/vnpay/callback" then this should be:
   * @Get('vnpay/callback')
   * 
   * Make sure the route here matches exactly what's in your VNPAY_RETURN_URL environment variable
   */
  @Get('vnpay-return')
  async vnpayReturn(@Query() query: any, @Res() res: Response) {
    try {
      console.log('Received VNPAY return with params:', query);
      
      const result = await this.paymentService.processVnpayReturn(query);
      
      if (result.success) {
        // Payment successful - redirect to success page with order ID
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment-success?orderId=${result.orderId}`);
      } else {
        // Payment failed - redirect to failure page with error message
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment-failure?message=${encodeURIComponent(result.message)}`);
      }
    } catch (error) {
      console.error('Error processing VNPAY return:', error);
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment-failure?message=${encodeURIComponent('Error processing payment')}`);
    }
  }
  
  /**
   * Get VNPAY payment status
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
