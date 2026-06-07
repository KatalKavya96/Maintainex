CREATE TYPE "DataSource" AS ENUM ('MANUAL', 'GITHUB_SYNC', 'IMPORTED');
CREATE TYPE "ActivityReactionType" AS ENUM ('LIKE', 'FIRE', 'CLAP', 'EYES');
CREATE TYPE "ActivityShareTarget" AS ENUM ('COPY_LINK', 'X', 'LINKEDIN', 'OTHER');
CREATE TYPE "WebhookProcessingStatus" AS ENUM ('RECEIVED', 'PROCESSED', 'SKIPPED', 'FAILED');

ALTER TABLE "Activity" ADD COLUMN "source" "DataSource" NOT NULL DEFAULT 'MANUAL';
ALTER TABLE "Activity" ADD COLUMN "externalId" TEXT;
ALTER TABLE "Activity" ADD COLUMN "githubNodeId" TEXT;
ALTER TABLE "Activity" ADD COLUMN "syncedAt" TIMESTAMP(3);

ALTER TABLE "ScheduledWork" ADD COLUMN "source" "DataSource" NOT NULL DEFAULT 'MANUAL';
ALTER TABLE "ScheduledWork" ADD COLUMN "externalId" TEXT;
ALTER TABLE "ScheduledWork" ADD COLUMN "githubNodeId" TEXT;
ALTER TABLE "ScheduledWork" ADD COLUMN "syncedAt" TIMESTAMP(3);

ALTER TABLE "Organization" ADD COLUMN "source" "DataSource" NOT NULL DEFAULT 'MANUAL';
ALTER TABLE "Organization" ADD COLUMN "externalId" TEXT;
ALTER TABLE "Organization" ADD COLUMN "githubNodeId" TEXT;
ALTER TABLE "Organization" ADD COLUMN "syncedAt" TIMESTAMP(3);

ALTER TABLE "Repository" ADD COLUMN "source" "DataSource" NOT NULL DEFAULT 'MANUAL';
ALTER TABLE "Repository" ADD COLUMN "externalId" TEXT;
ALTER TABLE "Repository" ADD COLUMN "githubNodeId" TEXT;
ALTER TABLE "Repository" ADD COLUMN "syncedAt" TIMESTAMP(3);

ALTER TABLE "Pin" ADD COLUMN "source" "DataSource" NOT NULL DEFAULT 'MANUAL';
ALTER TABLE "Pin" ADD COLUMN "externalId" TEXT;
ALTER TABLE "Pin" ADD COLUMN "githubNodeId" TEXT;
ALTER TABLE "Pin" ADD COLUMN "syncedAt" TIMESTAMP(3);

CREATE INDEX "Activity_source_idx" ON "Activity"("source");
CREATE INDEX "Activity_externalId_idx" ON "Activity"("externalId");
CREATE INDEX "Activity_githubNodeId_idx" ON "Activity"("githubNodeId");
CREATE UNIQUE INDEX "Activity_userId_source_externalId_key" ON "Activity"("userId", "source", "externalId");

CREATE INDEX "ScheduledWork_source_idx" ON "ScheduledWork"("source");
CREATE INDEX "ScheduledWork_externalId_idx" ON "ScheduledWork"("externalId");
CREATE INDEX "ScheduledWork_githubNodeId_idx" ON "ScheduledWork"("githubNodeId");
CREATE UNIQUE INDEX "ScheduledWork_userId_source_externalId_key" ON "ScheduledWork"("userId", "source", "externalId");

CREATE INDEX "Organization_source_idx" ON "Organization"("source");
CREATE INDEX "Organization_externalId_idx" ON "Organization"("externalId");
CREATE INDEX "Organization_githubNodeId_idx" ON "Organization"("githubNodeId");
CREATE UNIQUE INDEX "Organization_userId_source_externalId_key" ON "Organization"("userId", "source", "externalId");

CREATE INDEX "Repository_source_idx" ON "Repository"("source");
CREATE INDEX "Repository_externalId_idx" ON "Repository"("externalId");
CREATE INDEX "Repository_githubNodeId_idx" ON "Repository"("githubNodeId");
CREATE UNIQUE INDEX "Repository_userId_source_externalId_key" ON "Repository"("userId", "source", "externalId");

