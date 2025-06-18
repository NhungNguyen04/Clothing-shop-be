import { prisma } from '@/prisma/prisma';
import { Injectable, NotFoundException } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class SellerReportService {
  constructor() {}

  async getDashboardSummary(sellerId: string) {
    // Verify seller exists
    const seller = await prisma.seller.findUnique({
      where: { id: sellerId },
    });

    if (!seller) {
      throw new NotFoundException(`Seller with ID ${sellerId} not found`);
    }

    // Get total product count
    const totalProducts = await prisma.product.count({
      where: { sellerId },
    });

    // Get total revenue
    const totalRevenue = await this.calculateTotalRevenue(sellerId);

    // Get pending orders count
    const pendingOrders = await prisma.order.count({
      where: {
        sellerId,
        status: OrderStatus.PENDING,
      },
    });

    // Get low stock products count
    const lowStockProducts = await prisma.product.count({
      where: {
        sellerId,
        stockQuantity: { lt: 10 },
      },
    });

    // Get total orders count
    const totalOrders = await prisma.order.count({
      where: { sellerId },
    });

    // Get average product rating
    const productsWithRatings = await prisma.product.findMany({
      where: {
        sellerId,
        averageRating: { gt: 0 },
      },
      select: {
        averageRating: true,
      },
    });

    const avgRating = productsWithRatings.length > 0
      ? productsWithRatings.reduce((sum, p) => sum + p.averageRating, 0) / productsWithRatings.length
      : 0;

    return {
      totalProducts,
      totalRevenue,
      pendingOrders,
      lowStockProducts,
      totalOrders,
      averageRating: parseFloat(avgRating.toFixed(2)),
      lastUpdated: new Date(),
    };
  }

  async getProductsReport(sellerId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    
    const products = await prisma.product.findMany({
      where: { sellerId },
      include: {
        stockSize: true,
      },
      skip,
      take: limit,
      orderBy: { updatedAt: 'desc' },
    });

    const totalProducts = await prisma.product.count({
      where: { sellerId },
    });

    return {
      products,
      meta: {
        page,
        limit,
        total: totalProducts,
        totalPages: Math.ceil(totalProducts / limit),
      }
    };
  }

  async getInventoryReport(
    sellerId: string, 
    page: number, 
    limit: number, 
    lowStockOnly: boolean = false,
    startDate?: string,
    endDate?: string,
  ) {
    const skip = (page - 1) * limit;
    
    // Build where clause with time range if provided
    const where: any = {
      sellerId,
      ...(lowStockOnly ? { stockQuantity: { lt: 10 } } : {}),
    };
    
    // Add date filter if dates provided
    if (startDate || endDate) {
      where.updatedAt = {};
      
      if (startDate) {
        where.updatedAt.gte = new Date(startDate);
      }
      
      if (endDate) {
        where.updatedAt.lte = new Date(endDate);
      }
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        stockSize: true,
      },
      skip,
      take: limit,
      orderBy: { stockQuantity: 'asc' },
    });

    const totalProducts = await prisma.product.count({ where });
    const outOfStockCount = await prisma.product.count({
      where: {
        sellerId,
        stockQuantity: 0,
      }
    });

    const lowStockCount = await prisma.product.count({
      where: {
        sellerId,
        stockQuantity: {
          gt: 0,
          lt: 10,
        },
      }
    });

    return {
      products,
      meta: {
        page,
        limit,
        total: totalProducts,
        totalPages: Math.ceil(totalProducts / limit),
        outOfStockCount,
        lowStockCount,
      }
    };
  }

  // New method to get inventory history for specific product
  async getProductInventoryHistory(
    sellerId: string, 
    productId: string, 
    timeRange: 'week' | 'month' | 'year' = 'week'
  ) {
    // Verify product belongs to seller
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        sellerId,
      },
    });

    if (!product) {
      throw new NotFoundException(`Product not found or doesn't belong to this seller`);
    }

    // Calculate start date based on time range
    const now = new Date();
    let startDate: Date;
    
    switch (timeRange) {
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case 'year':
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      default:
        startDate = new Date(now.setDate(now.getDate() - 7));
    }

    // In a real application, you would query historical inventory data from a separate table
    // For demonstration purposes, we'll generate mock data
    const inventoryData = this.generateMockInventoryHistory(product.stockQuantity, startDate, new Date(), timeRange);
    const salesData = this.generateMockSalesHistory(startDate, new Date(), timeRange);

    return {
      productId,
      timeRange,
      inventoryData,
      salesData
    };
  }

  // Helper method for generating mock inventory history
  private generateMockInventoryHistory(
    currentStock: number, 
    startDate: Date, 
    endDate: Date, 
    timeRange: 'week' | 'month' | 'year'
  ) {
    const data: { date: string; value: number }[] = [];
    const dayDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24));
    
    let interval: number;
    let format: string;
    
    switch (timeRange) {
      case 'week':
        interval = 1; // 1 day
        format = 'yyyy-MM-dd';
        break;
      case 'month':
        interval = 1; // 1 day
        format = 'yyyy-MM-dd';
        break;
      case 'year':
        interval = 30; // ~1 month
        format = 'yyyy-MM';
        break;
      default:
        interval = 1;
        format = 'yyyy-MM-dd';
    }
    
    for (let i = 0; i <= dayDiff; i += interval) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      // Generate a somewhat realistic stock pattern working backwards from current stock
      const variance = Math.floor(Math.random() * 5) - 2; // -2 to +2 random variation
      const value = Math.max(0, currentStock + variance + i); // Stock tends to decrease over time
      
      data.push({
        date: date.toISOString().split('T')[0], // Format as YYYY-MM-DD
        value
      });
    }
    
    return data;
  }

  // Helper method for generating mock sales history
  private generateMockSalesHistory(startDate: Date, endDate: Date, timeRange: 'week' | 'month' | 'year') {
    const data: { date: string; value: number }[] = [];
    const dayDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24));
    
    let interval: number;
    
    switch (timeRange) {
      case 'week':
        interval = 1; // 1 day
        break;
      case 'month':
        interval = 1; // 1 day
        break;
      case 'year':
        interval = 30; // ~1 month
        break;
      default:
        interval = 1;
    }
    
    for (let i = 0; i <= dayDiff; i += interval) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      // Random sales between 0 and 10
      const value = Math.floor(Math.random() * 10);
      
      data.push({
        date: date.toISOString().split('T')[0],
        value
      });
    }
    
    return data;
  }

  async getRevenueReport(sellerId: string, startDate?: string, endDate?: string, groupBy: 'day' | 'week' | 'month' = 'day') {
    // Default to last 30 days if no dates provided
    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate ? new Date(endDate) : new Date();

    const orders = await prisma.order.findMany({
      where: {
        sellerId,
        orderDate: {
          gte: start,
          lte: end,
        },
        status: {
          not: OrderStatus.CANCELLED,
        }
      },
      select: {
        orderDate: true,
        totalPrice: true,
      },
      orderBy: {
        orderDate: 'asc',
      }
    });

    // Group revenue by the specified time period
    const revenueByPeriod = this.groupRevenueByPeriod(orders, groupBy);
    
    // Get top selling products during this period
    const topSellingProducts = await this.getTopSellingProductsInPeriod(sellerId, start, end);

    // Calculate total revenue for the period
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalPrice, 0);

    return {
      startDate: start,
      endDate: end,
      totalRevenue,
      groupBy,
      revenueByPeriod,
      topSellingProducts,
    };
  }

  async getOrdersReport(sellerId: string, status: string | undefined, page: number, limit: number) {
    const skip = (page - 1) * limit;
    
    const where = {
      sellerId,
      ...(status ? { status: status as OrderStatus } : {}),
    };

    const orders = await prisma.order.findMany({
      where,
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        orderItems: {
          include: {
            sizeStock: {
              include: {
                product: {
                  select: {
                    name: true,
                    image: true,
                  },
                }
              }
            }
          }
        }
      },
      skip,
      take: limit,
      orderBy: { orderDate: 'desc' },
    });

    const totalOrders = await prisma.order.count({ where });
    
    // Count orders by status
    const ordersByStatus = await this.countOrdersByStatus(sellerId);

    return {
      orders,
      ordersByStatus,
      meta: {
        page,
        limit,
        total: totalOrders,
        totalPages: Math.ceil(totalOrders / limit),
      }
    };
  }

  async getTopProducts(sellerId: string, limit: number) {
    // Get top products by revenue
    const topByRevenue = await prisma.product.findMany({
      where: { sellerId },
      orderBy: [
        { reviews: 'desc' },
        { averageRating: 'desc' },
      ],
      take: limit,
    });

    // Get products with highest ratings
    const topRated = await prisma.product.findMany({
      where: { 
        sellerId,
        averageRating: { gt: 0 }
      },
      orderBy: { averageRating: 'desc' },
      take: limit,
    });

    // Get recently added products
    const recentProducts = await prisma.product.findMany({
      where: { sellerId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return {
      topByRevenue,
      topRated,
      recentProducts,
    };
  }

  // Helper methods
  private async calculateTotalRevenue(sellerId: string): Promise<number> {
    const result = await prisma.order.aggregate({
      where: {
        sellerId,
        status: {
          not: OrderStatus.CANCELLED,
        }
      },
      _sum: {
        totalPrice: true,
      },
    });

    return result._sum.totalPrice || 0;
  }

  private groupRevenueByPeriod(orders: { orderDate: Date; totalPrice: number }[], groupBy: 'day' | 'week' | 'month') {
    const result = {};

    orders.forEach(order => {
      let periodKey: string;
      const date = new Date(order.orderDate);
      
      switch (groupBy) {
        case 'day':
          periodKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
          break;
        case 'week':
          // Get the week number
          const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
          const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
          const weekNum = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
          periodKey = `${date.getFullYear()}-W${weekNum}`;
          break;
        case 'month':
          periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        default:
          periodKey = date.toISOString().split('T')[0]; // Default to day
      }

      if (!result[periodKey]) {
        result[periodKey] = 0;
      }
      result[periodKey] += order.totalPrice;
    });

    return Object.entries(result).map(([period, revenue]) => ({
      period,
      revenue,
    })).sort((a, b) => a.period.localeCompare(b.period));
  }

  private async getTopSellingProductsInPeriod(sellerId: string, startDate: Date, endDate: Date) {
    // This would require joining orders, orderItems, and products
    // For simplicity in this example, we'll return placeholder data
    return await prisma.product.findMany({
      where: { sellerId },
      orderBy: { reviews: 'desc' },
      take: 5,
    });
  }

  private async countOrdersByStatus(sellerId: string) {
    const statusCounts = {};
    
    // Initialize with all possible statuses
    for (const status of Object.values(OrderStatus)) {
      statusCounts[status] = 0;
    }

    // Get the counts
    const results = await prisma.order.groupBy({
      by: ['status'],
      where: { sellerId },
      _count: {
        status: true,
      },
    });

    // Update the counts
    results.forEach(item => {
      statusCounts[item.status] = item._count.status;
    });

    return statusCounts;
  }
}
