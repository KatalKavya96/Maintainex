-- Public profile fields for existing and new users.
ALTER TABLE "User" ADD COLUMN "username" TEXT;
UPDATE "User"
SET "username" = LOWER(REGEXP_REPLACE("name", '[^a-zA-Z0-9]+', '-', 'g')) || '-' || SUBSTRING("id", 1, 6)
WHERE "username" IS NULL;
ALTER TABLE "User" ALTER COLUMN "username" SET NOT NULL;
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

ALTER TABLE "User" ADD COLUMN "bio" TEXT;
ALTER TABLE "User" ADD COLUMN "githubUrl" TEXT;
ALTER TABLE "User" ADD COLUMN "linkedinUrl" TEXT;
ALTER TABLE "User" ADD COLUMN "portfolioUrl" TEXT;
ALTER TABLE "User" ADD COLUMN "skills" JSONB;
ALTER TABLE "User" ADD COLUMN "mainOrganizations" JSONB;

-- Follow graph.
CREATE TABLE "Follow" (
  "followerId" TEXT NOT NULL,
  "followingId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Follow_pkey" PRIMARY KEY ("followerId", "followingId")
);

CREATE INDEX "Follow_followingId_idx" ON "Follow"("followingId");
ALTER TABLE "Follow" ADD CONSTRAINT "Follow_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Follow" ADD CONSTRAINT "Follow_followingId_fkey" FOREIGN KEY ("followingId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Goals.
CREATE TYPE "GoalMetric" AS ENUM ('PR_RAISED', 'PR_REVIEWED', 'ISSUE_RAISED', 'ISSUE_CLOSED', 'REPO_CONTRIBUTIONS', 'TOTAL_ACTIVITY', 'STREAK');
CREATE TYPE "GoalPeriod" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY', 'CUSTOM');

CREATE TABLE "Goal" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "metric" "GoalMetric" NOT NULL,
  "target" INTEGER NOT NULL,
  "period" "GoalPeriod" NOT NULL DEFAULT 'MONTHLY',
  "startsAt" TIMESTAMP(3),
  "endsAt" TIMESTAMP(3),
  "isCompleted" BOOLEAN NOT NULL DEFAULT false,
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Goal_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Goal_userId_idx" ON "Goal"("userId");
CREATE INDEX "Goal_metric_idx" ON "Goal"("metric");
CREATE INDEX "Goal_period_idx" ON "Goal"("period");
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Notifications.
CREATE TYPE "NotificationType" AS ENUM ('SYSTEM', 'SOCIAL', 'GOAL', 'SCHEDULE', 'BADGE', 'REMINDER');

CREATE TABLE "Notification" (
  "id" TEXT NOT NULL,
  "recipientId" TEXT NOT NULL,
  "actorId" TEXT,
  "type" "NotificationType" NOT NULL DEFAULT 'SYSTEM',
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "metadata" JSONB,
  "readAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Notification_recipientId_idx" ON "Notification"("recipientId");
CREATE INDEX "Notification_actorId_idx" ON "Notification"("actorId");
CREATE INDEX "Notification_type_idx" ON "Notification"("type");
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
