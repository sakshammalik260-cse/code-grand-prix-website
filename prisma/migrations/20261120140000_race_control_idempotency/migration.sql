-- Durable idempotency key for volunteer/admin authorizations.
ALTER TABLE "audit_logs" ADD COLUMN "idempotencyKey" TEXT;
CREATE UNIQUE INDEX "audit_logs_idempotencyKey_key" ON "audit_logs"("idempotencyKey");
