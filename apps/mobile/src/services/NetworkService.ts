import NetInfo, { NetInfoState, NetInfoStateType } from '@react-native-community/netinfo';

/**
 * NetworkService
 *
 * Monitora conectividade de rede
 *
 * Features:
 * - Detecta se está online/offline
 * - Monitora mudanças de conectividade
 * - Detecta tipo de conexão (WiFi, Cellular, etc)
 * - Verifica velocidade de conexão
 */

export type ConnectionType = NetInfoStateType;

export interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean;
  type: ConnectionType;
  isWifi: boolean;
  isCellular: boolean;
  isExpensive: boolean; // Celular geralmente é mais caro
}

export type NetworkChangeCallback = (status: NetworkStatus) => void;

class NetworkService {
  private static instance: NetworkService;
  private currentStatus: NetworkStatus | null = null;
  private listeners: Set<NetworkChangeCallback> = new Set();
  private unsubscribe: (() => void) | null = null;

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): NetworkService {
    if (!NetworkService.instance) {
      NetworkService.instance = new NetworkService();
    }
    return NetworkService.instance;
  }

  /**
   * Initialize network monitoring
   */
  async initialize(): Promise<void> {
    try {
      // Get current state
      const state = await NetInfo.fetch();
      this.currentStatus = this.parseNetInfoState(state);

      // Subscribe to network changes
      this.unsubscribe = NetInfo.addEventListener((state) => {
        const newStatus = this.parseNetInfoState(state);
        const statusChanged = this.hasStatusChanged(this.currentStatus, newStatus);

        this.currentStatus = newStatus;

        if (statusChanged) {
          console.log('[NetworkService] Network status changed:', newStatus);
          this.notifyListeners(newStatus);
        }
      });

      console.log('[NetworkService] Initialized with status:', this.currentStatus);
    } catch (error) {
      console.error('[NetworkService] Initialization error:', error);
      throw error;
    }
  }

  /**
   * Parse NetInfo state to our format
   */
  private parseNetInfoState(state: NetInfoState): NetworkStatus {
    return {
      isConnected: state.isConnected ?? false,
      isInternetReachable: state.isInternetReachable ?? false,
      type: state.type,
      isWifi: state.type === 'wifi',
      isCellular: state.type === 'cellular',
      isExpensive: state.type === 'cellular', // Cellular is usually expensive
    };
  }

  /**
   * Check if status has changed significantly
   */
  private hasStatusChanged(oldStatus: NetworkStatus | null, newStatus: NetworkStatus): boolean {
    if (!oldStatus) return true;

    return (
      oldStatus.isConnected !== newStatus.isConnected ||
      oldStatus.isInternetReachable !== newStatus.isInternetReachable ||
      oldStatus.type !== newStatus.type
    );
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(status: NetworkStatus): void {
    this.listeners.forEach((callback) => {
      try {
        callback(status);
      } catch (error) {
        console.error('[NetworkService] Error in listener callback:', error);
      }
    });
  }

  /**
   * Get current network status
   */
  getStatus(): NetworkStatus | null {
    return this.currentStatus;
  }

  /**
   * Check if currently online
   */
  isOnline(): boolean {
    return this.currentStatus?.isConnected && this.currentStatus?.isInternetReachable
      ? true
      : false;
  }

  /**
   * Check if currently offline
   */
  isOffline(): boolean {
    return !this.isOnline();
  }

  /**
   * Check if on WiFi
   */
  isWifi(): boolean {
    return this.currentStatus?.isWifi ?? false;
  }

  /**
   * Check if on cellular
   */
  isCellular(): boolean {
    return this.currentStatus?.isCellular ?? false;
  }

  /**
   * Check if connection is expensive (cellular)
   */
  isExpensive(): boolean {
    return this.currentStatus?.isExpensive ?? false;
  }

  /**
   * Add network change listener
   */
  addListener(callback: NetworkChangeCallback): () => void {
    this.listeners.add(callback);

    // Call immediately with current status if available
    if (this.currentStatus) {
      try {
        callback(this.currentStatus);
      } catch (error) {
        console.error('[NetworkService] Error in initial callback:', error);
      }
    }

    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Remove network change listener
   */
  removeListener(callback: NetworkChangeCallback): void {
    this.listeners.delete(callback);
  }

  /**
   * Wait for online connection
   */
  async waitForOnline(timeout: number = 30000): Promise<boolean> {
    if (this.isOnline()) {
      return true;
    }

    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        unsubscribe();
        resolve(false);
      }, timeout);

      const unsubscribe = this.addListener((status) => {
        if (status.isConnected && status.isInternetReachable) {
          clearTimeout(timeoutId);
          unsubscribe();
          resolve(true);
        }
      });
    });
  }

  /**
   * Refresh network status
   */
  async refresh(): Promise<NetworkStatus> {
    const state = await NetInfo.fetch();
    this.currentStatus = this.parseNetInfoState(state);
    return this.currentStatus;
  }

  /**
   * Cleanup listeners
   */
  cleanup(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }

    this.listeners.clear();
    this.currentStatus = null;
    console.log('[NetworkService] Cleaned up');
  }
}

export default NetworkService.getInstance();
