const DatabaseService = require('../services/database');
const logger = require('./logger');
const fs = require('fs').promises;
import path from 'path';

class MigrationService {
  constructor() {
    this.database = new DatabaseService();
    this.migrationPath = path.join(process.cwd(), 'migrations');
  }

  async initialize() {
    await this.database.connect();
    await this.ensureMigrationTable();
  }

  // Ensure migration tracking table exists
  async ensureMigrationTable() {
    try {
      await this.database.prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "_migrations" (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL UNIQUE,
          executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `;
      logger.info('Migration tracking table ensured');
    } catch (error) {
      logger.error('Failed to create migration table', { error: error.message });
      throw error;
    }
  }

  // Run all pending migrations
  async runMigrations() {
    try {
      logger.info('Starting database migrations');

      const migrationFiles = await this.getMigrationFiles();
      const executedMigrations = await this.getExecutedMigrations();

      const pendingMigrations = migrationFiles.filter(file =>
        !executedMigrations.includes(file.replace('.sql', ''))
      );

      if (pendingMigrations.length === 0) {
        logger.info('No pending migrations found');
        return;
      }

      logger.info(`Found ${pendingMigrations.length} pending migrations`);

      for (const migrationFile of pendingMigrations) {
        await this.executeMigration(migrationFile);
      }

      logger.info('All migrations completed successfully');
    } catch (error) {
      logger.error('Migration process failed', { error: error.message });
      throw error;
    }
  }

  // Execute a single migration
  async executeMigration(filename) {
    const migrationName = filename.replace('.sql', '');
    const filePath = path.join(this.migrationPath, filename);

    try {
      logger.info(`Executing migration: ${migrationName}`);

      const sql = await fs.readFile(filePath, 'utf8');

      // Split SQL commands and execute them
      const commands = sql.split(';').filter(cmd => cmd.trim().length > 0);

      for (const command of commands) {
        if (command.trim()) {
          await this.database.prisma.$executeRawUnsafe(command);
        }
      }

      // Record migration as executed
      await this.database.prisma.$executeRaw`
        INSERT INTO "_migrations" (name) VALUES (${migrationName});
      `;

      logger.info(`Migration ${migrationName} executed successfully`);
    } catch (error) {
      logger.error(`Migration ${migrationName} failed`, { error: error.message });
      throw error;
    }
  }

  // Get list of migration files
  async getMigrationFiles() {
    try {
      await fs.access(this.migrationPath);
    } catch {
      await fs.mkdir(this.migrationPath, { recursive: true });
      logger.info('Created migrations directory');
      return [];
    }

    const files = await fs.readdir(this.migrationPath);
    return files
      .filter(file => file.endsWith('.sql'))
      .sort(); // Ensure consistent order
  }

  // Get list of executed migrations
  async getExecutedMigrations() {
    try {
      const result = await this.database.prisma.$queryRaw`
        SELECT name FROM "_migrations" ORDER BY executed_at;
      `;
      return result.map(row => row.name);
    } catch (error) {
      // If table doesn't exist yet, return empty array
      if (error.message.includes('relation "_migrations" does not exist')) {
        return [];
      }
      throw error;
    }
  }

  // Create a new migration file
  async createMigration(name, sql = '') {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `${timestamp}_${name}.sql`;
    const filePath = path.join(this.migrationPath, filename);

    const template = `-- Migration: ${name}
-- Created at: ${new Date().toISOString()}

${sql}

-- End of migration: ${name}
`;

    await fs.writeFile(filePath, template, 'utf8');
    logger.info(`Created migration file: ${filename}`);

    return filename;
  }

  // Migrate data from SimplDB to PostgreSQL
  async migrateFromSimplDB(simplDbPath = './database.json') {
    try {
      logger.info('Starting migration from SimplDB to PostgreSQL');

      const fs = require('fs');
      if (!fs.existsSync(simplDbPath)) {
        logger.warn('SimplDB file not found, skipping migration');
        return;
      }

      const simplData = JSON.parse(fs.readFileSync(simplDbPath, 'utf8'));

      // Migrate users
      if (simplData.users) {
        logger.info(`Migrating ${Object.keys(simplData.users).length} users`);
        for (const [jid, userData] of Object.entries(simplData.users)) {
          await this.database.upsertUser({
            jid,
            name: userData.name,
            phone: userData.phone,
            avatar: userData.avatar,
            xp: userData.xp || 0,
            level: userData.level || 1,
            coin: userData.coin || 0,
            premium: userData.premium || false,
            banned: userData.banned || false
          });
        }
      }

      // Migrate groups
      if (simplData.groups) {
        logger.info(`Migrating ${Object.keys(simplData.groups).length} groups`);
        for (const [jid, groupData] of Object.entries(simplData.groups)) {
          await this.database.createGroup({
            jid,
            name: groupData.name,
            description: groupData.description,
            avatar: groupData.avatar,
            ownerJid: groupData.ownerJid,
            memberCount: groupData.memberCount || 0
          });
        }
      }

      // Migrate menfess
      if (simplData.menfess) {
        logger.info(`Migrating ${Object.keys(simplData.menfess).length} menfess messages`);
        for (const [id, menfessData] of Object.entries(simplData.menfess)) {
          await this.database.prisma.menfess.create({
            data: {
              fromUserId: (await this.database.getUser(menfessData.fromUser)).id,
              toGroupId: menfessData.toGroup,
              toUserId: menfessData.toUser,
              message: menfessData.message,
              mediaUrl: menfessData.mediaUrl,
              mediaType: menfessData.mediaType,
              sentAt: new Date(menfessData.sentAt || Date.now()),
              delivered: menfessData.delivered || false,
              read: menfessData.read || false
            }
          });
        }
      }

      logger.info('Migration from SimplDB completed successfully');
    } catch (error) {
      logger.error('Migration from SimplDB failed', { error: error.message });
      throw error;
    }
  }

  // Rollback last migration
  async rollbackLast() {
    try {
      const executedMigrations = await this.getExecutedMigrations();

      if (executedMigrations.length === 0) {
        logger.warn('No migrations to rollback');
        return;
      }

      const lastMigration = executedMigrations[executedMigrations.length - 1];
      const filePath = path.join(this.migrationPath, `${lastMigration}.sql`);

      // Read the migration file to get rollback SQL
      const sql = await fs.readFile(filePath, 'utf8');
      const rollbackSql = this.extractRollbackSql(sql);

      if (rollbackSql) {
        await this.database.prisma.$executeRawUnsafe(rollbackSql);
      }

      // Remove from migration tracking
      await this.database.prisma.$executeRaw`
        DELETE FROM "_migrations" WHERE name = ${lastMigration};
      `;

      logger.info(`Rolled back migration: ${lastMigration}`);
    } catch (error) {
      logger.error('Rollback failed', { error: error.message });
      throw error;
    }
  }

  // Extract rollback SQL from migration file (basic implementation)
  extractRollbackSql(sql) {
    const lines = sql.split('\n');
    const rollbackLines = [];
    let inRollback = false;

    for (const line of lines) {
      if (line.includes('-- ROLLBACK START')) {
        inRollback = true;
        continue;
      }
      if (line.includes('-- ROLLBACK END')) {
        break;
      }
      if (inRollback) {
        rollbackLines.push(line);
      }
    }

    return rollbackLines.length > 0 ? rollbackLines.join('\n') : null;
  }

  // Get migration status
  async getStatus() {
    try {
      const migrationFiles = await this.getMigrationFiles();
      const executedMigrations = await this.getExecutedMigrations();

      const status = {
        total: migrationFiles.length,
        executed: executedMigrations.length,
        pending: migrationFiles.length - executedMigrations.length,
        migrations: []
      };

      for (const file of migrationFiles) {
        const name = file.replace('.sql', '');
        status.migrations.push({
          name,
          status: executedMigrations.includes(name) ? 'executed' : 'pending',
          file
        });
      }

      return status;
    } catch (error) {
      logger.error('Failed to get migration status', { error: error.message });
      throw error;
    }
  }

  async close() {
    await this.database.disconnect();
  }
}

module.exports = MigrationService;
