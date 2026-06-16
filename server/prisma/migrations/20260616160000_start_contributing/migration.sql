ALTER TABLE "User" ADD COLUMN "avatarUrl" TEXT;
ALTER TABLE "User" ADD COLUMN "githubUsername" TEXT;
ALTER TABLE "User" ADD COLUMN "githubId" TEXT;

ALTER TABLE "Organization" ADD COLUMN "slug" TEXT;
ALTER TABLE "Organization" ADD COLUMN "logoUrl" TEXT;
ALTER TABLE "Organization" ADD COLUMN "websiteUrl" TEXT;
ALTER TABLE "Organization" ADD COLUMN "category" TEXT;
ALTER TABLE "Organization" ADD COLUMN "techStack" JSONB;
ALTER TABLE "Organization" ADD COLUMN "maintianexScore" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Organization" ADD COLUMN "beginnerFriendlyScore" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Organization" ADD COLUMN "reputationScore" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Organization" ADD COLUMN "activityScore" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Organization" ADD COLUMN "reviewSpeedScore" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "Repository" ADD COLUMN "githubRepoId" TEXT;
ALTER TABLE "Repository" ADD COLUMN "slug" TEXT;
ALTER TABLE "Repository" ADD COLUMN "fullName" TEXT;
ALTER TABLE "Repository" ADD COLUMN "primaryLanguage" TEXT;
ALTER TABLE "Repository" ADD COLUMN "license" TEXT;
ALTER TABLE "Repository" ADD COLUMN "stars" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Repository" ADD COLUMN "forks" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Repository" ADD COLUMN "watchers" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Repository" ADD COLUMN "openIssues" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Repository" ADD COLUMN "techStack" JSONB;
ALTER TABLE "Repository" ADD COLUMN "activityScore" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Repository" ADD COLUMN "difficultyScore" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Repository" ADD COLUMN "beginnerFriendlyScore" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Repository" ADD COLUMN "maintianexScore" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "ProgramParticipation" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "programName" TEXT NOT NULL,
  "year" INTEGER NOT NULL,
  "sourceUrl" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ProgramParticipation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Contribution" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "repositoryId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "url" TEXT,
  "githubNodeId" TEXT,
  "githubId" TEXT,
  "state" TEXT,
  "points" INTEGER NOT NULL DEFAULT 0,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Contribution_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Quest" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "repositoryId" TEXT,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "difficulty" TEXT NOT NULL,
  "points" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Quest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserQuest" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "questId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'STARTED',
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "UserQuest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SavedOpportunity" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "organizationId" TEXT,
  "repositoryId" TEXT,
  "questId" TEXT,
  "externalUrl" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "SavedOpportunity_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Collection" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "itemCount" INTEGER NOT NULL DEFAULT 0,
  "logoUrls" JSONB,
  "saveCount" INTEGER NOT NULL DEFAULT 0,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Collection_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ScoreEvent" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "organizationId" TEXT,
  "repositoryId" TEXT,
  "contributionId" TEXT,
  "type" TEXT NOT NULL,
  "basePoints" INTEGER NOT NULL DEFAULT 0,
  "multiplier" DOUBLE PRECISION NOT NULL DEFAULT 1,
  "finalPoints" INTEGER NOT NULL DEFAULT 0,
  "reason" TEXT NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ScoreEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_githubId_key" ON "User"("githubId");
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");
CREATE INDEX "Organization_category_idx" ON "Organization"("category");
CREATE INDEX "Repository_slug_idx" ON "Repository"("slug");
CREATE INDEX "Repository_primaryLanguage_idx" ON "Repository"("primaryLanguage");

CREATE UNIQUE INDEX "ProgramParticipation_organizationId_programName_year_key" ON "ProgramParticipation"("organizationId", "programName", "year");
CREATE INDEX "ProgramParticipation_organizationId_idx" ON "ProgramParticipation"("organizationId");
CREATE INDEX "ProgramParticipation_programName_idx" ON "ProgramParticipation"("programName");
CREATE INDEX "ProgramParticipation_year_idx" ON "ProgramParticipation"("year");

