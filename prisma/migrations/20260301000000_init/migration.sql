-- CreateEnum
CREATE TYPE "Role" AS ENUM ('CANDIDATE', 'PARTICIPANT', 'VOLUNTEER', 'ADMIN');

-- CreateEnum
CREATE TYPE "ContestStatus" AS ENUM ('UPCOMING', 'WAITING', 'LIVE', 'PAUSED', 'PAUSED_BY_ORGANIZER', 'ENDED', 'FINISHED');

-- CreateEnum
CREATE TYPE "CheckinStatus" AS ENUM ('NOT_STARTED', 'PENDING', 'READY', 'BLOCKED');

-- CreateEnum
CREATE TYPE "RaceSessionStatus" AS ENUM ('WAITING', 'ACTIVE', 'LOCK_PENDING', 'LOCKED', 'UNDER_REVIEW', 'RESUME_AUTHORIZED', 'FINISHED');

-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateEnum
CREATE TYPE "ProblemStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'PUBLISHED', 'HIDDEN');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "Verdict" AS ENUM ('QUEUED', 'RUNNING', 'ACCEPTED', 'WRONG_ANSWER', 'TIME_LIMIT_EXCEEDED', 'MEMORY_LIMIT_EXCEEDED', 'COMPILATION_ERROR', 'RUNTIME_ERROR', 'INTERNAL_ERROR');

-- CreateEnum
CREATE TYPE "IncidentType" AS ENUM ('TAB_HIDDEN', 'WINDOW_BLUR', 'WINDOW_FOCUS_LOST', 'FULLSCREEN_EXIT', 'CAMERA_INTERRUPTED', 'CAMERA_TRACK_ENDED', 'CAMERA_PERMISSION_DENIED', 'NETWORK_RECONNECT');

-- CreateEnum
CREATE TYPE "IncidentAction" AS ENUM ('LOCK', 'LOG_ONLY');

