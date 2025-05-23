/*
  Warnings:

  - You are about to drop the column `phone` on the `Seller` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Address" ADD COLUMN     "district" TEXT,
ADD COLUMN     "province" TEXT,
ADD COLUMN     "street" TEXT,
ADD COLUMN     "ward" TEXT;

-- AlterTable
ALTER TABLE "Seller" DROP COLUMN "phone",
ALTER COLUMN "address" DROP NOT NULL;
