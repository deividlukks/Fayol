-- ==========================================
-- Fayol Mobile - Local Database Schema (SQLite)
-- ==========================================

-- Metadata table for tracking sync status
CREATE TABLE IF NOT EXISTS _metadata (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

-- Sync queue for pending operations
CREATE TABLE IF NOT EXISTS _sync_queue (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL, -- 'transaction', 'account', 'budget', etc.
  entity_id TEXT NOT NULL,
  operation TEXT NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE'
  data TEXT NOT NULL, -- JSON payload
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  status TEXT NOT NULL DEFAULT 'pending' -- 'pending', 'processing', 'failed', 'completed'
);

CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON _sync_queue(status);
CREATE INDEX IF NOT EXISTS idx_sync_queue_entity ON _sync_queue(entity_type, entity_id);

-- ==========================================
-- ACCOUNTS
-- ==========================================
CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'CHECKING', 'SAVINGS', 'INVESTMENT', 'CASH', 'CREDIT_CARD', 'OTHER'
  balance REAL NOT NULL DEFAULT 0.00,
  credit_limit REAL,
  currency TEXT NOT NULL DEFAULT 'BRL',
  color TEXT,
  icon TEXT,
  is_archived INTEGER NOT NULL DEFAULT 0,
  bank_connection_id TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER,

  -- Sync metadata
  synced INTEGER NOT NULL DEFAULT 0, -- 0 = not synced, 1 = synced
  last_synced_at INTEGER,
  local_version INTEGER NOT NULL DEFAULT 1, -- Increments on local changes
  server_version INTEGER DEFAULT 1 -- Version from server
);

CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_synced ON accounts(synced);

-- ==========================================
-- CATEGORIES
-- ==========================================
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'INCOME', 'EXPENSE', 'TRANSFER'
  icon TEXT,
  color TEXT,
  parent_id TEXT,
  is_system_default INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER,

  -- Sync metadata
  synced INTEGER NOT NULL DEFAULT 0,
  last_synced_at INTEGER,
  local_version INTEGER NOT NULL DEFAULT 1,
  server_version INTEGER DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(type);

-- ==========================================
-- TRANSACTIONS
-- ==========================================
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  account_id TEXT NOT NULL,
  category_id TEXT,
  type TEXT NOT NULL, -- 'INCOME', 'EXPENSE', 'TRANSFER'
  amount REAL NOT NULL,
  description TEXT,
  date INTEGER NOT NULL, -- Unix timestamp
  notes TEXT,
  tags TEXT, -- JSON array
  location TEXT, -- JSON object: {coordinates: {latitude, longitude, altitude, accuracy, timestamp}, address: {street, city, region, country, formattedAddress}, capturedAt}
  receipt_url TEXT,
  is_recurring INTEGER NOT NULL DEFAULT 0,
  recurrence_type TEXT, -- 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY', 'CUSTOM'
  recurrence_end_date INTEGER,
  parent_transaction_id TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER,

  -- Sync metadata
  synced INTEGER NOT NULL DEFAULT 0,
  last_synced_at INTEGER,
  local_version INTEGER NOT NULL DEFAULT 1,
  server_version INTEGER DEFAULT 1,

  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_synced ON transactions(synced);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);

-- ==========================================
-- BUDGETS
-- ==========================================
CREATE TABLE IF NOT EXISTS budgets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  category_id TEXT,
  name TEXT NOT NULL,
  amount REAL NOT NULL,
  period TEXT NOT NULL, -- 'MONTHLY', 'WEEKLY', 'YEARLY'
  start_date INTEGER NOT NULL,
  end_date INTEGER,
  alert_threshold REAL, -- 0.0 to 1.0 (percentage)
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER,

  -- Sync metadata
  synced INTEGER NOT NULL DEFAULT 0,
  last_synced_at INTEGER,
  local_version INTEGER NOT NULL DEFAULT 1,
  server_version INTEGER DEFAULT 1,

  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_synced ON budgets(synced);