-- CreateEnum
CREATE TYPE "IncidentStatus" AS ENUM ('OPEN', 'RESOLVED', 'AUTHORIZED', 'DISMISSED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "team" TEXT DEFAULT 'CPC Grid',
    "role" "Role" NOT NULL DEFAULT 'CANDIDATE',
    "lastLogoutAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contests" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "ContestStatus" NOT NULL DEFAULT 'LIVE',
    "resultsVisible" BOOLEAN NOT NULL DEFAULT true,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contestId" TEXT NOT NULL,
    "status" "RaceSessionStatus" NOT NULL DEFAULT 'WAITING',
    "revision" INTEGER NOT NULL DEFAULT 1,
    "checkinStatus" "CheckinStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "rulesAccepted" BOOLEAN NOT NULL DEFAULT false,
    "cameraPermission" BOOLEAN NOT NULL DEFAULT false,
    "fullscreenRequested" BOOLEAN NOT NULL DEFAULT false,
    "cameraStatus" TEXT NOT NULL DEFAULT 'DISCONNECTED',
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lockCount" INTEGER NOT NULL DEFAULT 0,
    "lockReason" TEXT,
    "lockedAt" TIMESTAMP(3),
    "resumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "problems" (
    "id" TEXT NOT NULL,
    "contestId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "difficulty" "Difficulty" NOT NULL,
    "points" INTEGER NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 1,
    "revision" INTEGER NOT NULL DEFAULT 1,
    "status" "ProblemStatus" NOT NULL DEFAULT 'PUBLISHED',
    "statement" TEXT NOT NULL,
    "inputFormat" TEXT NOT NULL,
    "outputFormat" TEXT NOT NULL,
    "constraints" TEXT NOT NULL,
    "timeLimitMs" INTEGER NOT NULL DEFAULT 2000,
    "memoryLimitMb" INTEGER NOT NULL DEFAULT 256,
    "allowedLanguages" TEXT[] DEFAULT ARRAY['python', 'javascript', 'cpp', 'java']::TEXT[],
    "expectedTimeComplexity" TEXT DEFAULT 'O(n)',
    "expectedSpaceComplexity" TEXT DEFAULT 'O(1)',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "problems_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_cases" (
    "id" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "input" TEXT NOT NULL,
    "expectedOutput" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "explanation" TEXT,
    "weight" INTEGER DEFAULT 1,
    "order" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "test_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hints" (
    "id" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 1,
    "deductionPoints" INTEGER NOT NULL DEFAULT 10,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hint_receipts" (
    "id" TEXT NOT NULL,
    "operationId" TEXT NOT NULL,
    "contestId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "hintId" TEXT NOT NULL,
    "deductionApplied" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hint_receipts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "submissions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "languageId" TEXT NOT NULL,
    "sourceCode" TEXT NOT NULL,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'QUEUED',
    "verdict" "Verdict" NOT NULL DEFAULT 'QUEUED',
    "score" INTEGER NOT NULL DEFAULT 0,
    "passedTests" INTEGER NOT NULL DEFAULT 0,
    "totalTests" INTEGER NOT NULL DEFAULT 0,
    "runtimeMs" INTEGER,
    "memoryKb" INTEGER,
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incidents" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "problemId" TEXT,
    "type" "IncidentType" NOT NULL,
    "action" "IncidentAction" NOT NULL,
    "status" "IncidentStatus" NOT NULL DEFAULT 'OPEN',
    "blocking" BOOLEAN NOT NULL DEFAULT true,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "details" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "resolutionAction" TEXT,
    "resolutionReason" TEXT,

    CONSTRAINT "incidents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "volunteerId" TEXT NOT NULL,
    "incidentId" TEXT,
    "participantId" TEXT,
    "sessionId" TEXT,
    "action" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "previousState" TEXT,
    "newState" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drafts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "languageId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "drafts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "revoked_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "revoked_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_driverId_key" ON "users"("driverId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_userId_contestId_key" ON "sessions"("userId", "contestId");

-- CreateIndex
CREATE UNIQUE INDEX "problems_slug_key" ON "problems"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "hint_receipts_operationId_key" ON "hint_receipts"("operationId");

-- CreateIndex
CREATE UNIQUE INDEX "hint_receipts_contestId_userId_problemId_hintId_key" ON "hint_receipts"("contestId", "userId", "problemId", "hintId");

-- CreateIndex
CREATE INDEX "submissions_userId_problemId_idx" ON "submissions"("userId", "problemId");

-- CreateIndex
CREATE UNIQUE INDEX "incidents_eventId_key" ON "incidents"("eventId");

-- CreateIndex
CREATE INDEX "incidents_userId_status_idx" ON "incidents"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "drafts_userId_problemId_languageId_key" ON "drafts"("userId", "problemId", "languageId");

-- CreateIndex
CREATE UNIQUE INDEX "revoked_tokens_token_key" ON "revoked_tokens"("token");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_contestId_fkey" FOREIGN KEY ("contestId") REFERENCES "contests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "problems" ADD CONSTRAINT "problems_contestId_fkey" FOREIGN KEY ("contestId") REFERENCES "contests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_cases" ADD CONSTRAINT "test_cases_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "problems"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hints" ADD CONSTRAINT "hints_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "problems"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hint_receipts" ADD CONSTRAINT "hint_receipts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hint_receipts" ADD CONSTRAINT "hint_receipts_contestId_fkey" FOREIGN KEY ("contestId") REFERENCES "contests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hint_receipts" ADD CONSTRAINT "hint_receipts_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "problems"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hint_receipts" ADD CONSTRAINT "hint_receipts_hintId_fkey" FOREIGN KEY ("hintId") REFERENCES "hints"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "problems"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_volunteerId_fkey" FOREIGN KEY ("volunteerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "incidents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drafts" ADD CONSTRAINT "drafts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drafts" ADD CONSTRAINT "drafts_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "problems"("id") ON DELETE CASCADE ON UPDATE CASCADE;

