-- Migration: Add UID field to users table
-- Created: 2024-12-27

USE setlone_db;

-- Add UID field (7-digit unique number)
ALTER TABLE users 
ADD COLUMN uid VARCHAR(7) NULL UNIQUE COMMENT '7자리 고유 사용자 ID';

-- Add index for UID
CREATE INDEX idx_uid ON users(uid);

-- Update existing users with random UIDs (if any)
UPDATE users 
SET uid = LPAD(FLOOR(RAND() * 9999999), 7, '0')
WHERE uid IS NULL;

