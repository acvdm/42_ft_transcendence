#!/bin/bash
set -e

echo "Initiliazing user service"

DB_DIR=/app/data

# Create directory if does not exist
if [ ! -d $DB_DIR ]; then
    echo "Creating directory $DB_DIR"
    mkdir -p "$DB_DIR"
fi

if ! id -u app >/dev/null 2>&1; then
    echo "Creation of 'app' user"
    addgroup -S app
    adduser -S -G app -h /app -s /bin/sh app
    echo "user 'app' created"
else
    echo "user 'app' already exists"
fi

# ensure permissions
echo "Handling permissions"
chmod 700 "$DB_DIR"
chown -R app:app "$DB_DIR"
chown -R app:app /app

echo "Permissions configured: $DB_DIR (700, app:app)"

# Drop privileges and exec
exec su-exec app "$@"