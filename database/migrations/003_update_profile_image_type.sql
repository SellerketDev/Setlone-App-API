-- Migration: Update profile_image to TEXT for base64 support
-- Created: 2024-12-27

USE setlone_db;

-- Change profile_image from VARCHAR(500) to TEXT to support base64 encoding
ALTER TABLE users 
MODIFY COLUMN profile_image TEXT NULL COMMENT 'Profile image URL or base64 encoded string';

