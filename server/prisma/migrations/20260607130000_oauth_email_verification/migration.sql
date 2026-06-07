CREATE TYPE "AuthProvider" AS ENUM ('GOOGLE', 'GITHUB');

ALTER TABLE "User" ADD COLUMN "passwordSetAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "emailVerifiedAt" TIMESTAMP(3);
UPDATE "User" SET "passwordSetAt" = CURRENT_TIMESTAMP WHERE "passwordHash" IS NOT NULL AND "passwordSetAt" IS NULL;

CREATE TABLE "AuthAccount" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "provider" "AuthProvider" NOT NULL,
  "providerAccountId" TEXT NOT NULL,
  "providerEmail" TEXT,
  "accessTokenEncrypted" TEXT,
  "refreshTokenEncrypted" TEXT,
  "expiresAt" TIMESTAMP(3),
  "scope" TEXT,
  "tokenType" TEXT,
  "profile" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AuthAccount_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AuthAccount_provider_providerAccountId_key" ON "AuthAccount"("provider", "providerAccountId");
CREATE UNIQUE INDEX "AuthAccount_userId_provider_key" ON "AuthAccount"("userId", "provider");
CREATE INDEX "AuthAccount_userId_idx" ON "AuthAccount"("userId");
CREATE INDEX "AuthAccount_providerEmail_idx" ON "AuthAccount"("providerEmail");
ALTER TABLE "AuthAccount" ADD CONSTRAINT "AuthAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "EmailVerificationOtp" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "codeHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "consumedAt" TIMESTAMP(3),
  "attemptCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EmailVerificationOtp_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "EmailVerificationOtp_userId_idx" ON "EmailVerificationOtp"("userId");
CREATE INDEX "EmailVerificationOtp_expiresAt_idx" ON "EmailVerificationOtp"("expiresAt");
CREATE INDEX "EmailVerificationOtp_consumedAt_idx" ON "EmailVerificationOtp"("consumedAt");
ALTER TABLE "EmailVerificationOtp" ADD CONSTRAINT "EmailVerificationOtp_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
