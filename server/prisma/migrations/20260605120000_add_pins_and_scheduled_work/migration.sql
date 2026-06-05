CREATE TYPE "PinCategory" AS ENUM (
  'REPOSITORY',
  'ISSUE',
  'PULL_REQUEST',
  'DOCUMENTATION',
  'PROJECT_BOARD',
  'ORGANIZATION',
  'WEBSITE',
  'OTHER'
);

CREATE TYPE "ScheduledWorkType" AS ENUM (
  'PR_REVIEW',
  'ISSUE_WORK',
  'PR_TO_RAISE',
  'ISSUE_TO_RAISE',
  'BUG_FIX',
  'FEATURE_BUILD',
  'DOCUMENTATION',
  'TESTING',
  'OTHER'
);

CREATE TYPE "ScheduledWorkStatus" AS ENUM (
  'PLANNED',
  'IN_PROGRESS',
  'BLOCKED',
  'DONE',
  'CANCELLED',
  'POSTPONED'
);

CREATE TYPE "Priority" AS ENUM (
  'LOW',
  'MEDIUM',
  'HIGH',
  'URGENT'
);

CREATE TYPE "WorkDifficulty" AS ENUM (
  'EASY',
  'MEDIUM',
  'HARD'
);

CREATE TABLE "Pin" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "description" TEXT,
  "category" "PinCategory" NOT NULL DEFAULT 'WEBSITE',
  "customCategory" TEXT,
  "iconUrl" TEXT,
  "faviconUrl" TEXT,
  "imageUrl" TEXT,
  "isFavorite" BOOLEAN NOT NULL DEFAULT false,
  "isArchived" BOOLEAN NOT NULL DEFAULT false,
  "tags" JSONB,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "lastOpenedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Pin_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ScheduledWork" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "type" "ScheduledWorkType" NOT NULL,
  "status" "ScheduledWorkStatus" NOT NULL DEFAULT 'PLANNED',
  "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
  "organizationName" TEXT NOT NULL,
  "repositoryName" TEXT NOT NULL,
  "itemNumber" INTEGER,
  "itemUrl" TEXT,
  "assignedToMe" BOOLEAN NOT NULL DEFAULT false,
  "assignedSince" TIMESTAMP(3),
  "startDate" TIMESTAMP(3),
  "dueDate" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "estimatedHours" DOUBLE PRECISION,
  "actualHours" DOUBLE PRECISION,
  "labels" JSONB,
  "tags" JSONB,
  "difficulty" "WorkDifficulty",
  "context" TEXT,
  "plan" TEXT,
  "blockers" TEXT,
  "closingNotes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ScheduledWork_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Pin_userId_idx" ON "Pin"("userId");
CREATE INDEX "Pin_category_idx" ON "Pin"("category");
CREATE INDEX "Pin_isFavorite_idx" ON "Pin"("isFavorite");
CREATE INDEX "Pin_createdAt_idx" ON "Pin"("createdAt");

CREATE INDEX "ScheduledWork_userId_idx" ON "ScheduledWork"("userId");
CREATE INDEX "ScheduledWork_status_idx" ON "ScheduledWork"("status");
CREATE INDEX "ScheduledWork_priority_idx" ON "ScheduledWork"("priority");
CREATE INDEX "ScheduledWork_type_idx" ON "ScheduledWork"("type");
CREATE INDEX "ScheduledWork_dueDate_idx" ON "ScheduledWork"("dueDate");
CREATE INDEX "ScheduledWork_assignedToMe_idx" ON "ScheduledWork"("assignedToMe");

ALTER TABLE "Pin" ADD CONSTRAINT "Pin_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ScheduledWork" ADD CONSTRAINT "ScheduledWork_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
