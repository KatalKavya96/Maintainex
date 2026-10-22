ALTER TABLE "Quest" ADD COLUMN "sourceUrl" TEXT,
ADD COLUMN "acceptanceCriteria" TEXT;

ALTER TABLE "UserQuest" ADD COLUMN "scheduledWorkId" TEXT,
ADD COLUMN "evidenceUrl" TEXT,
ADD COLUMN "completionNote" TEXT;

CREATE UNIQUE INDEX "UserQuest_scheduledWorkId_key" ON "UserQuest"("scheduledWorkId");
ALTER TABLE "UserQuest" ADD CONSTRAINT "UserQuest_scheduledWorkId_fkey"
FOREIGN KEY ("scheduledWorkId") REFERENCES "ScheduledWork"("id") ON DELETE SET NULL ON UPDATE CASCADE;
