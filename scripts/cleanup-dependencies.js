#!/usr/bin/env node

/**
 * WhatsDeX Dependency Cleanup Script
 * Removes conflicting and unused dependencies
 */

const fs = require('fs').promises;
const path = require('path');

class DependencyCleaner {
  constructor() {
    this.projectRoot = path.join(__dirname, '..');
    this.packageJsonPath = path.join(this.projectRoot, 'package.json');
  }

  /**
   * Load package.json
   */
  async loadPackageJson() {
    const content = await fs.readFile(this.packageJsonPath, 'utf8');
    return JSON.parse(content);
  }

  /**
   * Save package.json
   */
  async savePackageJson(packageJson) {
    const content = JSON.stringify(packageJson, null, 2) + '\n';
    await fs.writeFile(this.packageJsonPath, content, 'utf8');
  }

  /**
   * Identify conflicting dependencies
   */
  identifyConflicts(dependencies) {
    const conflicts = {
      database: [],
      whatsapp: [],
      unused: []
    };

    // Database conflicts
    const dbDeps = ['pg', 'mongoose', 'simpl.db', 'ioredis', '@prisma/client'];
    conflicts.database = dbDeps.filter(dep => dependencies[dep]);

    // WhatsApp library conflicts
    const waDeps = ['@whiskeysockets/baileys', '@mengkodingan/consolefy', 'baileys'];
    conflicts.whatsapp = waDeps.filter(dep => dependencies[dep]);

    // Potentially unused dependencies
    const potentiallyUnused = [
      'bull', // Redis-based job queue
      'compression', // HTTP compression
      'helmet', // Security headers
      'link-preview-js', // Link previews
      'jimp', // Image processing
      'multer', // File uploads
      'socket.io', // WebSockets
      'winston' // Advanced logging
    ];
    conflicts.unused = potentiallyUnused.filter(dep => dependencies[dep]);

    return conflicts;
  }

  /**
   * Create cleaned package.json
   */
  createCleanPackageJson(original, conflicts) {
    const cleaned = JSON.parse(JSON.stringify(original));

    // Keep only essential dependencies for SQLite + single WhatsApp library
    const keepDeps = [
      '@prisma/client', // For database
      'express', // Web server
      'cors', // CORS handling
      'dotenv', // Environment variables
      'axios', // HTTP requests
      'bcryptjs', // Password hashing
      'jsonwebtoken', // JWT tokens
      'express-rate-limit', // Rate limiting
      'express-validator', // Input validation
      'cfonts', // Console fonts
      'moment-timezone', // Time handling
      'nodemon', // Development
      'jest', // Testing
      'eslint', // Linting
      'prisma' // Database tooling
    ];

    // Remove conflicting database dependencies (keep Prisma)
    const removeDbDeps = ['pg', 'mongoose', 'simpl.db', 'ioredis'];
    removeDbDeps.forEach(dep => {
      if (cleaned.dependencies[dep]) {
        delete cleaned.dependencies[dep];
        console.log(`🗑️  Removed conflicting DB dependency: ${dep}`);
      }
    });

    // Remove duplicate WhatsApp libraries (keep @whiskeysockets/baileys)
    const removeWaDeps = ['@itsreimau/gktw', '@mengkodingan/consolefy'];
    removeWaDeps.forEach(dep => {
      if (cleaned.dependencies[dep]) {
        delete cleaned.dependencies[dep];
        console.log(`🗑️  Removed duplicate WA library: ${dep}`);
      }
    });

    // Ask about potentially unused dependencies
    console.log('\n🤔 Potentially unused dependencies:');
    conflicts.unused.forEach(dep => {
      console.log(`   • ${dep} - ${cleaned.dependencies[dep]}`);
    });
    console.log('\n💡 Consider removing these if not used in your application.');

    return cleaned;
  }

  /**
   * Update scripts in package.json
   */
  updateScripts(packageJson) {
    // Remove scripts that depend on removed dependencies
    const scriptsToRemove = [
      'install:adapter' // Depends on removed DB adapters
    ];

    scriptsToRemove.forEach(script => {
      if (packageJson.scripts[script]) {
        delete packageJson.scripts[script];
        console.log(`🗑️  Removed script: ${script}`);
      }
    });

    // Update database scripts to use Prisma only
    packageJson.scripts.migrate = 'prisma migrate dev';
    packageJson.scripts.generate = 'prisma generate';
    packageJson.scripts.studio = 'prisma studio';

    console.log('✅ Updated database scripts to use Prisma only');
  }

  /**
   * Main cleanup process
   */
  async cleanup() {
    console.log('🧹 Starting WhatsDeX Dependency Cleanup...\n');

    try {
      // Load current package.json
      const packageJson = await this.loadPackageJson();
      console.log('📖 Loaded package.json');

      // Identify conflicts
      const conflicts = this.identifyConflicts(packageJson.dependencies);
      console.log('\n🔍 Found conflicts:');
      console.log(`   Database: ${conflicts.database.join(', ')}`);
      console.log(`   WhatsApp: ${conflicts.whatsapp.join(', ')}`);

      // Create cleaned version
      const cleaned = this.createCleanPackageJson(packageJson, conflicts);

      // Update scripts
      this.updateScripts(cleaned);

      // Backup original
      const backupPath = path.join(this.projectRoot, 'package.json.backup');
      await fs.writeFile(backupPath, JSON.stringify(packageJson, null, 2));
      console.log('✅ Backed up original package.json to package.json.backup');

      // Save cleaned version
      await this.savePackageJson(cleaned);
      console.log('✅ Created cleaned package.json');

      // Summary
      console.log('\n📋 Cleanup Summary:');
      console.log('   • Removed conflicting database dependencies');
      console.log('   • Removed duplicate WhatsApp libraries');
      console.log('   • Updated scripts for Prisma-only workflow');
      console.log('   • Backed up original configuration');

      console.log('\n📦 Next Steps:');
      console.log('   1. Run: npm install');
      console.log('   2. Run: npm run generate');
      console.log('   3. Test your application');
      console.log('   4. If issues arise, rollback with: cp package.json.backup package.json');

      console.log('\n🎉 Dependency cleanup completed!');

    } catch (error) {
      console.error('❌ Cleanup failed:', error.message);
      process.exit(1);
    }
  }
}

// CLI interface
if (require.main === module) {
  const cleaner = new DependencyCleaner();

  // Check for help flag
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log(`
WhatsDeX Dependency Cleanup Tool

USAGE:
  node scripts/cleanup-dependencies.js

DESCRIPTION:
  Removes conflicting and unused dependencies from package.json.
  This tool will:
  - Remove duplicate database libraries (keeps Prisma)
  - Remove duplicate WhatsApp libraries (keeps @whiskeysockets/baileys)
  - Identify potentially unused dependencies
  - Update scripts for clean workflow
  - Backup original package.json

WARNING:
  This will modify your package.json file.
  A backup will be created at package.json.backup

EXAMPLE:
  node scripts/cleanup-dependencies.js
    `);
    process.exit(0);
  }

  cleaner.cleanup();
}

module.exports = DependencyCleaner;