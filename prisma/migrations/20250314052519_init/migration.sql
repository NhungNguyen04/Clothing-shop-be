/*
  Warnings:

  - You are about to drop the `SystemParamter` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "SystemParamter";

-- CreateTable
CREATE TABLE "SystemParamater" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemParamater_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SystemParamater_key_key" ON "SystemParamater"("key");
