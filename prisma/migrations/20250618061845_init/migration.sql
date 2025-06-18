/*
  Warnings:

  - You are about to drop the `SellerReport` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "SellerReport" DROP CONSTRAINT "SellerReport_sellerId_fkey";

-- DropTable
DROP TABLE "SellerReport";
