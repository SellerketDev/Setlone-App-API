#!/bin/bash

# Setlone Database Initialization Script

DB_NAME="setlone_db"
DB_USER="root"
SCHEMA_FILE="$(dirname "$0")/schema.sql"

echo "🚀 Initializing Setlone Database..."
echo ""

# Check if MySQL is running
if ! systemctl is-active --quiet mysql; then
    echo "❌ MySQL service is not running. Please start MySQL first."
    exit 1
fi

# Check if schema file exists
if [ ! -f "$SCHEMA_FILE" ]; then
    echo "❌ Schema file not found: $SCHEMA_FILE"
    exit 1
fi

# Execute schema
echo "📝 Creating database and tables..."
mysql -u "$DB_USER" -p < "$SCHEMA_FILE"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Database initialized successfully!"
    echo ""
    echo "📊 Database: $DB_NAME"
    echo "📁 Schema file: $SCHEMA_FILE"
    echo ""
    echo "You can now connect to the database:"
    echo "  mysql -u $DB_USER -p $DB_NAME"
else
    echo ""
    echo "❌ Failed to initialize database."
    exit 1
fi