CREATE INDEX "Pin_source_idx" ON "Pin"("source");
CREATE INDEX "Pin_externalId_idx" ON "Pin"("externalId");
CREATE INDEX "Pin_githubNodeId_idx" ON "Pin"("githubNodeId");
CREATE UNIQUE INDEX "Pin_userId_source_externalId_key" ON "Pin"("userId", "source", "externalId");

CREATE TABLE "GitHubIntegration" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "githubUserId" TEXT NOT NULL,
  "login" TEXT NOT NULL,
  "accessTokenEncrypted" TEXT NOT NULL,
  "tokenType" TEXT,
  "scope" TEXT,
  "lastSyncedAt" TIMESTAMP(3),
  "syncCursor" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "GitHubIntegration_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GitHubIntegration_userId_key" ON "GitHubIntegration"("userId");
CREATE UNIQUE INDEX "GitHubIntegration_githubUserId_key" ON "GitHubIntegration"("githubUserId");
CREATE INDEX "GitHubIntegration_login_idx" ON "GitHubIntegration"("login");
ALTER TABLE "GitHubIntegration" ADD CONSTRAINT "GitHubIntegration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "GitHubWebhookDelivery" (
  "id" TEXT NOT NULL,
  "deliveryId" TEXT NOT NULL,
  "event" TEXT NOT NULL,
  "action" TEXT,
  "status" "WebhookProcessingStatus" NOT NULL DEFAULT 'RECEIVED',
  "error" TEXT,
  "payload" JSONB,
  "processedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GitHubWebhookDelivery_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GitHubWebhookDelivery_deliveryId_key" ON "GitHubWebhookDelivery"("deliveryId");
CREATE INDEX "GitHubWebhookDelivery_event_idx" ON "GitHubWebhookDelivery"("event");
CREATE INDEX "GitHubWebhookDelivery_status_idx" ON "GitHubWebhookDelivery"("status");
CREATE INDEX "GitHubWebhookDelivery_createdAt_idx" ON "GitHubWebhookDelivery"("createdAt");

CREATE TABLE "ActivityReaction" (
  "id" TEXT NOT NULL,
  "activityId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" "ActivityReactionType" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ActivityReaction_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ActivityReaction_activityId_userId_type_key" ON "ActivityReaction"("activityId", "userId", "type");
CREATE INDEX "ActivityReaction_activityId_idx" ON "ActivityReaction"("activityId");
CREATE INDEX "ActivityReaction_userId_idx" ON "ActivityReaction"("userId");
ALTER TABLE "ActivityReaction" ADD CONSTRAINT "ActivityReaction_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ActivityReaction" ADD CONSTRAINT "ActivityReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ActivityComment" (
  "id" TEXT NOT NULL,
  "activityId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "deletedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ActivityComment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ActivityComment_activityId_idx" ON "ActivityComment"("activityId");
CREATE INDEX "ActivityComment_userId_idx" ON "ActivityComment"("userId");
CREATE INDEX "ActivityComment_createdAt_idx" ON "ActivityComment"("createdAt");
ALTER TABLE "ActivityComment" ADD CONSTRAINT "ActivityComment_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ActivityComment" ADD CONSTRAINT "ActivityComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ActivityBookmark" (
  "activityId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ActivityBookmark_pkey" PRIMARY KEY ("activityId", "userId")
);

CREATE INDEX "ActivityBookmark_userId_idx" ON "ActivityBookmark"("userId");
ALTER TABLE "ActivityBookmark" ADD CONSTRAINT "ActivityBookmark_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ActivityBookmark" ADD CONSTRAINT "ActivityBookmark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ActivityShare" (
  "id" TEXT NOT NULL,
  "activityId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "target" "ActivityShareTarget" NOT NULL DEFAULT 'COPY_LINK',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ActivityShare_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ActivityShare_activityId_idx" ON "ActivityShare"("activityId");
CREATE INDEX "ActivityShare_userId_idx" ON "ActivityShare"("userId");
CREATE INDEX "ActivityShare_createdAt_idx" ON "ActivityShare"("createdAt");
ALTER TABLE "ActivityShare" ADD CONSTRAINT "ActivityShare_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ActivityShare" ADD CONSTRAINT "ActivityShare_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
