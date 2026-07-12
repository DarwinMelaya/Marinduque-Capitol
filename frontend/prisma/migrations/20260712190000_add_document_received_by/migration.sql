-- Track which staff confirmed office receive (e.g. Provincial Administrator)
ALTER TABLE "documents"
ADD COLUMN IF NOT EXISTS "received_by_id" UUID,
ADD COLUMN IF NOT EXISTS "received_by_name" TEXT,
ADD COLUMN IF NOT EXISTS "received_at" TIMESTAMPTZ(6);