-- ==========================================
-- GOALS
-- ==========================================
CREATE TABLE IF NOT EXISTS goals (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  target_amount REAL NOT NULL,
  current_amount REAL NOT NULL DEFAULT 0,
  target_date INTEGER,
  category TEXT, -- 'SAVINGS', 'PURCHASE', 'EMERGENCY', 'INVESTMENT', 'DEBT', 'OTHER'
  icon TEXT,
  color TEXT,
  is_completed INTEGER NOT NULL DEFAULT 0,
  completed_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER,

  -- Sync metadata
  synced INTEGER NOT NULL DEFAULT 0,
  last_synced_at INTEGER,
  local_version INTEGER NOT NULL DEFAULT 1,
  server_version INTEGER DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_synced ON goals(synced);

-- ==========================================
-- INVESTMENTS
-- ==========================================
CREATE TABLE IF NOT EXISTS investments (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  account_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'STOCK_BR', 'STOCK_US', 'FII', 'CRYPTO', 'FIXED_INCOME', 'ETF', 'OTHER'
  ticker TEXT,
  quantity REAL NOT NULL,
  avg_price REAL NOT NULL,
  current_price REAL,
  currency TEXT NOT NULL DEFAULT 'BRL',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER,

  -- Sync metadata
  synced INTEGER NOT NULL DEFAULT 0,
  last_synced_at INTEGER,
  local_version INTEGER NOT NULL DEFAULT 1,
  server_version INTEGER DEFAULT 1,

  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_investments_user_id ON investments(user_id);
CREATE INDEX IF NOT EXISTS idx_investments_account_id ON investments(account_id);
CREATE INDEX IF NOT EXISTS idx_investments_synced ON investments(synced);

-- ==========================================
-- AI INSIGHTS (Cache)
-- ==========================================
CREATE TABLE IF NOT EXISTS ai_insights (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL, -- 'SPENDING_PATTERN', 'BUDGET_ALERT', 'GOAL_PROGRESS', 'ANOMALY', 'FORECAST'
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  data TEXT, -- JSON metadata
  severity TEXT, -- 'INFO', 'WARNING', 'CRITICAL'
  is_read INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  expires_at INTEGER, -- TTL for cached insights

  -- No sync needed - generated server-side and cached locally
  cached_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_insights_user_id ON ai_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_insights_read ON ai_insights(is_read);
CREATE INDEX IF NOT EXISTS idx_insights_expires_at ON ai_insights(expires_at);

-- ==========================================
-- HELPER VIEWS
-- ==========================================

-- View for unsynced entities
CREATE VIEW IF NOT EXISTS v_unsynced_entities AS
SELECT 'account' as entity_type, id as entity_id, local_version, server_version, updated_at
FROM accounts WHERE synced = 0 AND deleted_at IS NULL
UNION ALL
SELECT 'category', id, local_version, server_version, updated_at
FROM categories WHERE synced = 0 AND deleted_at IS NULL
UNION ALL
SELECT 'transaction', id, local_version, server_version, updated_at
FROM transactions WHERE synced = 0 AND deleted_at IS NULL
UNION ALL
SELECT 'budget', id, local_version, server_version, updated_at
FROM budgets WHERE synced = 0 AND deleted_at IS NULL
UNION ALL
SELECT 'goal', id, local_version, server_version, updated_at
FROM goals WHERE synced = 0 AND deleted_at IS NULL
UNION ALL
SELECT 'investment', id, local_version, server_version, updated_at
FROM investments WHERE synced = 0 AND deleted_at IS NULL;

-- View for pending sync queue items
CREATE VIEW IF NOT EXISTS v_pending_sync AS
SELECT * FROM _sync_queue
WHERE status = 'pending'
ORDER BY created_at ASC;

-- View for recent transactions (last 30 days)
CREATE VIEW IF NOT EXISTS v_recent_transactions AS
SELECT * FROM transactions
WHERE deleted_at IS NULL
  AND date >= strftime('%s', 'now', '-30 days')
ORDER BY date DESC, created_at DESC;
