#!/bin/bash

# WhatsDeX Admin Database Backup Script
# This script creates automated backups of the PostgreSQL database

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration - Update these values
DB_NAME="whatsdex_prod"
DB_USER="whatsdex_admin"
DB_PASSWORD=""
DB_HOST="localhost"
DB_PORT="5432"

BACKUP_DIR="/var/backups/whatsdex"
RETENTION_DAYS=30
COMPRESSION_ENABLED=true

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

# Create backup directory
create_backup_dir() {
    if [ ! -d "$BACKUP_DIR" ]; then
        print_status "Creating backup directory: $BACKUP_DIR"
        sudo mkdir -p "$BACKUP_DIR"
        sudo chown "$USER:$USER" "$BACKUP_DIR"
    fi
}

# Get database password from environment or prompt
get_db_password() {
    if [ -z "$DB_PASSWORD" ]; then
        if [ -f ".env.production" ]; then
            DB_PASSWORD=$(grep "DATABASE_URL" .env.production | sed 's/.*:\/\/.*:\(.*\)@.*/\1/')
        fi

        if [ -z "$DB_PASSWORD" ]; then
            echo -n "Enter database password for user '$DB_USER': "
            read -s DB_PASSWORD
            echo
        fi
    fi
}

# Test database connection
test_db_connection() {
    print_status "Testing database connection..."
    if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1; then
        print_success "Database connection successful"
        return 0
    else
        print_error "Database connection failed"
        return 1
    fi
}

# Create database backup
create_backup() {
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="$BACKUP_DIR/db_backup_$timestamp.sql"

    print_status "Creating database backup: $backup_file"

    # Create backup
    if PGPASSWORD="$DB_PASSWORD" pg_dump \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        --no-password \
        --format=custom \
        --compress=9 \
        --verbose > "$backup_file.backup" 2>> "$BACKUP_DIR/backup.log"; then

        print_success "Database backup created successfully"

        # Compress if enabled
        if [ "$COMPRESSION_ENABLED" = true ]; then
            print_status "Compressing backup file..."
            gzip "$backup_file.backup"
            backup_file="$backup_file.backup.gz"
            print_success "Backup compressed: $backup_file"
        fi

        # Verify backup
        if [ -f "$backup_file" ]; then
            local file_size=$(du -h "$backup_file" | cut -f1)
            print_success "Backup verification successful - Size: $file_size"
            echo "$(date '+%Y-%m-%d %H:%M:%S') - SUCCESS: $backup_file ($file_size)" >> "$BACKUP_DIR/backup_history.log"
        else
            print_error "Backup file not found after creation"
            return 1
        fi

    else
        print_error "Database backup failed"
        echo "$(date '+%Y-%m-%d %H:%M:%S') - FAILED: Database backup failed" >> "$BACKUP_DIR/backup_history.log"
        return 1
    fi
}

# Clean up old backups
cleanup_old_backups() {
    print_status "Cleaning up backups older than $RETENTION_DAYS days..."

    local deleted_count=0
    local total_size=0

    # Find and delete old backups
    while IFS= read -r -d '' file; do
        local file_size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null || echo 0)
        total_size=$((total_size + file_size))
        rm -f "$file"
        deleted_count=$((deleted_count + 1))
        print_status "Deleted old backup: $file"
    done < <(find "$BACKUP_DIR" -name "db_backup_*.sql*" -mtime +$RETENTION_DAYS -print0)

    if [ $deleted_count -gt 0 ]; then
        local size_mb=$((total_size / 1024 / 1024))
        print_success "Cleaned up $deleted_count old backups, freed ${size_mb}MB"
        echo "$(date '+%Y-%m-%d %H:%M:%S') - CLEANUP: Deleted $deleted_count files, ${size_mb}MB freed" >> "$BACKUP_DIR/backup_history.log"
    else
        print_status "No old backups to clean up"
    fi
}

# Send notification (optional - implement based on your needs)
send_notification() {
    local subject="$1"
    local message="$2"

    # Example: Send email notification
    # echo "$message" | mail -s "$subject" admin@yourdomain.com

    # Example: Send to Slack webhook
    # curl -X POST -H 'Content-type: application/json' \
    #      --data "{\"text\":\"$subject: $message\"}" \
    #      YOUR_SLACK_WEBHOOK_URL

    print_status "Notification: $subject - $message"
}

# Main backup function
main() {
    print_status "Starting WhatsDeX database backup process..."

    # Initialize
    create_backup_dir
    get_db_password

    # Test connection
    if ! test_db_connection; then
        send_notification "Backup Failed" "Database connection test failed"
        exit 1
    fi

    # Create backup
    if create_backup; then
        print_success "Database backup completed successfully"

        # Clean up old backups
        cleanup_old_backups

        # Send success notification
        local latest_backup=$(ls -t "$BACKUP_DIR"/db_backup_*.sql* | head -1)
        local backup_size=$(du -h "$latest_backup" | cut -f1)
        send_notification "Backup Completed" "Latest backup: $(basename "$latest_backup") (${backup_size})"

    else
        print_error "Database backup failed"
        send_notification "Backup Failed" "Database backup process failed"
        exit 1
    fi

    # Show backup statistics
    local backup_count=$(find "$BACKUP_DIR" -name "db_backup_*.sql*" | wc -l)
    local total_size=$(du -sh "$BACKUP_DIR" | cut -f1)

    print_success "Backup process completed!"
    print_status "Total backups: $backup_count"
    print_status "Total backup size: $total_size"
    print_status "Backup directory: $BACKUP_DIR"
}

# Health check function
health_check() {
    print_status "Performing backup health check..."

    # Check backup directory
    if [ ! -d "$BACKUP_DIR" ]; then
        print_error "Backup directory does not exist: $BACKUP_DIR"
        return 1
    fi

    # Check disk space
    local available_space=$(df "$BACKUP_DIR" | tail -1 | awk '{print $4}')
    local available_mb=$((available_space / 1024))

    if [ $available_mb -lt 1024 ]; then
        print_warning "Low disk space: ${available_mb}MB available"
    fi

    # Check latest backup
    local latest_backup=$(find "$BACKUP_DIR" -name "db_backup_*.sql*" -type f -printf '%T@ %p\n' 2>/dev/null | sort -n | tail -1 | cut -d' ' -f2-)

    if [ -z "$latest_backup" ]; then
        print_warning "No backup files found"
        return 1
    fi

    local backup_age_hours=$(( ( $(date +%s) - $(stat -c %Y "$latest_backup" 2>/dev/null || stat -f %m "$latest_backup" 2>/dev/null || echo $(date +%s)) ) / 3600 ))

    if [ $backup_age_hours -gt 25 ]; then
        print_warning "Latest backup is ${backup_age_hours} hours old"
    else
        print_success "Latest backup is recent: $(basename "$latest_backup")"
    fi

    return 0
}

# Parse command line arguments
case "${1:-}" in
    "health")
        health_check
        ;;
    "cleanup")
        create_backup_dir
        cleanup_old_backups
        ;;
    *)
        main
        ;;
esac