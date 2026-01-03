import * as SQLite from 'expo-sqlite';
import uuid from 'react-native-uuid';

/**
 * DatabaseService
 *
 * Gerencia banco de dados local SQLite para funcionamento offline
 *
 * Features:
 * - Inicialização e migração de schema
 * - CRUD operations para todas as entidades
 * - Sync queue management
 * - Metadata tracking
 * - Transaction support
 */

export interface SyncQueueItem {
  id: string;
  entityType: string;
  entityId: string;
  operation: 'CREATE' | 'UPDATE' | 'DELETE';
  data: any;
  createdAt: number;
  attempts: number;
  lastError?: string;
  status: 'pending' | 'processing' | 'failed' | 'completed';
}

export interface SyncMetadata {
  synced: boolean;
  lastSyncedAt?: number;
  localVersion: number;
  serverVersion?: number;
}

export class DatabaseService {
  private static instance: DatabaseService;
  private db: SQLite.SQLiteDatabase | null = null;
  private isInitialized = false;

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  /**
   * Initialize database
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('[DatabaseService] Already initialized');
      return;
    }

    try {
      console.log('[DatabaseService] Initializing database...');

      // Open or create database
      this.db = await SQLite.openDatabaseAsync('fayol.db');

      // Run schema migrations
      await this.runMigrations();

      // Set metadata
      await this.setMetadata('db_version', '1.0.0');
      await this.setMetadata('initialized_at', Date.now().toString());

      this.isInitialized = true;
      console.log('[DatabaseService] Database initialized successfully');
    } catch (error) {
      console.error('[DatabaseService] Initialization error:', error);
      throw error;
    }
  }

  /**
   * Run database migrations
   */
  private async runMigrations(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      console.log('[DatabaseService] Running migrations...');

      // For now, we'll run the schema creation directly
      // In production, you'd want a proper migration system

      const schema = `
        -- Metadata table
        CREATE TABLE IF NOT EXISTS _metadata (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
        );

        -- Sync queue
        CREATE TABLE IF NOT EXISTS _sync_queue (
          id TEXT PRIMARY KEY,
          entity_type TEXT NOT NULL,
          entity_id TEXT NOT NULL,
          operation TEXT NOT NULL,
          data TEXT NOT NULL,
          created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
          attempts INTEGER NOT NULL DEFAULT 0,
          last_error TEXT,
          status TEXT NOT NULL DEFAULT 'pending'
        );

        CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON _sync_queue(status);
        CREATE INDEX IF NOT EXISTS idx_sync_queue_entity ON _sync_queue(entity_type, entity_id);

        -- Accounts
        CREATE TABLE IF NOT EXISTS accounts (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          name TEXT NOT NULL,
          type TEXT NOT NULL,
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
          synced INTEGER NOT NULL DEFAULT 0,
          last_synced_at INTEGER,
          local_version INTEGER NOT NULL DEFAULT 1,
          server_version INTEGER DEFAULT 1
        );

        CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
        CREATE INDEX IF NOT EXISTS idx_accounts_synced ON accounts(synced);

        -- Categories
        CREATE TABLE IF NOT EXISTS categories (
          id TEXT PRIMARY KEY,
          user_id TEXT,
          name TEXT NOT NULL,
          type TEXT NOT NULL,
          icon TEXT,
          color TEXT,
          parent_id TEXT,
          is_system_default INTEGER NOT NULL DEFAULT 0,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL,
          deleted_at INTEGER,
          synced INTEGER NOT NULL DEFAULT 0,
          last_synced_at INTEGER,
          local_version INTEGER NOT NULL DEFAULT 1,
          server_version INTEGER DEFAULT 1
        );

        CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
        CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(type);

        -- Transactions
        CREATE TABLE IF NOT EXISTS transactions (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          account_id TEXT NOT NULL,
          category_id TEXT,
          type TEXT NOT NULL,
          amount REAL NOT NULL,
          description TEXT,
          date INTEGER NOT NULL,
          notes TEXT,
          tags TEXT,
          location TEXT,
          receipt_url TEXT,
          is_recurring INTEGER NOT NULL DEFAULT 0,
          recurrence_type TEXT,
          recurrence_end_date INTEGER,
          parent_transaction_id TEXT,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL,
          deleted_at INTEGER,
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

        -- Budgets
        CREATE TABLE IF NOT EXISTS budgets (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          category_id TEXT,
          name TEXT NOT NULL,
          amount REAL NOT NULL,
          period TEXT NOT NULL,
          start_date INTEGER NOT NULL,
          end_date INTEGER,
          alert_threshold REAL,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL,
          deleted_at INTEGER,
          synced INTEGER NOT NULL DEFAULT 0,
          last_synced_at INTEGER,
          local_version INTEGER NOT NULL DEFAULT 1,
          server_version INTEGER DEFAULT 1,
          FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets(user_id);
        CREATE INDEX IF NOT EXISTS idx_budgets_synced ON budgets(synced);

        -- Goals
        CREATE TABLE IF NOT EXISTS goals (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          name TEXT NOT NULL,
          description TEXT,
          target_amount REAL NOT NULL,
          current_amount REAL NOT NULL DEFAULT 0,
          target_date INTEGER,
          category TEXT,
          icon TEXT,
          color TEXT,
          is_completed INTEGER NOT NULL DEFAULT 0,
          completed_at INTEGER,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL,
          deleted_at INTEGER,
          synced INTEGER NOT NULL DEFAULT 0,
          last_synced_at INTEGER,
          local_version INTEGER NOT NULL DEFAULT 1,
          server_version INTEGER DEFAULT 1
        );

        CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
        CREATE INDEX IF NOT EXISTS idx_goals_synced ON goals(synced);
      `;

      // Execute schema creation
      await this.db.execAsync(schema);

      console.log('[DatabaseService] Migrations completed successfully');
    } catch (error) {
      console.error('[DatabaseService] Migration error:', error);
      throw error;
    }
  }

  // ==========================================
  // METADATA OPERATIONS
  // ==========================================

  async setMetadata(key: string, value: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.runAsync(
      `INSERT OR REPLACE INTO _metadata (key, value, updated_at) VALUES (?, ?, ?)`,
      [key, value, Math.floor(Date.now() / 1000)]
    );
  }

  async getMetadata(key: string): Promise<string | null> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getFirstAsync<{ value: string }>(
      `SELECT value FROM _metadata WHERE key = ?`,
      [key]
    );

    return result?.value || null;
  }

  // ==========================================
  // SYNC QUEUE OPERATIONS
  // ==========================================

  /**
   * Add operation to sync queue
   */
  async addToSyncQueue(
    entityType: string,
    entityId: string,
    operation: 'CREATE' | 'UPDATE' | 'DELETE',
    data: any
  ): Promise<string> {
    if (!this.db) throw new Error('Database not initialized');

    const id = uuid.v4() as string;
    const now = Math.floor(Date.now() / 1000);

    await this.db.runAsync(
      `INSERT INTO _sync_queue (id, entity_type, entity_id, operation, data, created_at, attempts, status)
       VALUES (?, ?, ?, ?, ?, ?, 0, 'pending')`,
      [id, entityType, entityId, operation, JSON.stringify(data), now]
    );

    console.log(`[DatabaseService] Added to sync queue: ${entityType} ${operation} ${entityId}`);
    return id;
  }

  /**
   * Get pending sync queue items
   */
  async getPendingSyncQueue(): Promise<SyncQueueItem[]> {
    if (!this.db) throw new Error('Database not initialized');

    const results = await this.db.getAllAsync<any>(
      `SELECT * FROM _sync_queue WHERE status = 'pending' ORDER BY created_at ASC`
    );

    return results.map((row) => ({
      id: row.id,
      entityType: row.entity_type,
      entityId: row.entity_id,
      operation: row.operation,
      data: JSON.parse(row.data),
      createdAt: row.created_at,
      attempts: row.attempts,
      lastError: row.last_error,
      status: row.status,
    }));
  }

  /**
   * Update sync queue item status
   */
  async updateSyncQueueStatus(
    id: string,
    status: 'processing' | 'completed' | 'failed',
    error?: string
  ): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.runAsync(
      `UPDATE _sync_queue
       SET status = ?, last_error = ?, attempts = attempts + 1
       WHERE id = ?`,
      [status, error || null, id]
    );
  }

  /**
   * Remove completed sync queue items
   */
  async clearCompletedSyncQueue(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.runAsync(`DELETE FROM _sync_queue WHERE status = 'completed'`);
  }

  /**
   * Get sync queue count
   */
  async getSyncQueueCount(): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM _sync_queue WHERE status = 'pending'`
    );

    return result?.count || 0;
  }

  // ==========================================
  // GENERIC CRUD OPERATIONS
  // ==========================================

  /**
   * Get all records from a table
   */
  async getAll<T>(table: string, where?: string, params?: any[]): Promise<T[]> {
    if (!this.db) throw new Error('Database not initialized');

    const whereClause = where ? `WHERE ${where}` : '';
    const sql = `SELECT * FROM ${table} ${whereClause} AND deleted_at IS NULL`;

    const results = await this.db.getAllAsync<T>(sql, params);
    return results;
  }

  /**
   * Get one record by ID
   */
  async getById<T>(table: string, id: string): Promise<T | null> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getFirstAsync<T>(
      `SELECT * FROM ${table} WHERE id = ? AND deleted_at IS NULL`,
      [id]
    );

    return result || null;
  }

  /**
   * Insert record
   */
  async insert<T extends Record<string, any>>(
    table: string,
    data: T,
    queueSync: boolean = true
  ): Promise<string> {
    if (!this.db) throw new Error('Database not initialized');

    const id = data.id || (uuid.v4() as string);
    const now = Math.floor(Date.now() / 1000);

    const columns = Object.keys(data);
    const placeholders = columns.map(() => '?').join(', ');
    const values = columns.map((col) => data[col]);

    // Add sync metadata
    const fullData = {
      ...data,
      id,
      created_at: now,
      updated_at: now,
      synced: 0,
      local_version: 1,
    };

    const allColumns = Object.keys(fullData);
    const allPlaceholders = allColumns.map(() => '?').join(', ');
    const allValues = allColumns.map((col) => fullData[col]);

    await this.db.runAsync(
      `INSERT INTO ${table} (${allColumns.join(', ')}) VALUES (${allPlaceholders})`,
      allValues
    );

    // Add to sync queue
    if (queueSync) {
      await this.addToSyncQueue(table, id, 'CREATE', fullData);
    }

    console.log(`[DatabaseService] Inserted into ${table}: ${id}`);
    return id;
  }

  /**
   * Update record
   */
  async update<T extends Record<string, any>>(
    table: string,
    id: string,
    data: Partial<T>,
    queueSync: boolean = true
  ): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const now = Math.floor(Date.now() / 1000);

    // Get current version
    const current = await this.getById<any>(table, id);
    const newVersion = (current?.local_version || 0) + 1;

    const updateData = {
      ...data,
      updated_at: now,
      synced: 0,
      local_version: newVersion,
    };

    const columns = Object.keys(updateData);
    const setClause = columns.map((col) => `${col} = ?`).join(', ');
    const values = [...columns.map((col) => updateData[col]), id];

    await this.db.runAsync(`UPDATE ${table} SET ${setClause} WHERE id = ?`, values);

    // Add to sync queue
    if (queueSync) {
      await this.addToSyncQueue(table, id, 'UPDATE', updateData);
    }

    console.log(`[DatabaseService] Updated ${table}: ${id}`);
  }

  /**
   * Soft delete record
   */
  async delete(table: string, id: string, queueSync: boolean = true): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const now = Math.floor(Date.now() / 1000);

    await this.db.runAsync(`UPDATE ${table} SET deleted_at = ?, synced = 0 WHERE id = ?`, [
      now,
      id,
    ]);

    // Add to sync queue
    if (queueSync) {
      await this.addToSyncQueue(table, id, 'DELETE', { id });
    }

    console.log(`[DatabaseService] Deleted from ${table}: ${id}`);
  }

  /**
   * Mark record as synced
   */
  async markAsSynced(table: string, id: string, serverVersion?: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const now = Math.floor(Date.now() / 1000);

    await this.db.runAsync(
      `UPDATE ${table} SET synced = 1, last_synced_at = ?, server_version = ? WHERE id = ?`,
      [now, serverVersion || 1, id]
    );
  }

  /**
   * Get unsynced records count
   */
  async getUnsyncedCount(table: string): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM ${table} WHERE synced = 0 AND deleted_at IS NULL`
    );

    return result?.count || 0;
  }

  /**
   * Clear all data (for logout)
   */
  async clearAll(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const tables = [
      'transactions',
      'accounts',
      'categories',
      'budgets',
      'goals',
      'investments',
      '_sync_queue',
      '_metadata',
    ];

    for (const table of tables) {
      await this.db.runAsync(`DELETE FROM ${table}`);
    }

    console.log('[DatabaseService] All data cleared');
  }

  /**
   * Close database
   */
  async close(): Promise<void> {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
      this.isInitialized = false;
      console.log('[DatabaseService] Database closed');
    }
  }
}

export default DatabaseService.getInstance();
