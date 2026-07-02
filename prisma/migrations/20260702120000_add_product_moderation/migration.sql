-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('PENDING', 'PUBLISHED', 'REJECTED', 'TAKEN_DOWN');

-- AlterTable
-- Existing products default to PUBLISHED so the current catalog stays visible.
ALTER TABLE "Product" ADD COLUMN     "status" "ProductStatus" NOT NULL DEFAULT 'PUBLISHED',
ADD COLUMN     "moderationNote" TEXT,
ADD COLUMN     "reviewedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Product_status_idx" ON "Product"("status");
