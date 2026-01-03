import DatabaseService, { SyncQueueItem } from '../database/DatabaseService';
import NetworkService from './NetworkService';
import {
  accountsService,
  transactionsService,
  budgetsService,
  goalsService,
} from '@fayol/api-client-mobile';

/**
 * SyncEngine
 *
 * Motor de sincronização offline-first
 *
 * Features:
 * - Push local changes to server
 * - Pull server changes to local DB
 * - Conflict resolution (server wins by default)
 * - Retry logic for failed syncs
 * - Background sync when online
 * - Optimistic UI updates
 */

export type SyncStatus = 'idle' | 'syncing' | 'error' | 'completed';

export interface SyncProgress {
  status: SyncStatus;
  totalItems: number;
  syncedItems: number;
  failedItems: number;
  lastSync: Date | null;
  lastError: string | null;
}

export type SyncCallback = (progress: SyncProgress) => void;

export interface ConflictResolution {
  strategy: 'server-wins' | 'client-wins' | 'merge';
  mergeFunction?: (local: any, server: any) => any;
}

class SyncEngine {
  private static instance: SyncEngine;
  private db = DatabaseService;
  private network = NetworkService;
  private isSyncing = false;
  private syncProgress: SyncProgress = {
    status: 'idle',
    totalItems: 0,
    syncedItems: 0,
    failedItems: 0,
    lastSync: null,
    lastError: null,
  };
  private listeners: Set<SyncCallback> = new Set();
  private conflictResolution: ConflictResolution = {
    strategy: 'server-wins', // Default: server always wins
  };

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): SyncEngine {
    if (!SyncEngine.instance) {
      SyncEngine.instance = new SyncEngine();
    }
    return SyncEngine.instance;
  }

  /**
   * Initialize sync engine
   */
  async initialize(): Promise<void> {
    console.log('[SyncEngine] Initializing...');

    // Listen to network changes
    this.network.addListener(async (status) => {
      if (status.isConnected && status.isInternetReachable) {
        console.log('[SyncEngine] Network connected, triggering sync...');
        await this.sync();
      }
    });

    console.log('[SyncEngine] Initialized successfully');
  }

  /**
   * Full synchronization (pull + push)
   */
  async sync(force: boolean = false): Promise<void> {
    if (this.isSyncing && !force) {
      console.log('[SyncEngine] Sync already in progress');
      return;
    }

    if (!this.network.isOnline()) {
      console.log('[SyncEngine] Cannot sync - offline');
      this.updateProgress({ status: 'error', lastError: 'Offline' });
      return;
    }

    try {
      this.isSyncing = true;
      this.updateProgress({ status: 'syncing', totalItems: 0, syncedItems: 0, failedItems: 0 });

      console.log('[SyncEngine] Starting full sync...');

      // Step 1: Push local changes to server
      await this.pushLocalChanges();

      // Step 2: Pull server changes to local
      await this.pullServerChanges();

      this.updateProgress({
        status: 'completed',
        lastSync: new Date(),
        lastError: null,
      });

      console.log('[SyncEngine] Full sync completed successfully');
    } catch (error) {
      console.error('[SyncEngine] Sync error:', error);
      this.updateProgress({
        status: 'error',
        lastError: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Push local changes to server
   */
  private async pushLocalChanges(): Promise<void> {
    console.log('[SyncEngine] Pushing local changes to server...');

    const queue = await this.db.getPendingSyncQueue();

    if (queue.length === 0) {
      console.log('[SyncEngine] No local changes to push');
      return;
    }

    console.log(`[SyncEngine] Found ${queue.length} items to push`);
    this.updateProgress({ totalItems: queue.length });

    let synced = 0;
    let failed = 0;

    for (const item of queue) {
      try {
        await this.pushSyncQueueItem(item);
        await this.db.updateSyncQueueStatus(item.id, 'completed');
        synced++;
        this.updateProgress({ syncedItems: synced });
      } catch (error) {
        console.error(`[SyncEngine] Failed to push item ${item.id}:`, error);
        await this.db.updateSyncQueueStatus(
          item.id,
          'failed',
          error instanceof Error ? error.message : 'Unknown error'
        );
        failed++;
        this.updateProgress({ failedItems: failed });

        // Continue with other items even if one fails
      }
    }

    // Clean up completed items
    await this.db.clearCompletedSyncQueue();

    console.log(`[SyncEngine] Push completed: ${synced} synced, ${failed} failed`);
  }

  /**
   * Push single sync queue item to server
   */
  private async pushSyncQueueItem(item: SyncQueueItem): Promise<void> {
    const { entityType, entityId, operation, data } = item;

    console.log(`[SyncEngine] Pushing ${entityType} ${operation} ${entityId}`);

    switch (entityType) {
      case 'accounts':
        await this.pushAccount(entityId, operation, data);
        break;
      case 'transactions':
        await this.pushTransaction(entityId, operation, data);
        break;
      case 'budgets':
        await this.pushBudget(entityId, operation, data);
        break;
      case 'goals':
        await this.pushGoal(entityId, operation, data);
        break;
      default:
        console.warn(`[SyncEngine] Unknown entity type: ${entityType}`);
    }
  }

  /**
   * Push account to server
   */
  private async pushAccount(
    id: string,
    operation: 'CREATE' | 'UPDATE' | 'DELETE',
    data: any
  ): Promise<void> {
    switch (operation) {
      case 'CREATE':
        await accountsService.post('/accounts', data);
        break;
      case 'UPDATE':
        await accountsService.patch(`/accounts/${id}`, data);
        break;
      case 'DELETE':
        await accountsService.delete(`/accounts/${id}`);
        break;
    }

    // Mark as synced in local DB
    await this.db.markAsSynced('accounts', id);
  }

  /**
   * Push transaction to server
   */
  private async pushTransaction(
    id: string,
    operation: 'CREATE' | 'UPDATE' | 'DELETE',
    data: any
  ): Promise<void> {
    switch (operation) {
      case 'CREATE':
        await transactionsService.post('/transactions', data);
        break;
      case 'UPDATE':
        await transactionsService.patch(`/transactions/${id}`, data);
        break;
      case 'DELETE':
        await transactionsService.delete(`/transactions/${id}`);
        break;
    }

    await this.db.markAsSynced('transactions', id);
  }

  /**
   * Push budget to server
   */
  private async pushBudget(
    id: string,
    operation: 'CREATE' | 'UPDATE' | 'DELETE',
    data: any
  ): Promise<void> {
    switch (operation) {
      case 'CREATE':
        await budgetsService.post('/budgets', data);
        break;
      case 'UPDATE':
        await budgetsService.patch(`/budgets/${id}`, data);
        break;
      case 'DELETE':
        await budgetsService.delete(`/budgets/${id}`);
        break;
    }

    await this.db.markAsSynced('budgets', id);
  }

  /**
   * Push goal to server
   */
  private async pushGoal(
    id: string,
    operation: 'CREATE' | 'UPDATE' | 'DELETE',
    data: any
  ): Promise<void> {
    switch (operation) {
      case 'CREATE':
        await goalsService.post('/goals', data);
        break;
      case 'UPDATE':
        await goalsService.patch(`/goals/${id}`, data);
        break;
      case 'DELETE':
        await goalsService.delete(`/goals/${id}`);
        break;
    }

    await this.db.markAsSynced('goals', id);
  }

  /**
   * Pull server changes to local DB
   */
  private async pullServerChanges(): Promise<void> {
    console.log('[SyncEngine] Pulling server changes to local...');

    try {
      // Get last sync timestamp
      const lastSyncStr = await this.db.getMetadata('last_pull_sync');
      const lastSync = lastSyncStr ? parseInt(lastSyncStr) : 0;

      // Pull all entities
      await this.pullAccounts(lastSync);
      await this.pullCategories(lastSync);
      await this.pullTransactions(lastSync);
      await this.pullBudgets(lastSync);
      await this.pullGoals(lastSync);

      // Update last sync timestamp
      await this.db.setMetadata('last_pull_sync', Date.now().toString());

      console.log('[SyncEngine] Pull completed successfully');
    } catch (error) {
      console.error('[SyncEngine] Pull error:', error);
      throw error;
    }
  }

  /**
   * Pull accounts from server
   */
  private async pullAccounts(lastSync: number): Promise<void> {
    try {
      const response = await accountsService.get('/accounts');

      if (response.success && response.data) {
        const accounts = Array.isArray(response.data) ? response.data : [response.data];

        for (const account of accounts) {
          const local = await this.db.getById('accounts', account.id);

          if (!local) {
            // New account from server - insert
            await this.db.insert('accounts', this.transformAccountFromAPI(account), false);
          } else {
            // Existing account - check for conflicts
            if (await this.shouldUpdateFromServer(local, account)) {
              await this.db.update(
                'accounts',
                account.id,
                this.transformAccountFromAPI(account),
                false
              );
            }
          }
        }
      }
    } catch (error) {
      console.error('[SyncEngine] Failed to pull accounts:', error);
    }
  }

  /**
   * Pull categories from server
   */
  private async pullCategories(lastSync: number): Promise<void> {
    // Similar to pullAccounts - implement as needed
    console.log('[SyncEngine] Pulling categories (TODO)');
  }

  /**
   * Pull transactions from server
   */
  private async pullTransactions(lastSync: number): Promise<void> {
    try {
      const response = await transactionsService.get('/transactions');

      if (response.success && response.data) {
        const transactions = Array.isArray(response.data) ? response.data : [response.data];

        for (const transaction of transactions) {
          const local = await this.db.getById('transactions', transaction.id);

          if (!local) {
            await this.db.insert(
              'transactions',
              this.transformTransactionFromAPI(transaction),
              false
            );
          } else {
            if (await this.shouldUpdateFromServer(local, transaction)) {
              await this.db.update(
                'transactions',
                transaction.id,
                this.transformTransactionFromAPI(transaction),
                false
              );
            }
          }
        }
      }
    } catch (error) {
      console.error('[SyncEngine] Failed to pull transactions:', error);
    }
  }

  /**
   * Pull budgets from server
   */
  private async pullBudgets(lastSync: number): Promise<void> {
    try {
      const response = await budgetsService.get('/budgets');

      if (response.success && response.data) {
        const budgets = Array.isArray(response.data) ? response.data : [response.data];

        for (const budget of budgets) {
          const local = await this.db.getById('budgets', budget.id);

          if (!local) {
            await this.db.insert('budgets', this.transformBudgetFromAPI(budget), false);
          } else {
            if (await this.shouldUpdateFromServer(local, budget)) {
              await this.db.update(
                'budgets',
                budget.id,
                this.transformBudgetFromAPI(budget),
                false
              );
            }
          }
        }
      }
    } catch (error) {
      console.error('[SyncEngine] Failed to pull budgets:', error);
    }
  }

  /**
   * Pull goals from server
   */
  private async pullGoals(lastSync: number): Promise<void> {
    try {
      const response = await goalsService.get('/goals');

      if (response.success && response.data) {
        const goals = Array.isArray(response.data) ? response.data : [response.data];

        for (const goal of goals) {
          const local = await this.db.getById('goals', goal.id);

          if (!local) {
            await this.db.insert('goals', this.transformGoalFromAPI(goal), false);
          } else {
            if (await this.shouldUpdateFromServer(local, goal)) {
              await this.db.update('goals', goal.id, this.transformGoalFromAPI(goal), false);
            }
          }
        }
      }
    } catch (error) {
      console.error('[SyncEngine] Failed to pull goals:', error);
    }
  }

  /**
   * Determine if local should be updated from server (conflict resolution)
   */
  private async shouldUpdateFromServer(local: any, server: any): Promise<boolean> {
    // If local is synced, always update from server
    if (local.synced === 1) {
      return true;
    }

    // If local has changes, apply conflict resolution strategy
    switch (this.conflictResolution.strategy) {
      case 'server-wins':
        return true; // Server always wins
      case 'client-wins':
        return false; // Client always wins
      case 'merge':
        // TODO: Implement merge strategy
        return true;
      default:
        return true;
    }
  }

  /**
   * Transform API account to DB format
   */
  private transformAccountFromAPI(account: any): any {
    return {
      id: account.id,
      user_id: account.userId,
      name: account.name,
      type: account.type,
      balance: parseFloat(account.balance),
      credit_limit: account.creditLimit ? parseFloat(account.creditLimit) : null,
      currency: account.currency || 'BRL',
      color: account.color,
      icon: account.icon,
      is_archived: account.isArchived ? 1 : 0,
      bank_connection_id: account.bankConnectionId,
      created_at: new Date(account.createdAt).getTime() / 1000,
      updated_at: new Date(account.updatedAt).getTime() / 1000,
      deleted_at: account.deletedAt ? new Date(account.deletedAt).getTime() / 1000 : null,
      synced: 1,
      last_synced_at: Math.floor(Date.now() / 1000),
      server_version: 1,
    };
  }

  /**
   * Transform API transaction to DB format
   */
  private transformTransactionFromAPI(transaction: any): any {
    return {
      id: transaction.id,
      user_id: transaction.userId,
      account_id: transaction.accountId,
      category_id: transaction.categoryId,
      type: transaction.type,
      amount: parseFloat(transaction.amount),
      description: transaction.description,
      date: new Date(transaction.date).getTime() / 1000,
      notes: transaction.notes,
      tags: JSON.stringify(transaction.tags || []),
      location: transaction.location ? JSON.stringify(transaction.location) : null,
      receipt_url: transaction.receiptUrl,
      is_recurring: transaction.isRecurring ? 1 : 0,
      recurrence_type: transaction.recurrenceType,
      recurrence_end_date: transaction.recurrenceEndDate
        ? new Date(transaction.recurrenceEndDate).getTime() / 1000
        : null,
      parent_transaction_id: transaction.parentTransactionId,
      created_at: new Date(transaction.createdAt).getTime() / 1000,
      updated_at: new Date(transaction.updatedAt).getTime() / 1000,
      deleted_at: transaction.deletedAt ? new Date(transaction.deletedAt).getTime() / 1000 : null,
      synced: 1,
      last_synced_at: Math.floor(Date.now() / 1000),
      server_version: 1,
    };
  }

  /**
   * Transform API budget to DB format
   */
  private transformBudgetFromAPI(budget: any): any {
    return {
      id: budget.id,
      user_id: budget.userId,
      category_id: budget.categoryId,
      name: budget.name,
      amount: parseFloat(budget.amount),
      period: budget.period,
      start_date: new Date(budget.startDate).getTime() / 1000,
      end_date: budget.endDate ? new Date(budget.endDate).getTime() / 1000 : null,
      alert_threshold: budget.alertThreshold ? parseFloat(budget.alertThreshold) : null,
      created_at: new Date(budget.createdAt).getTime() / 1000,
      updated_at: new Date(budget.updatedAt).getTime() / 1000,
      deleted_at: budget.deletedAt ? new Date(budget.deletedAt).getTime() / 1000 : null,
      synced: 1,
      last_synced_at: Math.floor(Date.now() / 1000),
      server_version: 1,
    };
  }

  /**
   * Transform API goal to DB format
   */
  private transformGoalFromAPI(goal: any): any {
    return {
      id: goal.id,
      user_id: goal.userId,
      name: goal.name,
      description: goal.description,
      target_amount: parseFloat(goal.targetAmount),
      current_amount: parseFloat(goal.currentAmount),
      target_date: goal.targetDate ? new Date(goal.targetDate).getTime() / 1000 : null,
      category: goal.category,
      icon: goal.icon,
      color: goal.color,
      is_completed: goal.isCompleted ? 1 : 0,
      completed_at: goal.completedAt ? new Date(goal.completedAt).getTime() / 1000 : null,
      created_at: new Date(goal.createdAt).getTime() / 1000,
      updated_at: new Date(goal.updatedAt).getTime() / 1000,
      deleted_at: goal.deletedAt ? new Date(goal.deletedAt).getTime() / 1000 : null,
      synced: 1,
      last_synced_at: Math.floor(Date.now() / 1000),
      server_version: 1,
    };
  }

  /**
   * Update sync progress and notify listeners
   */
  private updateProgress(update: Partial<SyncProgress>): void {
    this.syncProgress = {
      ...this.syncProgress,
      ...update,
    };

    this.listeners.forEach((callback) => {
      try {
        callback(this.syncProgress);
      } catch (error) {
        console.error('[SyncEngine] Error in progress callback:', error);
      }
    });
  }

  /**
   * Add sync progress listener
   */
  addListener(callback: SyncCallback): () => void {
    this.listeners.add(callback);

    // Call immediately with current progress
    try {
      callback(this.syncProgress);
    } catch (error) {
      console.error('[SyncEngine] Error in initial callback:', error);
    }

    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Get current sync progress
   */
  getProgress(): SyncProgress {
    return this.syncProgress;
  }

  /**
   * Check if currently syncing
   */
  isSyncInProgress(): boolean {
    return this.isSyncing;
  }

  /**
   * Set conflict resolution strategy
   */
  setConflictResolution(resolution: ConflictResolution): void {
    this.conflictResolution = resolution;
  }

  /**
   * Cleanup
   */
  cleanup(): void {
    this.listeners.clear();
    console.log('[SyncEngine] Cleaned up');
  }
}

export default SyncEngine.getInstance();
