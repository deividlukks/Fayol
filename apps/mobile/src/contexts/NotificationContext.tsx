import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import PushNotificationService, {
  NotificationPermissions,
  NotificationContent,
  LocalNotificationTrigger,
} from '../services/PushNotificationService';
import { usersService } from '@fayol/api-client-mobile';

/**
 * NotificationContext
 *
 * Context global para gerenciar Push Notifications
 *
 * Features:
 * - Gerencia estado de permissões
 * - Armazena push token
 * - Registra listeners de notificação
 * - Fornece métodos para agendar notificações
 * - Gerencia preferências de notificação
 */

export interface NotificationPreferences {
  budgetAlerts: boolean;
  goalAlerts: boolean;
  insights: boolean;
  generalNotifications: boolean;
}

interface NotificationContextData {
  // State
  isSupported: boolean;
  permissions: NotificationPermissions | null;
  pushToken: string | null;
  isLoading: boolean;
  preferences: NotificationPreferences;
  lastNotification: Notifications.Notification | null;

  // Methods
  initialize: () => Promise<void>;
  requestPermissions: () => Promise<NotificationPermissions>;
  checkPermissions: () => Promise<NotificationPermissions>;
  registerForPushNotifications: () => Promise<string | null>;
  scheduleNotification: (
    content: NotificationContent,
    trigger: LocalNotificationTrigger
  ) => Promise<string | null>;
  cancelNotification: (identifier: string) => Promise<void>;
  cancelAllNotifications: () => Promise<void>;
  setBadgeCount: (count: number) => Promise<void>;
  clearBadgeCount: () => Promise<void>;
  updatePreferences: (preferences: Partial<NotificationPreferences>) => void;
  cleanup: () => void;
}

