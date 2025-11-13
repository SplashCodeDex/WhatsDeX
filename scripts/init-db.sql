-- WhatsDeX Database Initialization Script
-- This script sets up the initial database configuration for production

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pg_buffercache";
-- Vector extension for AI features (pgvector)
CREATE EXTENSION IF NOT EXISTS vector;

-- Create indexes for better performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_last_activity ON users(lastActivity);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_command_usage_user_created ON command_usage(userId, usedAt);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_command_usage_command ON command_usage(command);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(createdAt);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_event_type ON audit_logs(eventType);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor);

-- Create composite indexes for common queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_groups_user_group ON user_groups(userId, groupId);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_menfess_from_user ON menfess(fromUserId);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_menfess_to_user ON menfess(toUserId);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversation_memory_user_updated ON conversation_memory(userId, lastUpdated);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_content_user_type_created ON ai_generated_content(userId, type, createdAt);

-- Set up maintenance and monitoring
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET pg_stat_statements.track = 'all';
ALTER SYSTEM SET pg_stat_statements.track_utility = 'off';
ALTER SYSTEM SET pg_stat_statements.max = 10000;

-- Create a monitoring user (optional)
-- DO $$
-- BEGIN
--    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'monitoring') THEN
--       CREATE ROLE monitoring WITH LOGIN PASSWORD 'monitoring_password' NOSUPERUSER NOCREATEDB NOCREATEROLE;
--       GRANT pg_monitor TO monitoring;
--       GRANT SELECT ON ALL TABLES IN SCHEMA public TO monitoring;
--    END IF;
-- END
-- $$;

-- Vacuum and analyze for initial optimization
VACUUM ANALYZE;

-- Log initialization completion
DO $$
BEGIN
    RAISE NOTICE 'WhatsDeX database initialization completed successfully';
END
$$;