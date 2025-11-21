/*
  Warnings:

  - You are about to drop the column `category` on the `bot_settings` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `bot_settings` table. All the data in the column will be lost.
  - You are about to drop the column `key` on the `bot_settings` table. All the data in the column will be lost.
  - You are about to drop the column `updatedBy` on the `bot_settings` table. All the data in the column will be lost.
  - You are about to drop the column `value` on the `bot_settings` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[botInstanceId]` on the table `bot_settings` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `botInstanceId` to the `bot_settings` table without a default value. This is not possible if the table is not empty.

*/
-- AlterExtension
ALTER EXTENSION "vector" UPDATE TO "0.8.1";

-- DropIndex
DROP INDEX "bot_settings_key_key";

-- AlterTable
ALTER TABLE "bot_settings" DROP COLUMN "category",
DROP COLUMN "description",
DROP COLUMN "key",
DROP COLUMN "updatedBy",
DROP COLUMN "value",
ADD COLUMN     "botInstanceId" TEXT NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "menuEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "welcomeMessage" TEXT;

-- AlterTable
ALTER TABLE "tenant_subscriptions" ADD COLUMN     "planId" TEXT;

-- CreateTable
CREATE TABLE "bot_settings_kv" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "updatedBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bot_settings_kv_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plans" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "aiRequestsPerMonth" INTEGER NOT NULL DEFAULT 0,
    "messagesPerDay" INTEGER NOT NULL DEFAULT 100,
    "mediaGensPerDay" INTEGER NOT NULL DEFAULT 0,
    "maxBots" INTEGER NOT NULL DEFAULT 1,
    "enableRAG" BOOLEAN NOT NULL DEFAULT false,
    "enableVideo" BOOLEAN NOT NULL DEFAULT false,
    "enableAIChat" BOOLEAN NOT NULL DEFAULT false,
    "enableImageGen" BOOLEAN NOT NULL DEFAULT false,
    "enableAdvancedTools" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usage_counters" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "aiRequests" INTEGER NOT NULL DEFAULT 0,
    "messages" INTEGER NOT NULL DEFAULT 0,
    "mediaGens" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usage_counters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bot_templates" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "welcomeMessage" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bot_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bot_template_menu_items" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bot_template_menu_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bot_settings_menu_items" (
    "id" TEXT NOT NULL,
    "settingsId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bot_settings_menu_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bot_settings_kv_key_key" ON "bot_settings_kv"("key");

-- CreateIndex
CREATE UNIQUE INDEX "plans_code_key" ON "plans"("code");

-- CreateIndex
CREATE UNIQUE INDEX "usage_counters_tenantId_period_key" ON "usage_counters"("tenantId", "period");

-- CreateIndex
CREATE UNIQUE INDEX "bot_settings_botInstanceId_key" ON "bot_settings"("botInstanceId");

-- AddForeignKey
ALTER TABLE "tenant_subscriptions" ADD CONSTRAINT "tenant_subscriptions_planId_fkey" FOREIGN KEY ("planId") REFERENCES "plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_counters" ADD CONSTRAINT "usage_counters_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bot_templates" ADD CONSTRAINT "bot_templates_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bot_template_menu_items" ADD CONSTRAINT "bot_template_menu_items_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "bot_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bot_settings" ADD CONSTRAINT "bot_settings_botInstanceId_fkey" FOREIGN KEY ("botInstanceId") REFERENCES "bot_instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bot_settings_menu_items" ADD CONSTRAINT "bot_settings_menu_items_settingsId_fkey" FOREIGN KEY ("settingsId") REFERENCES "bot_settings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