CREATE INDEX "Contribution_userId_idx" ON "Contribution"("userId");
CREATE INDEX "Contribution_organizationId_idx" ON "Contribution"("organizationId");
CREATE INDEX "Contribution_repositoryId_idx" ON "Contribution"("repositoryId");
CREATE INDEX "Contribution_type_idx" ON "Contribution"("type");
CREATE INDEX "Contribution_githubNodeId_idx" ON "Contribution"("githubNodeId");
CREATE INDEX "Contribution_githubId_idx" ON "Contribution"("githubId");

CREATE INDEX "Quest_organizationId_idx" ON "Quest"("organizationId");
CREATE INDEX "Quest_repositoryId_idx" ON "Quest"("repositoryId");
CREATE INDEX "Quest_type_idx" ON "Quest"("type");
CREATE INDEX "Quest_difficulty_idx" ON "Quest"("difficulty");
CREATE INDEX "Quest_isActive_idx" ON "Quest"("isActive");

CREATE UNIQUE INDEX "UserQuest_userId_questId_key" ON "UserQuest"("userId", "questId");
CREATE INDEX "UserQuest_userId_idx" ON "UserQuest"("userId");
CREATE INDEX "UserQuest_questId_idx" ON "UserQuest"("questId");
CREATE INDEX "UserQuest_status_idx" ON "UserQuest"("status");

CREATE UNIQUE INDEX "SavedOpportunity_userId_type_organizationId_repositoryId_questId_externalUrl_key" ON "SavedOpportunity"("userId", "type", "organizationId", "repositoryId", "questId", "externalUrl");
CREATE INDEX "SavedOpportunity_userId_idx" ON "SavedOpportunity"("userId");
CREATE INDEX "SavedOpportunity_type_idx" ON "SavedOpportunity"("type");
CREATE INDEX "SavedOpportunity_organizationId_idx" ON "SavedOpportunity"("organizationId");
CREATE INDEX "SavedOpportunity_repositoryId_idx" ON "SavedOpportunity"("repositoryId");
CREATE INDEX "SavedOpportunity_questId_idx" ON "SavedOpportunity"("questId");

CREATE INDEX "Collection_type_idx" ON "Collection"("type");
CREATE INDEX "Collection_updatedAt_idx" ON "Collection"("updatedAt");

CREATE INDEX "ScoreEvent_userId_idx" ON "ScoreEvent"("userId");
CREATE INDEX "ScoreEvent_organizationId_idx" ON "ScoreEvent"("organizationId");
CREATE INDEX "ScoreEvent_repositoryId_idx" ON "ScoreEvent"("repositoryId");
CREATE INDEX "ScoreEvent_contributionId_idx" ON "ScoreEvent"("contributionId");
CREATE INDEX "ScoreEvent_type_idx" ON "ScoreEvent"("type");
CREATE INDEX "ScoreEvent_createdAt_idx" ON "ScoreEvent"("createdAt");

ALTER TABLE "ProgramParticipation" ADD CONSTRAINT "ProgramParticipation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Contribution" ADD CONSTRAINT "Contribution_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Contribution" ADD CONSTRAINT "Contribution_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Contribution" ADD CONSTRAINT "Contribution_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "Repository"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Quest" ADD CONSTRAINT "Quest_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Quest" ADD CONSTRAINT "Quest_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "Repository"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "UserQuest" ADD CONSTRAINT "UserQuest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserQuest" ADD CONSTRAINT "UserQuest_questId_fkey" FOREIGN KEY ("questId") REFERENCES "Quest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SavedOpportunity" ADD CONSTRAINT "SavedOpportunity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SavedOpportunity" ADD CONSTRAINT "SavedOpportunity_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SavedOpportunity" ADD CONSTRAINT "SavedOpportunity_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "Repository"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SavedOpportunity" ADD CONSTRAINT "SavedOpportunity_questId_fkey" FOREIGN KEY ("questId") REFERENCES "Quest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ScoreEvent" ADD CONSTRAINT "ScoreEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ScoreEvent" ADD CONSTRAINT "ScoreEvent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ScoreEvent" ADD CONSTRAINT "ScoreEvent_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "Repository"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ScoreEvent" ADD CONSTRAINT "ScoreEvent_contributionId_fkey" FOREIGN KEY ("contributionId") REFERENCES "Contribution"("id") ON DELETE SET NULL ON UPDATE CASCADE;
