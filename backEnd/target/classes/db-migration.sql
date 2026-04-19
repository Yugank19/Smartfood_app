-- Run this once to fix the users table schema for PIN-based auth
-- This removes the old NOT NULL constraints on email and password columns

ALTER TABLE users MODIFY COLUMN email VARCHAR(255) NULL DEFAULT NULL;
ALTER TABLE users MODIFY COLUMN password VARCHAR(255) NULL DEFAULT NULL;
