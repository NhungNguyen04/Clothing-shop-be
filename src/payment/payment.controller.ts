import { Controller, Post, Body, Req, Res, Get, Query, HttpStatus, BadRequestException, Param } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { Response, Request } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiQuery, ApiParam } from '@nestjs/swagger';

@ApiTags('Payment')
@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  /**
   * Create VNPAY payment
   */
  @ApiOperation({ summary: 'Create VNPAY payment' })
  @ApiBody({ schema: { properties: { orderId: { type: 'string' } } } })
  @ApiResponse({ status: 200, description: 'Payment URL created', schema: { properties: { paymentUrl: { type: 'string' } } } })
  @ApiResponse({ status: 400, description: 'Order ID is required' })
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
      
      let ipAddr = req.headers['x-forwarded-for'] || 
                  req.connection.remoteAddress || 
                  req.socket.remoteAddress ||
                  '127.0.0.1';
      
      if (typeof ipAddr !== 'string') {
        ipAddr = Array.isArray(ipAddr) ? ipAddr[0] : String(ipAddr);
      }
      
      if (ipAddr.includes(',')) {
        ipAddr = ipAddr.split(',')[0].trim();
      }
      
      console.log('Creating VNPAY payment for order:', orderId, 'IP:', ipAddr);
      
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
   */
  @ApiOperation({ summary: 'Handle VNPAY return callback' })
  @ApiQuery({ name: 'vnp_TransactionNo', required: false, description: 'VNPAY Transaction Number' })
  @ApiResponse({ status: 302, description: 'Redirect to frontend payment result page' })
  @Get('vnpay-return')
  async vnpayReturn(@Query() query: any, @Res() res: Response) {
    try {
      console.log('Received VNPAY return with params:', query);
      
      const result = await this.paymentService.processVnpayReturn(query);
      
      if (result.success) {
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment-success?orderId=${result.orderId}`);
      } else {
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment-failure?message=${encodeURIComponent(result.message)}`);
      }
    } catch (error) {
      console.error('Error processing VNPAY return:', error);
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment-failure?message=${encodeURIComponent('Error processing payment')}`);
    }
  }
  
  /**
   * Handle VNPAY IPN (Instant Payment Notification)
   */
  @ApiOperation({ summary: 'Handle VNPAY IPN (Instant Payment Notification)' })
  @ApiQuery({ name: 'vnp_TransactionNo', required: false, description: 'VNPAY Transaction Number' })
  @ApiResponse({ status: 200, description: 'VNPAY IPN response', schema: { properties: { RspCode: { type: 'string' }, Message: { type: 'string' } } } })
  @Get('vnpay-ipn')
  async vnpayIpn(@Query() query: any, @Res() res: Response) {
    try {
      console.log('Received VNPAY IPN with params:', query);
      
      const result = await this.paymentService.processVnpayIpn(query);
      
      return res.status(HttpStatus.OK).json({
        RspCode: result.rspCode,
        Message: result.message
      });
    } catch (error) {
      console.error('Error processing VNPAY IPN:', error);
      return res.status(HttpStatus.OK).json({
        RspCode: '99',
        Message: 'Unknown error'
      });
    }
  }
  
  /**
   * Get VNPAY payment status
   */
  @ApiOperation({ summary: 'Get VNPAY payment status' })
  @ApiParam({ name: 'orderId', required: true, description: 'Order ID' })
  @ApiResponse({ status: 200, description: 'Payment status retrieved successfully' })
  @Get('vnpay-status/:orderId')
  async getVnpayStatus(@Req() req: Request, @Res() res: Response) {
    try {
      return res.status(HttpStatus.OK).json({
        message: 'Payment status retrieved successfully',
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
