CREATE TABLE "competition_rounds" (
  "id" TEXT PRIMARY KEY,
  "contestId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "status" "ContestStatus" NOT NULL DEFAULT 'WAITING',
  "startsAt" TIMESTAMP(3) NOT NULL,
  "endsAt" TIMESTAMP(3) NOT NULL,
  "questionsVisible" BOOLEAN NOT NULL DEFAULT true,
  "resultsVisible" BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT "competition_rounds_window_check" CHECK ("endsAt" > "startsAt"),
  CONSTRAINT "competition_rounds_contestId_fkey" FOREIGN KEY ("contestId") REFERENCES "contests"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "competition_rounds_id_contestId_key" ON "competition_rounds"("id", "contestId");
CREATE INDEX "competition_rounds_contestId_startsAt_idx" ON "competition_rounds"("contestId", "startsAt");

INSERT INTO "competition_rounds" ("id", "contestId", "title", "status", "startsAt", "endsAt", "resultsVisible")
SELECT "id", "id", 'Round 1', "status", "startsAt", "endsAt", "resultsVisible" FROM "contests";

ALTER TABLE "problems" ADD COLUMN "roundId" TEXT, ADD COLUMN "publishAt" TIMESTAMP(3);
UPDATE "problems" SET "roundId" = "contestId";
ALTER TABLE "problems" ADD CONSTRAINT "problems_roundId_contestId_fkey"
  FOREIGN KEY ("roundId", "contestId") REFERENCES "competition_rounds"("id", "contestId") ON DELETE RESTRICT ON UPDATE RESTRICT;
CREATE INDEX "problems_contestId_roundId_order_idx" ON "problems"("contestId", "roundId", "order");

-- Keep existing integer values while accepting decimal weights from the admin editor.
ALTER TABLE "test_cases" ALTER COLUMN "weight" TYPE DOUBLE PRECISION;
