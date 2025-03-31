/*
  Warnings:

  - You are about to drop the column `stockSizeId` on the `OrderDetail` table. All the data in the column will be lost.
  - Added the required column `size` to the `OrderDetail` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "OrderDetail" DROP CONSTRAINT "OrderDetail_stockSizeId_fkey";

-- DropIndex
DROP INDEX "OrderDetail_stockSizeId_key";

-- AlterTable
ALTER TABLE "OrderDetail" DROP COLUMN "stockSizeId",
ADD COLUMN     "size" TEXT NOT NULL;
