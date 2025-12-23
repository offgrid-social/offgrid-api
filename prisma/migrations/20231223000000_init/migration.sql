-- CreateEnum
CREATE TYPE "DeviceType" AS ENUM ('cli', 'web', 'mobile');

-- CreateTable
CREATE TABLE "Device" (
    "id" SERIAL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" "DeviceType" NOT NULL,
    "name" TEXT NOT NULL,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "UserShadow" (
    "userId" TEXT PRIMARY KEY,
    "username" TEXT,
    "email" TEXT,
    "role" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE UNIQUE INDEX "Device_userId_name_type_key" ON "Device"("userId", "name", "type");
CREATE INDEX "Device_userId_idx" ON "Device"("userId");
