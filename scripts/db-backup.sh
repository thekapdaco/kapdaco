#!/bin/bash
# Database Backup Script for MongoDB
# Usage: ./scripts/db-backup.sh [backup-dir]
# Requires: mongodump, MONGODB_URI environment variable

set -e

# Configuration
BACKUP_DIR="${1:-./backups}"
DB_NAME="${MONGODB_DB_NAME:-kapda-co}"
MONGODB_URI="${MONGODB_URI:-mongodb://localhost:27017/${DB_NAME}}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="${DB_NAME}_${TIMESTAMP}"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo "🔄 Starting backup: $BACKUP_NAME"

# Extract connection details from MONGODB_URI
# Handle both mongodb:// and mongodb+srv:// formats
if [[ $MONGODB_URI == *"mongodb+srv://"* ]]; then
  # MongoDB Atlas - use connection string directly
  mongodump --uri="$MONGODB_URI" --out="$BACKUP_DIR/$BACKUP_NAME"
else
  # Standard MongoDB - parse URI
  mongodump --uri="$MONGODB_URI" --out="$BACKUP_DIR/$BACKUP_NAME"
fi

# Create compressed archive
echo "📦 Compressing backup..."
tar -czf "$BACKUP_DIR/${BACKUP_NAME}.tar.gz" -C "$BACKUP_DIR" "$BACKUP_NAME"
rm -rf "$BACKUP_DIR/$BACKUP_NAME"

# Keep only last 7 days of backups
echo "🧹 Cleaning old backups (keeping last 7 days)..."
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +7 -delete

echo "✅ Backup completed: ${BACKUP_NAME}.tar.gz"
echo "📁 Location: $BACKUP_DIR/${BACKUP_NAME}.tar.gz"

# Optional: Upload to S3 or other storage
# if [ -n "$AWS_S3_BUCKET" ]; then
#   echo "☁️  Uploading to S3..."
#   aws s3 cp "$BACKUP_DIR/${BACKUP_NAME}.tar.gz" "s3://${AWS_S3_BUCKET}/backups/"
# fi

