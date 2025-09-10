#!/usr/bin/env node

/**
 * WhatsDeX Secret Migration Script
 * Safely migrates from insecure to secure configuration
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class SecretMigrator {
  constructor() {
    this.projectRoot = path.join(__dirname, '..');
    this.envPath = path.join(this.projectRoot, '.env');
    this.envExamplePath = path.join(this.projectRoot, '.env.example');
    this.backupPath = path.join(this.projectRoot, '.env.backup');
  }

  /**
   * Generate a secure random string
   */
  generateSecret(length = 64) {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Check if .env file exists
   */
  async envExists() {
    try {
      await fs.access(this.envPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Backup current .env file
   */
  async backupEnv() {
    if (await this.envExists()) {
      const content = await fs.readFile(this.envPath, 'utf8');
      await fs.writeFile(this.backupPath, content);
      console.log('✅ Backed up current .env to .env.backup');
    }
  }

  /**
   * Load and parse .env file
   */
  async loadEnv() {
    if (!(await this.envExists())) {
      throw new Error('.env file not found');
    }

    const content = await fs.readFile(this.envPath, 'utf8');
    const env = {};

    content.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').replace(/^["']|["']$/g, '');
        env[key.trim()] = value;
      }
    });

    return env;
  }

  /**
   * Create secure .env from template
   */
  async createSecureEnv(existingEnv = {}) {
    const template = await fs.readFile(this.envExamplePath, 'utf8');
    let secureEnv = template;

    // Replace placeholder secrets with generated ones
    const secretPatterns = [
      { pattern: /JWT_SECRET="[^"]*"/, key: 'JWT_SECRET' },
      { pattern: /JWT_REFRESH_SECRET="[^"]*"/, key: 'JWT_REFRESH_SECRET' },
      { pattern: /SESSION_SECRET="[^"]*"/, key: 'SESSION_SECRET' }
    ];

    for (const { pattern, key } of secretPatterns) {
      if (pattern.test(secureEnv)) {
        const newSecret = this.generateSecret();
        secureEnv = secureEnv.replace(pattern, `${key}="${newSecret}"`);
        console.log(`🔑 Generated new ${key}`);
      }
    }

    // Preserve existing API keys if they look valid (not placeholders)
    const apiKeys = [
      'OPENAI_API_KEY',
      'GOOGLE_GEMINI_API_KEY',
      'STRIPE_SECRET_KEY',
      'STRIPE_WEBHOOK_SECRET',
      'STRIPE_PUBLISHABLE_KEY'
    ];

    for (const key of apiKeys) {
      if (existingEnv[key] && !existingEnv[key].includes('your-') && !existingEnv[key].includes('here')) {
        // Replace the placeholder with actual key
        const placeholderPattern = new RegExp(`${key}="[^"]*"`, 'g');
        secureEnv = secureEnv.replace(placeholderPattern, `${key}="${existingEnv[key]}"`);
        console.log(`✅ Preserved existing ${key}`);
      }
    }

    return secureEnv;
  }

  /**
   * Validate API keys format
   */
  validateApiKeys(env) {
    const validations = {
      OPENAI_API_KEY: (key) => key.startsWith('sk-'),
      GOOGLE_GEMINI_API_KEY: (key) => key.startsWith('AIza'),
      STRIPE_SECRET_KEY: (key) => key.startsWith('sk_'),
      STRIPE_PUBLISHABLE_KEY: (key) => key.startsWith('pk_')
    };

    const issues = [];

    for (const [key, validator] of Object.entries(validations)) {
      if (env[key] && !validator(env[key])) {
        issues.push(`⚠️  ${key} format looks invalid`);
      }
    }

    return issues;
  }

  /**
   * Main migration process
   */
  async migrate() {
    console.log('🚀 Starting WhatsDeX Secret Migration...\n');

    try {
      // Step 1: Backup existing .env
      await this.backupEnv();

      // Step 2: Load existing configuration
      let existingEnv = {};
      if (await this.envExists()) {
        existingEnv = await this.loadEnv();
        console.log('📖 Loaded existing .env configuration');
      }

      // Step 3: Create secure configuration
      const secureEnv = await this.createSecureEnv(existingEnv);

      // Step 4: Validate API keys
      const validationIssues = this.validateApiKeys(existingEnv);
      if (validationIssues.length > 0) {
        console.log('\n⚠️  API Key Validation Issues:');
        validationIssues.forEach(issue => console.log(`   ${issue}`));
      }

      // Step 5: Write secure .env
      await fs.writeFile(this.envPath, secureEnv);
      console.log('\n✅ Created secure .env file');

      // Step 6: Summary
      console.log('\n📋 Migration Summary:');
      console.log('   • Backed up original .env to .env.backup');
      console.log('   • Generated secure JWT and session secrets');
      console.log('   • Preserved valid API keys');
      console.log('   • Created production-ready configuration');

      console.log('\n🔒 Security Recommendations:');
      console.log('   • Review all API keys and ensure they are valid');
      console.log('   • Rotate any compromised keys immediately');
      console.log('   • Never commit .env files to version control');
      console.log('   • Use environment-specific .env files (.env.local, .env.production)');

      console.log('\n🎉 Migration completed successfully!');
      console.log('   Restart your application to use the new secure configuration.');

    } catch (error) {
      console.error('❌ Migration failed:', error.message);
      console.log('\n🔄 To rollback:');
      console.log('   cp .env.backup .env');
      process.exit(1);
    }
  }
}

// CLI interface
if (require.main === module) {
  const migrator = new SecretMigrator();

  // Check for help flag
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log(`
WhatsDeX Secret Migration Tool

USAGE:
  node scripts/migrate-secrets.js

DESCRIPTION:
  Safely migrates your .env file from insecure to secure configuration.
  This tool will:
  - Backup your current .env file
  - Generate secure random secrets for JWT and sessions
  - Preserve valid API keys
  - Create a production-ready configuration

WARNING:
  This will overwrite your current .env file.
  A backup will be created at .env.backup

EXAMPLE:
  node scripts/migrate-secrets.js
    `);
    process.exit(0);
  }

  migrator.migrate();
}

module.exports = SecretMigrator;