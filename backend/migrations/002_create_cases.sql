-- Migration 002: Create cases table
-- Up
CREATE TABLE IF NOT EXISTS cases (
  id TEXT PRIMARY KEY,
  case_number TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  case_type TEXT NOT NULL DEFAULT 'Criminal' CHECK (case_type IN ('Criminal', 'Civil', 'Family', 'Commercial', 'Labour')),
  status TEXT NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'Active', 'Pending', 'Closed', 'Archived')),
  priority TEXT NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
  plaintiff TEXT NOT NULL,
  defendant TEXT NOT NULL,
  presiding_officer TEXT DEFAULT '',
  hearing_date TEXT DEFAULT '',
  next_action TEXT DEFAULT '',
  description TEXT DEFAULT '',
  created_by TEXT REFERENCES users(id),
  deleted_at TEXT DEFAULT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);
CREATE INDEX IF NOT EXISTS idx_cases_type ON cases(case_type);
CREATE INDEX IF NOT EXISTS idx_cases_priority ON cases(priority);
CREATE INDEX IF NOT EXISTS idx_cases_created_at ON cases(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cases_status_type ON cases(status, case_type);
CREATE INDEX IF NOT EXISTS idx_cases_deleted ON cases(deleted_at) WHERE deleted_at IS NULL;