const NotificationContext = createContext<NotificationContextData | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [isSupported, setIsSupported] = useState(false);
  const [permissions, setPermissions] = useState<NotificationPermissions | null>(null);
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastNotification, setLastNotification] = useState<Notifications.Notification | null>(null);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    budgetAlerts: true,
    goalAlerts: true,
    insights: true,
    generalNotifications: true,
  });

  /**
   * Initialize notification service
   */
  const initialize = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await PushNotificationService.initialize();

      setIsSupported(result.supported);
      setPermissions({
        status: result.permissionGranted ? 'granted' : 'denied',
        canAskAgain: !result.permissionGranted,
        granted: result.permissionGranted,
      });
      setPushToken(result.pushToken);

      // Register notification listeners
      if (result.supported && result.permissionGranted) {
        PushNotificationService.registerNotificationListeners(
          handleNotificationReceived,
          handleNotificationResponse
        );
      }
    } catch (error) {
      console.error('[NotificationContext] Initialization error:', error);
      setIsSupported(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Handle notification received (foreground)
   */
  const handleNotificationReceived = useCallback((notification: Notifications.Notification) => {
    console.log('[NotificationContext] Notification received:', notification);
    setLastNotification(notification);
  }, []);

  /**
   * Handle notification response (user tapped)
   */
  const handleNotificationResponse = useCallback((response: Notifications.NotificationResponse) => {
    console.log('[NotificationContext] Notification response:', response);

    // Handle navigation based on notification data
    const data = response.notification.request.content.data;

    if (data?.screen) {
      // TODO: Navigate to specific screen
      console.log('[NotificationContext] Should navigate to:', data.screen);
    }

    if (data?.action) {
      // TODO: Handle specific action
      console.log('[NotificationContext] Should perform action:', data.action);
    }
  }, []);

  /**
   * Request notification permissions
   */
  const requestPermissions = useCallback(async (): Promise<NotificationPermissions> => {
    setIsLoading(true);
    try {
      const result = await PushNotificationService.requestPermissions();
      setPermissions(result);
      return result;
    } catch (error) {
      console.error('[NotificationContext] Error requesting permissions:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Check current permissions
   */
  const checkPermissions = useCallback(async (): Promise<NotificationPermissions> => {
    try {
      const result = await PushNotificationService.checkPermissions();
      setPermissions(result);
      return result;
    } catch (error) {
      console.error('[NotificationContext] Error checking permissions:', error);
      throw error;
    }
  }, []);

  /**
   * Register for push notifications and get token
   */
  const registerForPushNotifications = useCallback(async (): Promise<string | null> => {
    setIsLoading(true);
    try {
      // Check if supported
      const supported = await PushNotificationService.isSupported();
      if (!supported) {
        console.warn('[NotificationContext] Push notifications not supported');
        return null;
      }

      // Request permissions
      const perms = await PushNotificationService.requestPermissions();
      setPermissions(perms);

      if (!perms.granted) {
        console.warn('[NotificationContext] Permission not granted');
        return null;
      }

      // Get push token
      const token = await PushNotificationService.getPushToken();
      setPushToken(token);

      if (token) {
        // Send token to backend
        console.log('[NotificationContext] Push token obtained:', token);

        try {
          const deviceType = Platform.OS as 'ios' | 'android';
          const response = await usersService.registerPushToken(token, deviceType);

          if (response.success) {
            console.log('[NotificationContext] Push token registered in backend:', response.data);
          } else {
            console.error('[NotificationContext] Failed to register push token:', response.error);
          }
        } catch (error) {
          console.error('[NotificationContext] Error sending push token to backend:', error);
          // Don't throw - we still want to continue even if backend fails
        }
      }

      // Register listeners
      PushNotificationService.registerNotificationListeners(
        handleNotificationReceived,
        handleNotificationResponse
      );

      return token;
    } catch (error) {
      console.error('[NotificationContext] Error registering for push notifications:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [handleNotificationReceived, handleNotificationResponse]);

  /**
   * Schedule a local notification
   */
  const scheduleNotification = useCallback(
    async (
      content: NotificationContent,
      trigger: LocalNotificationTrigger
    ): Promise<string | null> => {
      try {
        const identifier = await PushNotificationService.scheduleLocalNotification(
          content,
          trigger
        );
        return identifier;
      } catch (error) {
        console.error('[NotificationContext] Error scheduling notification:', error);
        return null;
      }
    },
    []
  );

  /**
   * Cancel a scheduled notification
   */
  const cancelNotification = useCallback(async (identifier: string): Promise<void> => {
    try {
      await PushNotificationService.cancelNotification(identifier);
    } catch (error) {
      console.error('[NotificationContext] Error canceling notification:', error);
    }
  }, []);

  /**
   * Cancel all scheduled notifications
   */
  const cancelAllNotifications = useCallback(async (): Promise<void> => {
    try {
      await PushNotificationService.cancelAllNotifications();
    } catch (error) {
      console.error('[NotificationContext] Error canceling all notifications:', error);
    }
  }, []);

  /**
   * Set badge count
   */
  const setBadgeCount = useCallback(async (count: number): Promise<void> => {
    try {
      await PushNotificationService.setBadgeCount(count);
    } catch (error) {
      console.error('[NotificationContext] Error setting badge count:', error);
    }
  }, []);

  /**
   * Clear badge count
   */
  const clearBadgeCount = useCallback(async (): Promise<void> => {
    try {
      await PushNotificationService.clearBadgeCount();
    } catch (error) {
      console.error('[NotificationContext] Error clearing badge count:', error);
    }
  }, []);

  /**
   * Update notification preferences
   */
  const updatePreferences = useCallback((newPreferences: Partial<NotificationPreferences>) => {
    setPreferences((prev) => ({
      ...prev,
      ...newPreferences,
    }));

    // TODO: Save preferences to AsyncStorage
    // TODO: Send preferences to backend
    console.log('[NotificationContext] Preferences updated:', newPreferences);
  }, []);

  /**
   * Cleanup listeners
   */
  const cleanup = useCallback(() => {
    PushNotificationService.cleanup();
    setLastNotification(null);
  }, []);

  // Initialize on mount
  useEffect(() => {
    initialize();

    return () => {
      cleanup();
    };
  }, [initialize, cleanup]);

  const value: NotificationContextData = {
    // State
    isSupported,
    permissions,
    pushToken,
    isLoading,
    preferences,
    lastNotification,

    // Methods
    initialize,
    requestPermissions,
    checkPermissions,
    registerForPushNotifications,
    scheduleNotification,
    cancelNotification,
    cancelAllNotifications,
    setBadgeCount,
    clearBadgeCount,
    updatePreferences,
    cleanup,
  };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

/**
 * Hook para usar o NotificationContext
 */
export function useNotification() {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }

  return context;
}

export default NotificationContext;
