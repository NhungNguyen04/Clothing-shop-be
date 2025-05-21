const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting data import...');

  // Read the JSON file
  const filePath = path.join(__dirname, 'exports', 'all-data.json');
  
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  const jsonData = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(jsonData);

  console.log('Data loaded from file. Starting import to database...');

  // Import data in the correct order to respect relationships
  try {
    // 1. First import users (required for other entities)
    if (data.users && data.users.length > 0) {
      console.log('Importing users...');
      for (const user of data.users) {
        await prisma.user.upsert({
          where: { id: user.id },
          update: { ...user, updatedAt: new Date() },
          create: { ...user, createdAt: new Date(), updatedAt: new Date() }
        });
      }
      console.log(`${data.users.length} users imported.`);
    }

    // 2. Import sellers (depends on users)
    if (data.sellers && data.sellers.length > 0) {
      console.log('Importing sellers...');
      for (const seller of data.sellers) {
        await prisma.seller.upsert({
          where: { id: seller.id },
          update: { ...seller, updatedAt: new Date() },
          create: { ...seller, createdAt: new Date(), updatedAt: new Date() }
        });
      }
      console.log(`${data.sellers.length} sellers imported.`);
    }

    // 3. Import products (depends on sellers)
    if (data.products && data.products.length > 0) {
      console.log('Importing products...');
      for (const product of data.products) {
        await prisma.product.upsert({
          where: { id: product.id },
          update: { ...product, updatedAt: new Date() },
          create: { ...product, createdAt: new Date(), updatedAt: new Date() }
        });
      }
      console.log(`${data.products.length} products imported.`);
    }

    // 4. Import size stocks (depends on products)
    if (data.sizeStocks && data.sizeStocks.length > 0) {
      console.log('Importing size stocks...');
      for (const sizeStock of data.sizeStocks) {
        await prisma.sizeStock.upsert({
          where: { id: sizeStock.id },
          update: { ...sizeStock, updatedAt: new Date() },
          create: { ...sizeStock, createdAt: new Date(), updatedAt: new Date() }
        });
      }
      console.log(`${data.sizeStocks.length} size stocks imported.`);
    }

    // 5. Import system parameters
    if (data.systemParameters && data.systemParameters.length > 0) {
      console.log('Importing system parameters...');
      for (const param of data.systemParameters) {
        await prisma.systemParamater.upsert({
          where: { id: param.id },
          update: { ...param, updatedAt: new Date() },
          create: { ...param, createdAt: new Date(), updatedAt: new Date() }
        });
      }
      console.log(`${data.systemParameters.length} system parameters imported.`);
    }

    // 6. Import carts (depends on users)
    if (data.carts && data.carts.length > 0) {
      console.log('Importing carts...');
      for (const cart of data.carts) {
        await prisma.cart.upsert({
          where: { id: cart.id },
          update: { ...cart, updatedAt: new Date() },
          create: { ...cart, createdAt: new Date(), updatedAt: new Date() }
        });
      }
      console.log(`${data.carts.length} carts imported.`);
    }

    // 7. Import cart items (depends on carts, users, and size stocks)
    if (data.cartItems && data.cartItems.length > 0) {
      console.log('Importing cart items...');
      for (const item of data.cartItems) {
        await prisma.cartItem.upsert({
          where: { id: item.id },
          update: { ...item, updatedAt: new Date() },
          create: { ...item, createdAt: new Date(), updatedAt: new Date() }
        });
      }
      console.log(`${data.cartItems.length} cart items imported.`);
    }

    // 8. Import orders (depends on users, products, and sellers)
    if (data.orders && data.orders.length > 0) {
      console.log('Importing orders...');
      for (const order of data.orders) {
        await prisma.order.upsert({
          where: { id: order.id },
          update: { ...order, updatedAt: new Date() },
          create: { ...order, createdAt: new Date(), updatedAt: new Date() }
        });
      }
      console.log(`${data.orders.length} orders imported.`);
    }

    // 9. Import shipments (depends on orders)
    if (data.shipments && data.shipments.length > 0) {
      console.log('Importing shipments...');
      for (const shipment of data.shipments) {
        await prisma.shipment.upsert({
          where: { id: shipment.id },
          update: { ...shipment, updatedAt: new Date() },
          create: { ...shipment, createdAt: new Date(), updatedAt: new Date() }
        });
      }
      console.log(`${data.shipments.length} shipments imported.`);
    }

    // 10. Import reviews (depends on users and products)
    if (data.reviews && data.reviews.length > 0) {
      console.log('Importing reviews...');
      for (const review of data.reviews) {
        await prisma.review.upsert({
          where: { id: review.id },
          update: { ...review, updatedAt: new Date() },
          create: { ...review, createdAt: new Date(), updatedAt: new Date() }
        });
      }
      console.log(`${data.reviews.length} reviews imported.`);
    }

    // 11. Import conversations (depends on users and sellers)
    if (data.conversations && data.conversations.length > 0) {
      console.log('Importing conversations...');
      for (const conversation of data.conversations) {
        await prisma.conversation.upsert({
          where: { id: conversation.id },
          update: { ...conversation, updatedAt: new Date() },
          create: { ...conversation, createdAt: new Date(), updatedAt: new Date() }
        });
      }
      console.log(`${data.conversations.length} conversations imported.`);
    }

    // 12. Import messages (depends on conversations and users)
    if (data.messages && data.messages.length > 0) {
      console.log('Importing messages...');
      for (const message of data.messages) {
        await prisma.message.upsert({
          where: { id: message.id },
          update: { ...message, updatedAt: new Date() },
          create: { ...message, createdAt: new Date(), updatedAt: new Date() }
        });
      }
      console.log(`${data.messages.length} messages imported.`);
    }

    // 13. Import notifications (depends on users)
    if (data.notifications && data.notifications.length > 0) {
      console.log('Importing notifications...');
      for (const notification of data.notifications) {
        await prisma.notification.upsert({
          where: { id: notification.id },
          update: { ...notification, updatedAt: new Date() },
          create: { ...notification, createdAt: new Date(), updatedAt: new Date() }
        });
      }
      console.log(`${data.notifications.length} notifications imported.`);
    }

    console.log('Data import completed successfully.');
  } catch (error) {
    console.error('Error during import:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('Import failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });