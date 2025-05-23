/*
  Warnings:

  - You are about to drop the column `address` on the `Seller` table. All the data in the column will be lost.
  - You are about to drop the column `postalCode` on the `Seller` table. All the data in the column will be lost.
  - You are about to drop the column `postalCode` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[addressId]` on the table `Seller` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `phoneNumber` to the `Address` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Address" ADD COLUMN     "phoneNumber" TEXT NOT NULL,
ADD COLUMN     "sellerId" TEXT,
ALTER COLUMN "userId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Seller" DROP COLUMN "address",
DROP COLUMN "postalCode",
ADD COLUMN     "addressId" TEXT;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "postalCode";

-- CreateIndex
CREATE UNIQUE INDEX "Seller_addressId_key" ON "Seller"("addressId");

-- AddForeignKey
ALTER TABLE "Seller" ADD CONSTRAINT "Seller_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "Address"("id") ON DELETE CASCADE ON UPDATE CASCADE;
