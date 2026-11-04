-- AlterTable
ALTER TABLE "ScheduledWork" ADD COLUMN     "userEditedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Activity" ADD COLUMN     "userEditedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "GitHubIntegration" ADD COLUMN     "autoSync" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "importAssignedIssues" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "importComments" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "importIssues" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "importPullRequests" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "importRepositories" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "importReviews" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "lastSyncError" TEXT,
ADD COLUMN     "needsReconnect" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "syncStartedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "SyncTombstone" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "source" "DataSource" NOT NULL,
    "externalId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SyncTombstone_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SyncTombstone_userId_idx" ON "SyncTombstone"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SyncTombstone_userId_source_externalId_key" ON "SyncTombstone"("userId", "source", "externalId");

-- AddForeignKey
ALTER TABLE "SyncTombstone" ADD CONSTRAINT "SyncTombstone_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

