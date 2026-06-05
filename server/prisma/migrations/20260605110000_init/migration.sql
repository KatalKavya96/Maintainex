CREATE TYPE "ActivityType" AS ENUM (
  'PR_REVIEWED',
  'PR_RAISED',
  'ISSUE_RAISED',
  'PR_CLOSED',
  'ISSUE_CLOSED',
  'COMMENTED',
  'MERGED',
  'OTHER'
);

CREATE TYPE "ActivityStatus" AS ENUM (
  'OPEN',
  'CLOSED',
  'MERGED',
  'REVIEWED',
  'APPROVED',
  'CHANGES_REQUESTED',
  'COMMENTED',
  'DRAFT',
  'OTHER'
);

CREATE TYPE "ReviewType" AS ENUM (
  'COMMENTED',
  'APPROVED',
  'CHANGES_REQUESTED',
  'REQUESTED_REVIEW',
  'NOT_APPLICABLE'
);

CREATE TYPE "ClosingReason" AS ENUM (
  'DUPLICATE',
  'STALE',
  'INVALID',
  'COMPLETED',
  'FIXED_IN_ANOTHER_PR',
  'NOT_REPRODUCIBLE',
  'AUTHOR_CLOSED',
  'MAINTAINER_CLOSED',
  'NOT_APPLICABLE',
  'OTHER'
);

CREATE TYPE "UserRole" AS ENUM (
  'ADMIN',
  'VIEWER'
);

CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "role" "UserRole" NOT NULL DEFAULT 'VIEWER',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Organization" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "website" TEXT,
  "githubUrl" TEXT,
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Repository" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "githubUrl" TEXT,
  "description" TEXT,
  "primaryTechStack" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Repository_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Activity" (
  "id" TEXT NOT NULL,
  "date" TIMESTAMP(3) NOT NULL,
  "activityType" "ActivityType" NOT NULL,
  "title" TEXT NOT NULL,
  "number" TEXT,
  "link" TEXT,
  "status" "ActivityStatus" NOT NULL DEFAULT 'OTHER',
  "reviewType" "ReviewType" NOT NULL DEFAULT 'NOT_APPLICABLE',
  "closingReason" "ClosingReason" NOT NULL DEFAULT 'NOT_APPLICABLE',
  "description" TEXT,
  "notes" TEXT,
  "tags" JSONB,
  "organizationId" TEXT,
  "repositoryId" TEXT,
  "organizationNameSnapshot" TEXT NOT NULL,
  "repositoryNameSnapshot" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "Organization_name_key" ON "Organization"("name");
CREATE UNIQUE INDEX "Repository_organizationId_name_key" ON "Repository"("organizationId", "name");

CREATE INDEX "Activity_date_idx" ON "Activity"("date");
CREATE INDEX "Activity_activityType_idx" ON "Activity"("activityType");
CREATE INDEX "Activity_organizationId_idx" ON "Activity"("organizationId");
CREATE INDEX "Activity_repositoryId_idx" ON "Activity"("repositoryId");
CREATE INDEX "Repository_organizationId_idx" ON "Repository"("organizationId");

ALTER TABLE "Repository" ADD CONSTRAINT "Repository_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "Repository"("id") ON DELETE SET NULL ON UPDATE CASCADE;
