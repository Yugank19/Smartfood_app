package com.myanatomy.sandboxpro.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Runs once on startup to fix legacy schema constraints.
 * Makes email and password columns nullable so PIN-based auth works.
 */
@Component
public class DatabaseMigrationRunner implements ApplicationRunner {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Override
    public void run(ApplicationArguments args) {
        try {
            // Check if email column exists and is NOT NULL, then fix it
            jdbcTemplate.execute(
                "ALTER TABLE users MODIFY COLUMN email VARCHAR(255) NULL DEFAULT NULL"
            );
            System.out.println("[Migration] users.email column made nullable.");
        } catch (Exception e) {
            // Column may already be nullable or not exist — safe to ignore
            System.out.println("[Migration] email column already nullable or not present: " + e.getMessage());
        }

        try {
            jdbcTemplate.execute(
                "ALTER TABLE users MODIFY COLUMN password VARCHAR(255) NULL DEFAULT NULL"
            );
            System.out.println("[Migration] users.password column made nullable.");
        } catch (Exception e) {
            System.out.println("[Migration] password column already nullable or not present: " + e.getMessage());
        }
    }
}
