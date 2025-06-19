const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting data export...');
  
  // Create exports directory if it doesn't exist
  const exportDir = path.join(__dirname, 'exports');
  if (!fs.existsSync(exportDir)){
    fs.mkdirSync(exportDir, { recursive: true });
  }

  // Export all data from all tables
  try {
    const data = {
      users: await prisma.user.findMany(),
      sellers: await prisma.seller.findMany(),
      addresses: await prisma.address.findMany(),
      products: await prisma.product.findMany(),
      sizeStocks: await prisma.sizeStock.findMany(),
      systemParameters: await prisma.systemParamater.findMany(),
      orders: await prisma.order.findMany(),
      orderItems: await prisma.orderItem.findMany(),
      reviews: await prisma.review.findMany(),
      shipments: await prisma.shipment.findMany(),
      carts: await prisma.cart.findMany(),
      cartItems: await prisma.cartItem.findMany(),
      conversations: await prisma.conversation.findMany(),
      messages: await prisma.message.findMany(),
      notifications: await prisma.notification.findMany(),
      reports: await prisma.report.findMany(),
    };

    // Write data to file
    const filePath = path.join(exportDir, 'all-data.json');
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    
    console.log(`Data successfully exported to ${filePath}`);
    console.log(`Total records exported:`);
    Object.keys(data).forEach(key => {
      console.log(`- ${key}: ${data[key].length} records`);
    });
  } catch (error) {
    console.error('Error during export:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('Export failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });