-- Lemon Squeezy order id for idempotent credit fulfillment via webhooks.
ALTER TABLE "DepositRequest" ADD COLUMN IF NOT EXISTS "lemonOrderId" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "DepositRequest_lemonOrderId_key" ON "DepositRequest"("lemonOrderId");
