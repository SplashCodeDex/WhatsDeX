const { execSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const logger = require('../src/utils/logger');

// Migration script for WhatsDeX database
async function migrateDatabase(options = {}) {
  const { rollback = false, force = false } = options;
  const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');

  try {
    logger.info('Starting database migration...');

    // Check current status
    logger.info('Checking migration status...');
    execSync('npx prisma migrate status', { stdio: 'pipe', cwd: __dirname });

    if (rollback) {
      logger.info('Rolling back last migration...');
      execSync('npx prisma migrate resolve --rolled-back "PreviousMigrationName"', { 
        stdio: 'pipe', 
        cwd: __dirname,
        env: { ...process.env, PRISMA_MIGRATE_ROLLBACK: 'true' }
      });
    } else {
      logger.info('Applying migrations...');
      execSync('npx prisma migrate dev --name auto-migrate', { stdio: 'pipe', cwd: __dirname });
    }

    // Generate client after migration
    logger.info('Generating Prisma client...');
    execSync('npx prisma generate', { stdio: 'pipe', cwd: __dirname });

    // Verify status post-migration
    logger.info('Verifying migration status...');
    const statusOutput = execSync('npx prisma migrate status', { stdio: 'pipe', cwd: __dirname }).toString();
    if (!statusOutput.includes('All migrations are applied')) {
      throw new Error('Migration verification failed - not all applied');
    }

    logger.success('Database migration completed successfully');
  } catch (error) {
    logger.error('Database migration failed', { error: error.message, stack: error.stack });
    
    if (rollback) {
      logger.warn('Rollback attempted but may require manual intervention');
    }
    
    // Attempt rollback on failure if not already in rollback mode
    if (!rollback && force) {
      logger.info('Attempting rollback on failure...');
      try {
        execSync('npx prisma migrate resolve --rolled-back "FailedMigrationName"', { stdio: 'pipe', cwd: __dirname });
        logger.success('Rollback completed');
      } catch (rollbackError) {
        logger.error('Rollback failed', { error: rollbackError.message });
        throw new Error(`Migration failed and rollback unsuccessful: ${error.message}`);
      }
    }
    
    throw error;
  }
}

// Run migration if script is executed directly
if (require.main === module) {
  const args = process.argv.slice(2);
  const rollback = args.includes('--rollback');
  const force = args.includes('--force');
  
  migrateDatabase({ rollback, force })
    .then(() => {
      console.log('Migration script executed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration script failed:', error.message);
      process.exit(1);
    });
}

module.exports = migrateDatabase;