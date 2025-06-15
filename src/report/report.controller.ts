import { Controller, Get, Query, Request } from '@nestjs/common';
import { ReportService } from './report.service';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

@Controller('report')
@ApiTags('Reports')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get('sales')
  @ApiOperation({ summary: 'Get sales report', description: 'Retrieve sales data with optional filtering' })
  @ApiResponse({ status: 200, description: 'Sales report retrieved successfully' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date for the report period (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date for the report period (YYYY-MM-DD)' })
  @ApiQuery({ name: 'sellerId', required: false, description: 'Filter by seller ID' })
  @ApiQuery({ name: 'category', required: false, description: 'Filter by product category' })
  async getSalesReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('sellerId') sellerId?: string,
    @Query('category') category?: string,
    @Request() req?: any,
  ) {
    const adminId = 'system';
    await this.reportService.logReportGeneration(
      'sales', 
      adminId, 
      { startDate, endDate, sellerId, category }
    );
    
    return this.reportService.getSalesReport(
      startDate,
      endDate,
      sellerId,
      category,
    );
  }

  @Get('inventory')
  @ApiOperation({ summary: 'Get inventory report', description: 'Retrieve inventory status information' })
  @ApiResponse({ status: 200, description: 'Inventory report retrieved successfully' })
  @ApiQuery({ name: 'sellerId', required: false, description: 'Filter by seller ID' })
  @ApiQuery({ name: 'category', required: false, description: 'Filter by product category' })
  async getInventoryReport(
    @Query('sellerId') sellerId?: string,
    @Query('category') category?: string,
  ) {
    const adminId = 'system';
    await this.reportService.logReportGeneration(
      'inventory', 
      adminId, 
      { sellerId, category }
    );
    
    return this.reportService.getInventoryReport(
      sellerId,
      category,
    );
  }

  @Get('users')
  async getUserReport(@Request() req?: any) {
    const adminId = 'system';
    await this.reportService.logReportGeneration('users', adminId);
    
    return this.reportService.getUserReport();
  }

  @Get('orders')
  async getOrderReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('status') status?: string,
    @Request() req?: any,
  ) {
    const adminId = 'system';
    await this.reportService.logReportGeneration(
      'orders', 
      adminId, 
      { startDate, endDate, status }
    );
    
    return this.reportService.getOrderReport(
      startDate,
      endDate,
      status,
    );
  }

  @Get('overview')
  async getSystemOverview(@Request() req?: any) {
    const adminId = 'system';
    await this.reportService.logReportGeneration('overview', adminId);
    
    return this.reportService.getSystemOverview();
  }
}
