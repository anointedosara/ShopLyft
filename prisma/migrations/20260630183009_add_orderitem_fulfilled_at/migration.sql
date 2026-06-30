-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "fulfilledAt" TIMESTAMP(3);

-- Backfill: items belonging to orders already marked FULFILLED are, by definition,
-- fulfilled. Stamp them so the per-seller fulfillment view is consistent.
UPDATE "OrderItem" oi
SET "fulfilledAt" = o."createdAt"
FROM "Order" o
WHERE oi."orderId" = o."id" AND o."status" = 'FULFILLED';
