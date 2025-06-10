import { prisma } from '@/prisma/prisma';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ReportService {
  constructor() {}

  // Get sales report - can filter by date range, seller, category
  async getSalesReport(
    startDate?: string,
    endDate?: string,
    sellerId?: string,
    category?: string,
  ) {
    const start = startDate ? new Date(startDate) : new Date(new Date().setMonth(new Date().getMonth() - 1));
    const end = endDate ? new Date(endDate) : new Date();

    // Build filter based on provided parameters
    const where: any = {
      createdAt: {
        gte: start,
        lte: end,
      },
      status: 'DELIVERED',
    };

    if (sellerId) where.sellerId = sellerId;

    // Fetch orders within date range
    const orders = await prisma.order.findMany({
      where,
      include: {
        orderItems: {
          include: {
            sizeStock: {
              include: {
                product: true,
              },
            },
          },
        },
        seller: {
          include: {
            user: true,
          },
        },
      },
    });

    // Process orders to calculate sales data
    let totalRevenue = 0;
    const salesByCategory = {};
    const salesBySeller = {};
    const salesByDate = {};

    orders.forEach((order) => {
      const orderDate = order.orderDate.toISOString().split('T')[0];
      totalRevenue += order.totalPrice;

      // Sales by category
      order.orderItems.forEach((item) => {
        const productCategory = item.sizeStock.product.category;
        
        // Skip if category filter is provided and doesn't match
        if (category && productCategory !== category) return;
        
        if (!salesByCategory[productCategory]) {
          salesByCategory[productCategory] = 0;
        }
        salesByCategory[productCategory] += item.totalPrice;
      });

      // Sales by seller
      const sellerName = order.seller.user.name;
      if (!salesBySeller[sellerName]) {
        salesBySeller[sellerName] = 0;
      }
      salesBySeller[sellerName] += order.totalPrice;

      // Sales by date
      if (!salesByDate[orderDate]) {
        salesByDate[orderDate] = 0;
      }
      salesByDate[orderDate] += order.totalPrice;
    });

    return {
      totalRevenue,
      salesByCategory,
      salesBySeller,
      salesByDate,
      orderCount: orders.length,
      averageOrderValue: orders.length ? totalRevenue / orders.length : 0,
    };
  }

  // Get inventory report
  async getInventoryReport(sellerId?: string, category?: string) {
    const where: any = {};
    if (sellerId) where.sellerId = sellerId;
    if (category) where.category = category;

    const products = await prisma.product.findMany({
      where,
      include: {
        stockSize: true,
        seller: {
          include: {
            user: true,
          },
        },
      },
    });

    const lowStockThreshold = 10;
    const outOfStock: { id: string; name: string; seller: string }[] = [];
    const lowStock: { id: string; name: string; stock: number; seller: string }[] = [];
    const inventoryByCategory = {};
    const inventoryBySeller = {};

    products.forEach((product) => {
      let totalStock = 0;
      product.stockSize.forEach((size) => {
        totalStock += size.quantity;
      });

      // Track low and out of stock items
      if (totalStock === 0) {
        outOfStock.push({
          id: product.id,
          name: product.name,
          seller: product.seller.user.name,
        });
      } else if (totalStock < lowStockThreshold) {
        lowStock.push({
          id: product.id,
          name: product.name,
          stock: totalStock,
          seller: product.seller.user.name,
        });
      }

      // Inventory by category
      if (!inventoryByCategory[product.category]) {
        inventoryByCategory[product.category] = 0;
      }
      inventoryByCategory[product.category] += totalStock;

      // Inventory by seller
      const sellerName = product.seller.user.name;
      if (!inventoryBySeller[sellerName]) {
        inventoryBySeller[sellerName] = 0;
      }
      inventoryBySeller[sellerName] += totalStock;
    });

    return {
      totalProducts: products.length,
      outOfStockCount: outOfStock.length,
      lowStockCount: lowStock.length,
      outOfStock,
      lowStock,
      inventoryByCategory,
      inventoryBySeller,
    };
  }

  // Get user report
  async getUserReport() {
    const users = await prisma.user.findMany();
    const sellers = await prisma.seller.findMany({
      include: {
        user: true,
      },
    });

    // User statistics by role
    const usersByRole = {
      ADMIN: users.filter(user => user.role === 'ADMIN').length,
      SELLER: users.filter(user => user.role === 'SELLER').length,
      CUSTOMER: users.filter(user => user.role === 'CUSTOMER').length,
    };

    // Seller statistics by status
    const sellersByStatus = {
      PENDING: sellers.filter(seller => seller.status === 'PENDING').length,
      APPROVED: sellers.filter(seller => seller.status === 'APPROVED').length,
      REJECTED: sellers.filter(seller => seller.status === 'REJECTED').length,
    };

    // Get user registration trends (monthly for the last year)
    const today = new Date();
    const lastYear = new Date(today.setFullYear(today.getFullYear() - 1));
    
    const userTrends = await prisma.user.groupBy({
      by: ['createdAt'],
      _count: {
        id: true,
      },
      where: {
        createdAt: {
          gte: lastYear,
        },
      },
    });

    // Format user trends by month
    const userTrendsByMonth = {};
    userTrends.forEach((item) => {
      const month = item.createdAt.toISOString().substring(0, 7); // YYYY-MM format
      if (!userTrendsByMonth[month]) {
        userTrendsByMonth[month] = 0;
      }
      userTrendsByMonth[month] += item._count.id;
    });

    return {
      totalUsers: users.length,
      totalSellers: sellers.length,
      usersByRole,
      sellersByStatus,
      userTrendsByMonth,
    };
  }

  // Get order report
  async getOrderReport(
    startDate?: string,
    endDate?: string,
    status?: string,
  ) {
    const start = startDate ? new Date(startDate) : new Date(new Date().setMonth(new Date().getMonth() - 1));
    const end = endDate ? new Date(endDate) : new Date();

    const where: any = {
      orderDate: {
        gte: start,
        lte: end,
      },
    };

    if (status) where.status = status;

    const orders = await prisma.order.findMany({
      where,
      include: {
        user: true,
        seller: {
          include: {
            user: true,
          },
        },
      },
    });

    // Order statistics by status
    const ordersByStatus = {
      PENDING: orders.filter(order => order.status === 'PENDING').length,
      SHIPPED: orders.filter(order => order.status === 'SHIPPED').length,
      DELIVERED: orders.filter(order => order.status === 'DELIVERED').length,
      CANCELLED: orders.filter(order => order.status === 'CANCELLED').length,
    };

    // Order trends by day
    const orderTrendsByDay = {};
    orders.forEach((order) => {
      const day = order.orderDate.toISOString().split('T')[0]; // YYYY-MM-DD format
      if (!orderTrendsByDay[day]) {
        orderTrendsByDay[day] = 0;
      }
      orderTrendsByDay[day]++;
    });

    // Calculate revenue
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalPrice, 0);
    const revenueByStatus = {
      PENDING: orders.filter(order => order.status === 'PENDING')
        .reduce((sum, order) => sum + order.totalPrice, 0),
      SHIPPED: orders.filter(order => order.status === 'SHIPPED')
        .reduce((sum, order) => sum + order.totalPrice, 0),
      DELIVERED: orders.filter(order => order.status === 'DELIVERED')
        .reduce((sum, order) => sum + order.totalPrice, 0),
      CANCELLED: orders.filter(order => order.status === 'CANCELLED')
        .reduce((sum, order) => sum + order.totalPrice, 0),
    };

    return {
      totalOrders: orders.length,
      totalRevenue,
      ordersByStatus,
      revenueByStatus,
      orderTrendsByDay,
      averageOrderValue: orders.length ? totalRevenue / orders.length : 0,
    };
  }

  // Get system overview with high level metrics
  async getSystemOverview() {
    // Get counts from different entities
    const [
      userCount,
      productCount,
      orderCount,
      sellerCount,
      totalRevenue,
      pendingSellerCount,
      pendingOrderCount
    ] = await Promise.all([
      prisma.user.count(),
      prisma.product.count(),
      prisma.order.count(),
      prisma.seller.count({ where: { status: 'APPROVED' } }),
      prisma.order.aggregate({
        _sum: {
          totalPrice: true,
        },
        where: {
          status: 'DELIVERED',
        },
      }),
      prisma.seller.count({ where: { status: 'PENDING' } }),
      prisma.order.count({ where: { status: 'PENDING' } }),
    ]);

    // Get recent orders
    const recentOrders = await prisma.order.findMany({
      take: 5,
      orderBy: {
        orderDate: 'desc',
      },
      include: {
        user: true,
        seller: {
          include: {
            user: true,
          },
        },
      },
    });

    return {
      userCount,
      productCount,
      orderCount,
      sellerCount,
      totalRevenue: totalRevenue._sum.totalPrice || 0,
      pendingSellerCount,
      pendingOrderCount,
      recentOrders,
    };
  }

  // Log report generation
  async logReportGeneration(reportType: string, adminId: string, parameters?: any) {
    return prisma.report.create({
      data: {
        reportType,
        generatedBy: adminId,
        parameters: parameters || {},
      },
    });
  }
}
