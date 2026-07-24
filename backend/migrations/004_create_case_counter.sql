-- Migration 004: Create case_counter table (atomic case numbering)
-- Up
CREATE TABLE IF NOT EXISTS case_counter (
  year INTEGER PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0
);

-- Seed current year counter
INSERT OR IGNORE INTO case_counter (year, count) VALUES (CAST(strftime('%Y', 'now') AS INTEGER), 0);
