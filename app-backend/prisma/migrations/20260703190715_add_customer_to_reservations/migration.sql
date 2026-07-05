/*
  Warnings:

  - Added the required column `customer_name` to the `reservations` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "reservations" ADD COLUMN     "customer_name" TEXT NOT NULL,
ADD COLUMN     "customer_phone" TEXT,
ADD COLUMN     "duration_minutes" INTEGER NOT NULL DEFAULT 120;
