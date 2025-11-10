-- CreateTable
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "subdomain" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "description" TEXT,
    "logo" TEXT,
    "website" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "plan" TEXT NOT NULL DEFAULT 'free',
    "planLimits" TEXT,
    "customSettings" TEXT,
    "stripeCustomerId" TEXT,
    "trialEndsAt" TIMESTAMP,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL
);

-- CreateTable
CREATE TABLE "tenant_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',
    "avatar" TEXT,
    "permissions" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "invitedBy" TEXT,
    "invitedAt" TIMESTAMP,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,
    CONSTRAINT "tenant_users_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tenant_user_sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "expiresAt" TIMESTAMP NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tenant_user_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "tenant_users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "bot_instances" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "qrCode" TEXT,
    "status" TEXT NOT NULL DEFAULT 'disconnected',
    "sessionData" TEXT,
    "config" TEXT,
    "lastActivity" TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,
    CONSTRAINT "bot_instances_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "bot_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "botInstanceId" TEXT NOT NULL,
    "jid" TEXT NOT NULL,
    "name" TEXT,
    "phone" TEXT,
    "avatar" TEXT,
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,
    "lastActivity" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,
    CONSTRAINT "bot_users_botInstanceId_fkey" FOREIGN KEY ("botInstanceId") REFERENCES "bot_instances" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "bot_groups" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "botInstanceId" TEXT NOT NULL,
    "jid" TEXT NOT NULL,
    "name" TEXT,
    "description" TEXT,
    "memberCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,
    CONSTRAINT "bot_groups_botInstanceId_fkey" FOREIGN KEY ("botInstanceId") REFERENCES "bot_instances" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "bot_messages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "botInstanceId" TEXT NOT NULL,
    "userId" TEXT,
    "messageId" TEXT NOT NULL,
    "fromJid" TEXT NOT NULL,
    "toJid" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT,
    "mediaUrl" TEXT,
    "command" TEXT,
    "isIncoming" BOOLEAN NOT NULL DEFAULT true,
    "timestamp" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "bot_messages_botInstanceId_fkey" FOREIGN KEY ("botInstanceId") REFERENCES "bot_instances" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "bot_messages_userId_fkey" FOREIGN KEY ("userId") REFERENCES "bot_users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tenant_subscriptions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "stripeSubscriptionId" TEXT NOT NULL,
    "stripePriceId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "currentPeriodStart" TIMESTAMP NOT NULL,
    "currentPeriodEnd" TIMESTAMP NOT NULL,
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "trialStart" TIMESTAMP,
    "trialEnd" TIMESTAMP,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,
    CONSTRAINT "tenant_subscriptions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tenant_payments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "stripePaymentId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "status" TEXT NOT NULL,
    "description" TEXT,
    "invoiceUrl" TEXT,
    "receiptUrl" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tenant_payments_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tenant_api_keys" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "keyPrefix" TEXT NOT NULL,
    "lastUsed" TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP,
    CONSTRAINT "tenant_api_keys_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tenant_analytics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "value" REAL NOT NULL,
    "metadata" TEXT,
    "date" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tenant_analytics_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "bot_analytics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "botInstanceId" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "value" REAL NOT NULL,
    "metadata" TEXT,
    "date" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "bot_analytics_botInstanceId_fkey" FOREIGN KEY ("botInstanceId") REFERENCES "bot_instances" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tenant_audit_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "resourceId" TEXT,
    "details" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tenant_audit_logs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "tenant_audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "tenant_users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_subdomain_key" ON "tenants"("subdomain");

-- CreateIndex
CREATE UNIQUE INDEX "tenants_email_key" ON "tenants"("email");

-- CreateIndex
CREATE UNIQUE INDEX "tenants_stripeCustomerId_key" ON "tenants"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_users_tenantId_email_key" ON "tenant_users"("tenantId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_user_sessions_sessionId_key" ON "tenant_user_sessions"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "bot_instances_tenantId_phoneNumber_key" ON "bot_instances"("tenantId", "phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "bot_users_botInstanceId_jid_key" ON "bot_users"("botInstanceId", "jid");

-- CreateIndex
CREATE UNIQUE INDEX "bot_groups_botInstanceId_jid_key" ON "bot_groups"("botInstanceId", "jid");

-- CreateIndex
CREATE UNIQUE INDEX "bot_messages_botInstanceId_messageId_key" ON "bot_messages"("botInstanceId", "messageId");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_subscriptions_stripeSubscriptionId_key" ON "tenant_subscriptions"("stripeSubscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_payments_stripePaymentId_key" ON "tenant_payments"("stripePaymentId");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_api_keys_keyHash_key" ON "tenant_api_keys"("keyHash");
