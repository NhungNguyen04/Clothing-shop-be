/*
  Warnings:

  - You are about to drop the column `sellerId` on the `Order` table. All the data in the column will be lost.
  - Added the required column `sellerId` to the `OrderDetail` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_sellerId_fkey";

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "sellerId";

-- AlterTable
ALTER TABLE "OrderDetail" ADD COLUMN     "sellerId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "OrderDetail" ADD CONSTRAINT "OrderDetail_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "Seller"("id") ON DELETE CASCADE ON UPDATE CASCADE;
