CREATE TABLE "login_rate_buckets" (
    "key" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "login_rate_buckets_pkey" PRIMARY KEY ("key")
);

CREATE INDEX "login_rate_buckets_expiresAt_idx" ON "login_rate_buckets"("expiresAt");
