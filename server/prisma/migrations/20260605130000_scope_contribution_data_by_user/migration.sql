DO $$
DECLARE
  owner_id TEXT;
BEGIN
  SELECT "id" INTO owner_id FROM "User" WHERE "role" = 'ADMIN' ORDER BY "createdAt" ASC LIMIT 1;

  IF owner_id IS NULL THEN
    SELECT "id" INTO owner_id FROM "User" ORDER BY "createdAt" ASC LIMIT 1;
  END IF;

  IF owner_id IS NULL THEN
    INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "createdAt", "updatedAt")
    VALUES ('migration-owner', 'Migration Owner', 'migration-owner@maintainex.local', 'not-usable', 'ADMIN', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT ("email") DO NOTHING;

    SELECT "id" INTO owner_id FROM "User" WHERE "email" = 'migration-owner@maintainex.local' LIMIT 1;
  END IF;

  ALTER TABLE "Organization" ADD COLUMN "userId" TEXT;
  ALTER TABLE "Repository" ADD COLUMN "userId" TEXT;
  ALTER TABLE "Activity" ADD COLUMN "userId" TEXT;

  UPDATE "Organization" SET "userId" = owner_id WHERE "userId" IS NULL;
  UPDATE "Repository" SET "userId" = owner_id WHERE "userId" IS NULL;
  UPDATE "Activity" SET "userId" = owner_id WHERE "userId" IS NULL;

  ALTER TABLE "Organization" ALTER COLUMN "userId" SET NOT NULL;
  ALTER TABLE "Repository" ALTER COLUMN "userId" SET NOT NULL;
  ALTER TABLE "Activity" ALTER COLUMN "userId" SET NOT NULL;
END $$;

DROP INDEX IF EXISTS "Organization_name_key";
DROP INDEX IF EXISTS "Repository_organizationId_name_key";

CREATE UNIQUE INDEX "Organization_userId_name_key" ON "Organization"("userId", "name");
CREATE UNIQUE INDEX "Repository_userId_organizationId_name_key" ON "Repository"("userId", "organizationId", "name");

CREATE INDEX "Organization_userId_idx" ON "Organization"("userId");
CREATE INDEX "Repository_userId_idx" ON "Repository"("userId");
CREATE INDEX "Activity_userId_idx" ON "Activity"("userId");

ALTER TABLE "Organization" ADD CONSTRAINT "Organization_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Repository" ADD CONSTRAINT "Repository_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
