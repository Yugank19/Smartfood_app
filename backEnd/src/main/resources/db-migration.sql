-- Run this once to fix the users table schema for PIN-based auth
-- This removes the old NOT NULL constraints on email and password columns
-- PostgreSQL syntax (Supabase)

ALTER TABLE users ALTER COLUMN email DROP NOT NULL;
ALTER TABLE users ALTER COLUMN password DROP NOT NULL;
