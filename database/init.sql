-- Initialize Setlone Database
-- This script creates the database and applies the schema

SOURCE /root/setlone-api/database/schema.sql;

-- Show tables
SHOW TABLES;

-- Show database info
SELECT 
    TABLE_NAME as 'Table',
    TABLE_ROWS as 'Rows',
    ROUND(((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024), 2) as 'Size (MB)'
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'setlone_db'
ORDER BY TABLE_NAME;

