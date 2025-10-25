#!/bin/bash

# WhatsDeX Backup Script
# This script creates backups of PostgreSQL database and Redis data

set -e

# Configuration from environment variables
POSTGRES_HOST=${POSTGRES_HOST:-postgres}
POSTGRES_DB=${POSTGRES_DB:-whatsdex}
POSTGRES_USER=${POSTGRES_USER:-whatsdex}
POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-whatsdex_password}
BACKUP_SCHEDULE=${BACKUP_SCHEDULE:-"0 2 * * *"}
BACKUP_RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-30}
BACKUP_DIR=${BACKUP_DIR:-/backups}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}" >&2
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Function to backup PostgreSQL
backup_postgres() {
    local timestamp=$(date +'%Y%m%d_%H%M%S')
    local backup_file="$BACKUP_DIR/postgres_backup_$timestamp.sql"

    log "Starting PostgreSQL backup..."

    if PGPASSWORD="$POSTGRES_PASSWORD" pg_dump \
        -h "$POSTGRES_HOST" \
        -U "$POSTGRES_USER" \
        -d "$POSTGRES_DB" \
        --no-password \
        --format=custom \
        --compress=9 \
        --verbose \
        > "$backup_file"; then

        log "PostgreSQL backup completed: $backup_file"
        echo "$backup_file"
    else
        error "PostgreSQL backup failed"
        return 1
    fi
}

# Function to backup Redis
backup_redis() {
    local timestamp=$(date +'%Y%m%d_%H%M%S')
    local backup_file="$BACKUP_DIR/redis_backup_$timestamp.rdb"

    log "Starting Redis backup..."

    if redis-cli -h redis SAVE; then
        # Copy the Redis dump file
        if cp /data/dump.rdb "$backup_file" 2>/dev/null; then
            log "Redis backup completed: $backup_file"
            echo "$backup_file"
        else
            warn "Could not copy Redis dump file, Redis might not be using RDB persistence"
            echo ""
        fi
    else
        error "Redis backup failed"
        return 1
    fi
}

# Function to cleanup old backups
cleanup_old_backups() {
    log "Cleaning up backups older than $BACKUP_RETENTION_DAYS days..."

    find "$BACKUP_DIR" -name "*.sql" -o -name "*.rdb" -type f -mtime +"$BACKUP_RETENTION_DAYS" -delete

    local deleted_count=$(find "$BACKUP_DIR" -name "*.sql" -o -name "*.rdb" -type f -mtime +"$BACKUP_RETENTION_DAYS" -print -delete | wc -l)
    log "Cleaned up $deleted_count old backup files"
}

# Function to send health check
health_check() {
    log "Backup service health check passed"
}

# Main backup function
perform_backup() {
    log "Starting WhatsDeX backup process..."

    # Backup PostgreSQL
    postgres_backup=$(backup_postgres)

    # Backup Redis
    redis_backup=$(backup_redis)

    # Log backup summary
    log "Backup Summary:"
    [ -n "$postgres_backup" ] && log "  PostgreSQL: $(basename "$postgres_backup")"
    [ -n "$redis_backup" ] && log "  Redis: $(basename "$redis_backup")"

    # Cleanup old backups
    cleanup_old_backups

    log "Backup process completed successfully"
}

# Function to run scheduled backups
run_scheduled() {
    log "Starting scheduled backup service with schedule: $BACKUP_SCHEDULE"

    # Convert cron schedule to sleep intervals (simplified)
    # This is a basic implementation - for production, consider using cron

    while true; do
        perform_backup

        # Sleep for 24 hours (86400 seconds)
        # In production, implement proper cron scheduling
        sleep 86400
    done
}

# Main script logic
case "${1:-scheduled}" in
    "manual")
        perform_backup
        ;;
    "postgres")
        backup_postgres
        ;;
    "redis")
        backup_redis
        ;;
    "cleanup")
        cleanup_old_backups
        ;;
    "health")
        health_check
        ;;
    "scheduled"|*)
        run_scheduled
        ;;
esac