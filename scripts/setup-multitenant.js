#!/usr/bin/env node

/**
 * Multi-tenant WhatsDeX Setup Script
 * This script initializes the multi-tenant SaaS platform
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Dynamic imports to handle potential missing files
let multiTenantStripeService, logger;

try {
  const { default: stripeService } = await import('../src/services/multiTenantStripeService.js');
  multiTenantStripeService = stripeService;
} catch (error) {
  console.log('   ⚠️  Stripe service not available:', error.message);
}

try {
  const { default: loggerService } = await import('../src/utils/logger.js');
  logger = loggerService;
} catch (error) {
  logger = console; // Fallback to console
}

const prisma = new PrismaClient();

async function setupMultiTenant() {
  try {
    console.log('🚀 Setting up Multi-tenant WhatsDeX SaaS Platform...\n');

    // 1. Run database migrations
    console.log('📊 Setting up database...');
    await runMigrations();

    // 2. Initialize Stripe (if configured)
    console.log('💳 Initializing Stripe...');
    await initializeStripe();

    // 3. Create demo tenant
    console.log('🏢 Creating demo tenant...');
    await createDemoTenant();

    // 4. Setup environment
    console.log('⚙️  Checking environment setup...');
    await checkEnvironment();

    console.log('\n✅ Multi-tenant setup completed successfully!');
    console.log('\n📋 Next Steps:');
    console.log('   1. Update your environment variables:');
    console.log('      - STRIPE_SECRET_KEY (for payments)');
    console.log('      - STRIPE_WEBHOOK_SECRET (for webhooks)');
    console.log('      - JWT_SECRET (for authentication)');
    console.log('      - DATABASE_URL (if using different database)');
    console.log('\n   2. Start the development server:');
    console.log('      npm run dev:full');
    console.log('\n   3. Access the demo:');
    console.log('      Frontend: http://localhost:3000');
    console.log('      Login with: admin@demo.com / password123');
    console.log('      Subdomain: demo');
    console.log('\n   4. Test the registration:');
    console.log('      http://localhost:3000/register');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function runMigrations() {
  try {
    // Check if database exists and is accessible
    await prisma.$connect();
    console.log('   ✓ Database connection established');

    // Check if tables exist (simple check)
    const tableExists = await prisma.$queryRaw`
      SELECT name FROM sqlite_master WHERE type='table' AND name='tenants';
    `;

    if (tableExists.length === 0) {
      console.log('   ⚠️  Tables not found. Please run: npx prisma migrate dev');
      console.log('   ⚠️  Then run: npx prisma generate');
    } else {
      console.log('   ✓ Database tables found');
    }

  } catch (error) {
    console.log('   ⚠️  Database setup needed. Run: npx prisma migrate dev');
  }
}

async function initializeStripe() {
  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (stripeSecretKey) {
      await multiTenantStripeService.initialize(stripeSecretKey, stripeWebhookSecret);
      console.log('   ✓ Stripe initialized successfully');
    } else {
      console.log('   ⚠️  Stripe not configured (STRIPE_SECRET_KEY missing)');
      console.log('   ℹ️  Add STRIPE_SECRET_KEY to enable payments');
    }
  } catch (error) {
    console.log('   ⚠️  Stripe initialization failed:', error.message);
    console.log('   ℹ️  Payment features will be disabled');
  }
}

async function createDemoTenant() {
  try {
    // Check if demo tenant already exists
    const existingTenant = await prisma.tenant.findUnique({
      where: { subdomain: 'demo' }
    });

    if (existingTenant) {
      console.log('   ✓ Demo tenant already exists');
      return;
    }

    // Create demo tenant
    const demoTenant = await prisma.tenant.create({
      data: {
        name: 'Demo Company',
        subdomain: 'demo',
        email: 'admin@demo.com',
        description: 'Demo tenant for testing WhatsDeX multi-tenant features',
        status: 'active',
        plan: 'basic',
        planLimits: JSON.stringify({
          maxBots: 3,
          maxUsers: 10,
          maxMessages: 5000,
          maxApiCalls: 1000,
          aiRequests: 500
        })
      }
    });

    // Create demo admin user
    const passwordHash = await bcrypt.hash('password123', 12);
    const demoUser = await prisma.tenantUser.create({
      data: {
        tenantId: demoTenant.id,
        email: 'admin@demo.com',
        name: 'Demo Admin',
        passwordHash,
        role: 'admin',
        isActive: true,
        emailVerified: true
      }
    });

    // Create demo bot instance
    const demoBotInstance = await prisma.botInstance.create({
      data: {
        tenantId: demoTenant.id,
        name: 'Demo WhatsApp Bot',
        status: 'disconnected',
        config: JSON.stringify({
          welcomeMessage: 'Hello! Welcome to our demo WhatsApp bot. How can I help you today?',
          aiEnabled: true,
          defaultLanguage: 'en',
          features: ['auto-reply', 'ai-chat', 'media-support']
        })
      }
    });

    console.log('   ✓ Demo tenant created successfully');
    console.log(`   📧 Demo login: admin@demo.com / password123`);
    console.log(`   🏢 Demo subdomain: demo`);

  } catch (error) {
    if (error.code === 'P2002') {
      console.log('   ✓ Demo tenant already exists');
    } else {
      throw error;
    }
  }
}

async function checkEnvironment() {
  const requiredEnvVars = [
    'JWT_SECRET',
    'DATABASE_URL'
  ];

  const optionalEnvVars = [
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'
  ];

  console.log('   Required environment variables:');
  for (const envVar of requiredEnvVars) {
    if (process.env[envVar]) {
      console.log(`     ✓ ${envVar}`);
    } else {
      console.log(`     ❌ ${envVar} (required)`);
    }
  }

  console.log('   Optional environment variables:');
  for (const envVar of optionalEnvVars) {
    if (process.env[envVar]) {
      console.log(`     ✓ ${envVar}`);
    } else {
      console.log(`     ⚠️  ${envVar} (for full functionality)`);
    }
  }
}

// Run the setup
if (import.meta.url === `file://${process.argv[1]}`) {
  setupMultiTenant();
}

export default setupMultiTenant;