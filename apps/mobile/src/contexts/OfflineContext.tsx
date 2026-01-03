import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import DatabaseService from '../database/DatabaseService';
import NetworkService, { NetworkStatus } from '../services/NetworkService';
import SyncEngine, { SyncProgress } from '../services/SyncEngine';

/**
 * OfflineContext
 *
 * Context global para gerenciar funcionalidade offline-first
 *
 * Features:
 * - Detecta conectividade de rede
 * - Gerencia banco de dados local
 * - Sincroniza dados automaticamente
 * - Fornece status de sincronização
 * - Queue de operações pendentes
 */

interface OfflineContextData {
  // Network status
  isOnline: boolean;
  isOffline: boolean;
  networkStatus: NetworkStatus | null;

  // Database status
  isDatabaseReady: boolean;

  // Sync status
  syncProgress: SyncProgress;
  isSyncing: boolean;
  pendingChanges: number;

  // Methods
  initialize: () => Promise<void>;
  sync: (force?: boolean) => Promise<void>;
  refreshNetwork: () => Promise<void>;
  clearLocalData: () => Promise<void>;
}

const OfflineContext = createContext<OfflineContextData | undefined>(undefined);

interface OfflineProviderProps {
  children: ReactNode;
}

export function OfflineProvider({ children }: OfflineProviderProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus | null>(null);
  const [isDatabaseReady, setIsDatabaseReady] = useState(false);
  const [syncProgress, setSyncProgress] = useState<SyncProgress>({
    status: 'idle',
    totalItems: 0,
    syncedItems: 0,
    failedItems: 0,
    lastSync: null,
    lastError: null,
  });
  const [pendingChanges, setPendingChanges] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);

  /**
   * Initialize offline functionality
   */
  const initialize = useCallback(async () => {
    if (isInitialized) {
      console.log('[OfflineContext] Already initialized');
      return;
    }

    try {
      console.log('[OfflineContext] Initializing offline functionality...');

      // 1. Initialize database
      await DatabaseService.initialize();
      setIsDatabaseReady(true);
      console.log('[OfflineContext] Database initialized');

      // 2. Initialize network service
      await NetworkService.initialize();
      const initialNetworkStatus = NetworkService.getStatus();
      setNetworkStatus(initialNetworkStatus);
      setIsOnline(NetworkService.isOnline());
      console.log('[OfflineContext] Network service initialized:', initialNetworkStatus);

      // 3. Initialize sync engine
      await SyncEngine.initialize();
      console.log('[OfflineContext] Sync engine initialized');

      // 4. Get initial pending changes count
      const count = await DatabaseService.getSyncQueueCount();
      setPendingChanges(count);
      console.log(`[OfflineContext] Found ${count} pending changes`);

      setIsInitialized(true);
      console.log('[OfflineContext] Initialization completed successfully');
    } catch (error) {
      console.error('[OfflineContext] Initialization error:', error);
      throw error;
    }
  }, [isInitialized]);

  /**
   * Handle network status changes
   */
  const handleNetworkChange = useCallback((status: NetworkStatus) => {
    console.log('[OfflineContext] Network status changed:', status);
    setNetworkStatus(status);
    setIsOnline(status.isConnected && status.isInternetReachable);

    // Show notification when going offline/online
    if (status.isConnected && status.isInternetReachable) {
      console.log('[OfflineContext] ✅ Back online');
    } else {
      console.log('[OfflineContext] ⚠️ Now offline');
    }
  }, []);

  /**
   * Handle sync progress updates
   */
  const handleSyncProgress = useCallback(async (progress: SyncProgress) => {
    console.log('[OfflineContext] Sync progress:', progress);
    setSyncProgress(progress);

    // Update pending changes count after sync
    if (progress.status === 'completed' || progress.status === 'error') {
      try {
        const count = await DatabaseService.getSyncQueueCount();
        setPendingChanges(count);
      } catch (error) {
        console.error('[OfflineContext] Error updating pending count:', error);
      }
    }
  }, []);

  /**
   * Trigger manual sync
   */
  const sync = useCallback(
    async (force: boolean = false) => {
      if (!isDatabaseReady) {
        console.warn('[OfflineContext] Database not ready for sync');
        return;
      }

      if (!isOnline && !force) {
        console.warn('[OfflineContext] Cannot sync while offline');
        return;
      }

      try {
        console.log('[OfflineContext] Starting manual sync...');
        await SyncEngine.sync(force);
      } catch (error) {
        console.error('[OfflineContext] Manual sync error:', error);
        throw error;
      }
    },
    [isDatabaseReady, isOnline]
  );

  /**
   * Refresh network status
   */
  const refreshNetwork = useCallback(async () => {
    const status = await NetworkService.refresh();
    setNetworkStatus(status);
    setIsOnline(status.isConnected && status.isInternetReachable);
  }, []);

  /**
   * Clear all local data (for logout)
   */
  const clearLocalData = useCallback(async () => {
    try {
      console.log('[OfflineContext] Clearing local data...');
      await DatabaseService.clearAll();
      setPendingChanges(0);
      console.log('[OfflineContext] Local data cleared');
    } catch (error) {
      console.error('[OfflineContext] Error clearing local data:', error);
      throw error;
    }
  }, []);

  /**
   * Setup listeners on mount
   */
  useEffect(() => {
    // Network listener
    const unsubscribeNetwork = NetworkService.addListener(handleNetworkChange);

    // Sync progress listener
    const unsubscribeSync = SyncEngine.addListener(handleSyncProgress);

    // Periodic pending changes update
    const interval = setInterval(async () => {
      if (isDatabaseReady) {
        try {
          const count = await DatabaseService.getSyncQueueCount();
          setPendingChanges(count);
        } catch (error) {
          console.error('[OfflineContext] Error updating pending count:', error);
        }
      }
    }, 10000); // Every 10 seconds

    return () => {
      unsubscribeNetwork();
      unsubscribeSync();
      clearInterval(interval);
    };
  }, [handleNetworkChange, handleSyncProgress, isDatabaseReady]);

  /**
   * Initialize on mount
   */
  useEffect(() => {
    initialize();
  }, [initialize]);

  const value: OfflineContextData = {
    // Network status
    isOnline,
    isOffline: !isOnline,
    networkStatus,

    // Database status
    isDatabaseReady,

    // Sync status
    syncProgress,
    isSyncing: syncProgress.status === 'syncing',
    pendingChanges,

    // Methods
    initialize,
    sync,
    refreshNetwork,
    clearLocalData,
  };

  return <OfflineContext.Provider value={value}>{children}</OfflineContext.Provider>;
}

/**
 * Hook to use offline context
 */
export function useOffline() {
  const context = useContext(OfflineContext);

  if (!context) {
    throw new Error('useOffline must be used within OfflineProvider');
  }

  return context;
}

export default OfflineContext;
