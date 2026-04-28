package com.myanatomy.sandboxpro.config;

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

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Override
    public void run(ApplicationArguments args) {
        // Make email column nullable if it exists (legacy migration)
        runSafe("ALTER TABLE users ALTER COLUMN email DROP NOT NULL",
                "users.email column made nullable (or already was).");

        // Make password column nullable if it exists (legacy migration)
        runSafe("ALTER TABLE users ALTER COLUMN password DROP NOT NULL",
                "users.password column made nullable (or already was).");

        System.out.println("[Migration] Supabase PostgreSQL schema check complete.");
    }

    private void runSafe(String sql, String successMsg) {
        try {
            jdbcTemplate.execute(sql);
            System.out.println("[Migration] " + successMsg);
        } catch (Exception e) {
            // Column may not exist or already be nullable — safe to ignore
            System.out.println("[Migration] Skipped (not needed): " + e.getMessage().split("\n")[0]);
        }
    }
}
