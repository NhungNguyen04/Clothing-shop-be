/*
  Warnings:

  - You are about to drop the column `ratings` on the `Product` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Product" DROP COLUMN "ratings",
ADD COLUMN     "averageRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "reviews" INTEGER NOT NULL DEFAULT 0;
