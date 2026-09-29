#!/usr/bin/env bash
# ==============================================================================
# Multi-Vendor School Management System - Automated Database Backup Script
# Backs up the project database (SQLite / PostgreSQL / MySQL) and uploads
# directly to Google Drive (Folder ID: 1x0ZjTs3tnC1ZI8y3-XBOPs6Q4gnioRGW)
# ==============================================================================

set -euo pipefail

# 1. Resolve Project Paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
BACKUP_DIR="${BACKEND_DIR}/backups"
LOG_FILE="${BACKUP_DIR}/backup.log"
TIMESTAMP="$(date +"%Y%m%d_%H%M%S")"
RETENTION_DAYS=14
TARGET_FOLDER_ID="1x0ZjTs3tnC1ZI8y3-XBOPs6Q4gnioRGW"

# Ensure backup directory exists
mkdir -p "${BACKUP_DIR}"

# Logging helper
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "${LOG_FILE}"
}

log "=== Starting database backup routine ==="

# 2. Locate Tools
RCLONE_BIN="$(command -v rclone || echo "/opt/homebrew/bin/rclone")"
if [ ! -x "${RCLONE_BIN}" ]; then
    log "ERROR: rclone binary not found at '${RCLONE_BIN}'. Please ensure rclone is installed."
    exit 1
fi

RCLONE_CONFIG_OPTS=()
if [ -f "${SCRIPT_DIR}/rclone.conf" ]; then
    RCLONE_CONFIG_OPTS=("--config" "${SCRIPT_DIR}/rclone.conf")
fi

SQLITE_BIN="$(command -v sqlite3 || echo "/usr/bin/sqlite3")"

# 3. Load Environment Variables if .env exists
DATABASE_URL="${DATABASE_URL:-}"
if [ -z "${DATABASE_URL}" ] && [ -f "${BACKEND_DIR}/.env" ]; then
    # Safely extract DATABASE_URL without executing .env as bash (which breaks on special chars in SECRET_KEY)
    DATABASE_URL="$(grep -E '^DATABASE_URL=' "${BACKEND_DIR}/.env" | head -n 1 | sed -E 's/^DATABASE_URL=["'"'"']?//; s/["'"'"']?$//' || true)"
fi
BACKUP_BASENAME="db_backup_${TIMESTAMP}"
BACKUP_FILE=""

# 4. Perform Database Dump
if [ -n "${DATABASE_URL}" ] && [[ "${DATABASE_URL}" =~ ^postgres ]]; then
    log "Detected PostgreSQL via DATABASE_URL. Running pg_dump..."
    PG_DUMP_BIN=""
    if [ -x "/Library/PostgreSQL/17/bin/pg_dump" ]; then
        PG_DUMP_BIN="/Library/PostgreSQL/17/bin/pg_dump"
    elif command -v pg_dump >/dev/null 2>&1; then
        PG_DUMP_BIN="$(command -v pg_dump)"
    fi
    if [ -z "${PG_DUMP_BIN}" ]; then
        log "ERROR: pg_dump not found in PATH."
        exit 1
    fi
    BACKUP_FILE="${BACKUP_DIR}/${BACKUP_BASENAME}.sql.gz"
    "${PG_DUMP_BIN}" "${DATABASE_URL}" | gzip -9 > "${BACKUP_FILE}"

elif [ -n "${DATABASE_URL}" ] && [[ "${DATABASE_URL}" =~ ^mysql ]]; then
    log "Detected MySQL via DATABASE_URL. Running mysqldump..."
    MYSQL_DUMP_BIN="$(command -v mysqldump || true)"
    if [ -z "${MYSQL_DUMP_BIN}" ]; then
        log "ERROR: mysqldump not found in PATH."
        exit 1
    fi
    BACKUP_FILE="${BACKUP_DIR}/${BACKUP_BASENAME}.sql.gz"
    "${MYSQL_DUMP_BIN}" "${DATABASE_URL}" | gzip -9 > "${BACKUP_FILE}"

elif [ -f "${BACKEND_DIR}/db.sqlite3" ]; then
    log "Detected SQLite database at ${BACKEND_DIR}/db.sqlite3. Performing atomic backup..."
    TEMP_SQLITE="${BACKUP_DIR}/${BACKUP_BASENAME}.sqlite3"
    
    # Safe online SQLite backup API
    "${SQLITE_BIN}" "${BACKEND_DIR}/db.sqlite3" ".backup '${TEMP_SQLITE}'"
    
    # Compress with maximum compression
    gzip -9 -f "${TEMP_SQLITE}"
    BACKUP_FILE="${TEMP_SQLITE}.gz"
    log "Compressed SQLite dump created."

else
    log "ERROR: No supported database found (no db.sqlite3 and DATABASE_URL not set)."
    exit 1
fi

FILE_SIZE="$(du -h "${BACKUP_FILE}" | cut -f1)"
log "Backup file created: ${BACKUP_FILE} (Size: ${FILE_SIZE})"

# 5. Clean Google Drive folder before uploading new backup
REMOTE_TARGET="gdrive,root_folder_id=${TARGET_FOLDER_ID}:"

log "Cleaning Google Drive folder (${TARGET_FOLDER_ID}) before upload..."
if "${RCLONE_BIN}" "${RCLONE_CONFIG_OPTS[@]}" delete "${REMOTE_TARGET}" >> "${LOG_FILE}" 2>&1; then
    log "Google Drive directory cleaned successfully."
else
    log "Notice: Could not clear Google Drive directory or directory was already empty."
fi

# 6. Upload new backup to Google Drive
log "Uploading ${BACKUP_FILE} to Google Drive folder (${TARGET_FOLDER_ID})..."
if "${RCLONE_BIN}" "${RCLONE_CONFIG_OPTS[@]}" copy "${BACKUP_FILE}" "${REMOTE_TARGET}" --fast-list -v >> "${LOG_FILE}" 2>&1; then
    log "SUCCESS: Backup uploaded to Google Drive successfully."
else
    # Fallback to standard gdrive: remote if connection-string parameter is rejected
    log "Retrying upload to standard 'gdrive:' remote..."
    "${RCLONE_BIN}" "${RCLONE_CONFIG_OPTS[@]}" copy "${BACKUP_FILE}" "gdrive:" --fast-list -v >> "${LOG_FILE}" 2>&1
    log "SUCCESS: Backup uploaded to Google Drive."
fi

# 7. Retention Policy Cleanup on local storage
log "Cleaning up local backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -name "db_backup_*.gz" -type f -mtime +"${RETENTION_DAYS}" -delete || true

log "=== Backup routine completed successfully ==="
