-- Migration: Add user registration fields
-- Created: 2024-12-27

USE setlone_db;

-- Add new fields to users table (check if column exists first)
-- Note: MySQL doesn't support IF NOT EXISTS for ALTER TABLE, so we'll add them directly
-- If column already exists, this will fail - that's okay, we can ignore the error

ALTER TABLE users 
ADD COLUMN real_name VARCHAR(100) NULL COMMENT '실명',
ADD COLUMN birth_date DATE NULL COMMENT '생년월일',
ADD COLUMN phone_number VARCHAR(20) NULL COMMENT '핸드폰번호',
ADD COLUMN email_verification_code VARCHAR(10) NULL COMMENT '이메일 인증 코드',
ADD COLUMN email_verified BOOLEAN NOT NULL DEFAULT FALSE COMMENT '이메일 인증 완료 여부',
ADD COLUMN email_verification_sent_at TIMESTAMP NULL COMMENT '인증 코드 발송 시간';

-- Add indexes (ignore error if index already exists)
CREATE INDEX idx_phone_number ON users(phone_number);
CREATE INDEX idx_email_verified ON users(email_verified);
CREATE INDEX idx_birth_date ON users(birth_date);
