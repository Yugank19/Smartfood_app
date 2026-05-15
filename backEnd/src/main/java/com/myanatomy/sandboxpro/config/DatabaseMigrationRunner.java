package com.myanatomy.sandboxpro.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Runs once on startup to ensure schema compatibility.
 * PostgreSQL (Supabase) version — uses IF EXISTS / DO $$ syntax.
 */
@Component
public class DatabaseMigrationRunner implements ApplicationRunner {

    private static final Logger logger = LoggerFactory.getLogger(DatabaseMigrationRunner.class);

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Override
    public void run(ApplicationArguments args) {
        logger.info("Starting database migration check...");
        
        // Make email column nullable if it exists (legacy migration)
        runSafe("ALTER TABLE users ALTER COLUMN email DROP NOT NULL",
                "users.email column made nullable (or already was).");

        // Make password column nullable if it exists (legacy migration)
        runSafe("ALTER TABLE users ALTER COLUMN password DROP NOT NULL",
                "users.password column made nullable (or already was).");

        logger.info("Supabase PostgreSQL schema check complete.");
    }

    private void runSafe(String sql, String successMsg) {
        try {
            logger.debug("Executing migration: {}", sql);
            jdbcTemplate.execute(sql);
            logger.info(successMsg);
        } catch (Exception e) {
            // Column may not exist or already be nullable — safe to ignore
            logger.warn("Migration skipped (safe): {} - {}", sql, e.getMessage());
        }
    }
}
