#!/bin/bash

# WhatsDeX Backup Script

BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)

echo "$(date): Starting backup process..." | tee /backups/last_backup.log

# Backup sessions (most important for SaaS!)
if [ -d "/app/sessions" ]; then
    tar -czf "$BACKUP_DIR/sessions_$DATE.tar.gz" /app/sessions
    echo "$(date): Sessions backed up" >> /backups/last_backup.log
fi

# Backup uploads
if [ -d "/app/uploads" ]; then
    tar -czf "$BACKUP_DIR/uploads_$DATE.tar.gz" /app/uploads
    echo "$(date): Uploads backed up" >> /backups/last_backup.log
fi

# Cleanup old backups (keep last 7 days)
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "$(date): Backup completed successfully" >> /backups/last_backup.log