-- Document intake / tracking for Record Office
CREATE TABLE IF NOT EXISTS "documents" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "subject" TEXT NOT NULL,
    "sender" TEXT NOT NULL,
    "date_received" DATE NOT NULL,
    "receiver_name" TEXT NOT NULL,
    "transaction_code" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'RECEIVED',
    "recorded_by_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "documents_transaction_code_key" ON "documents"("transaction_code");
CREATE INDEX IF NOT EXISTS "documents_date_received_idx" ON "documents"("date_received");
