-- Migration 003: Create case_logs table (audit trail)
-- Up
CREATE TABLE IF NOT EXISTS case_logs (
  id TEXT PRIMARY KEY,
  case_id TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id),
  action TEXT NOT NULL,
  note TEXT DEFAULT '',
  performed_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_case_logs_case ON case_logs(case_id);
CREATE INDEX IF NOT EXISTS idx_case_logs_performed ON case_logs(performed_at DESC);
CREATE INDEX IF NOT EXISTS idx_case_logs_user ON case_logs(user_id);
