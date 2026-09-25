-- Durable record for paid Lemon orders that failed fulfillment (ops can resolve manually).
CREATE TABLE IF NOT EXISTS "LemonWebhookDeadLetter" (
    "id" TEXT NOT NULL,
    "lemonOrderId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "detail" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    CONSTRAINT "LemonWebhookDeadLetter_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "LemonWebhookDeadLetter_lemonOrderId_key"
  ON "LemonWebhookDeadLetter"("lemonOrderId");
