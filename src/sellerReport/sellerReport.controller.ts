import { Controller, Get, Param, Query } from '@nestjs/common';
import { SellerReportService } from './sellerReport.service';
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';

@Controller('seller-report')
@ApiTags('Seller Reports')
export class SellerReportController {
  constructor(private readonly sellerReportService: SellerReportService) {}

  @Get(':sellerId/dashboard-summary')
  @ApiOperation({ summary: 'Get dashboard summary for a seller' })
  @ApiParam({ name: 'sellerId', type: String, description: 'Seller ID' })
  async getDashboardSummary(@Param('sellerId') sellerId: string) {
    return this.sellerReportService.getDashboardSummary(sellerId);
  }

  @Get(':sellerId/products')
  @ApiOperation({ summary: 'Get products report for a seller' })
  @ApiParam({ name: 'sellerId', type: String, description: 'Seller ID' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  async getProductsReport(
    @Param('sellerId') sellerId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.sellerReportService.getProductsReport(sellerId, +page, +limit);
  }

  @Get(':sellerId/inventory')
  @ApiOperation({ summary: 'Get inventory report for a seller' })
  @ApiParam({ name: 'sellerId', type: String, description: 'Seller ID' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'lowStock', required: false, type: Boolean, description: 'Filter for low stock items' })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Start date for inventory data (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'End date for inventory data (YYYY-MM-DD)' })
  async getInventoryReport(
    @Param('sellerId') sellerId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('lowStock') lowStock?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.sellerReportService.getInventoryReport(
      sellerId,
      +page,
      +limit,
      lowStock === 'true',
      startDate,
      endDate,
    );
  }

  @Get(':sellerId/revenue')
  @ApiOperation({ summary: 'Get revenue report for a seller' })
  @ApiParam({ name: 'sellerId', type: String, description: 'Seller ID' })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'End date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'groupBy', required: false, enum: ['day', 'week', 'month'], description: 'Group by period' })
  async getRevenueReport(
    @Param('sellerId') sellerId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('groupBy') groupBy?: 'day' | 'week' | 'month',
  ) {
    return this.sellerReportService.getRevenueReport(
      sellerId,
      startDate,
      endDate,
      groupBy,
    );
  }

  @Get(':sellerId/orders')
  @ApiOperation({ summary: 'Get orders report for a seller' })
  @ApiParam({ name: 'sellerId', type: String, description: 'Seller ID' })
  @ApiQuery({ name: 'status', required: false, type: String, description: 'Order status' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  async getOrdersReport(
    @Param('sellerId') sellerId: string,
    @Query('status') status?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.sellerReportService.getOrdersReport(
      sellerId,
      status,
      +page,
      +limit,
    );
  }

  @Get(':sellerId/top-products')
  @ApiOperation({ summary: 'Get top products for a seller' })
  @ApiParam({ name: 'sellerId', type: String, description: 'Seller ID' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 5 })
  async getTopProducts(
    @Param('sellerId') sellerId: string,
    @Query('limit') limit = 5,
  ) {
    return this.sellerReportService.getTopProducts(sellerId, +limit);
  }

  // New endpoint for product-specific inventory history
  @Get(':sellerId/products/:productId/inventory-history')
  @ApiOperation({ summary: 'Get inventory history for a specific product' })
  @ApiParam({ name: 'sellerId', type: String, description: 'Seller ID' })
  @ApiParam({ name: 'productId', type: String, description: 'Product ID' })
  @ApiQuery({ name: 'timeRange', required: false, enum: ['week', 'month', 'year'], description: 'Time range for history data' })
  async getProductInventoryHistory(
    @Param('sellerId') sellerId: string,
    @Param('productId') productId: string,
    @Query('timeRange') timeRange: 'week' | 'month' | 'year' = 'week',
  ) {
    return this.sellerReportService.getProductInventoryHistory(sellerId, productId, timeRange);
  }
}
