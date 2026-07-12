-- Track where a document currently sits in the office chain
ALTER TABLE "documents"
ADD COLUMN IF NOT EXISTS "current_location" TEXT NOT NULL DEFAULT 'Record Office';

CREATE INDEX IF NOT EXISTS "documents_status_idx" ON "documents"("status");
CREATE INDEX IF NOT EXISTS "documents_current_location_idx" ON "documents"("current_location");
