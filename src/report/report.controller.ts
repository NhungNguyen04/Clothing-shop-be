import { Controller, Get, Query, Request } from '@nestjs/common';
import { ReportService } from './report.service';

@Controller('report')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get('sales')
  async getSalesReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('sellerId') sellerId?: string,
    @Query('category') category?: string,
    @Request() req?: any,
  ) {
    // Use a default admin ID since we're removing authentication
    const adminId = 'system';
    
    // Log report generation
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
  async getInventoryReport(
    @Query('sellerId') sellerId?: string,
    @Query('category') category?: string,
    @Request() req?: any,
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
