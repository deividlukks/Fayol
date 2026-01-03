import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * PushNotificationService
 *
 * Serviço para gerenciar Push Notifications com Firebase Cloud Messaging
 *
 * Features:
 * - Solicita permissões de notificação
 * - Obtém Expo Push Token (FCM token)
 * - Configura handlers de notificação
 * - Agenda notificações locais
 * - Cancela notificações
 * - Badge management
 */

// Configuração padrão de como as notificações devem ser exibidas
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface NotificationPermissions {
  status: 'granted' | 'denied' | 'undetermined';
  canAskAgain: boolean;
  granted: boolean;
}

export interface PushToken {
  data: string;
  type: 'ios' | 'android';
}

export interface NotificationContent {
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: string | null;
  badge?: number;
}

export interface LocalNotificationTrigger {
  seconds?: number;
  repeats?: boolean;
  channelId?: string;
}

export class PushNotificationService {
  private static pushToken: string | null = null;
  private static notificationListener: Notifications.Subscription | null = null;
  private static responseListener: Notifications.Subscription | null = null;

  /**
   * Verifica se o device suporta push notifications
   */
  static async isSupported(): Promise<boolean> {
    // Push notifications não funcionam em simuladores
    if (!Device.isDevice) {
      console.warn('[PushNotificationService] Push notifications não funcionam em simulador');
      return false;
    }

    return true;
  }

  /**
   * Solicita permissões de notificação
   */
  static async requestPermissions(): Promise<NotificationPermissions> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // Se não tiver permissão, solicita
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      const granted = finalStatus === 'granted';
      const canAskAgain = finalStatus !== 'denied';

      return {
        status: finalStatus as 'granted' | 'denied' | 'undetermined',
        canAskAgain,
        granted,
      };
    } catch (error) {
      console.error('[PushNotificationService] Error requesting permissions:', error);
      return {
        status: 'denied',
        canAskAgain: false,
        granted: false,
      };
    }
  }

  /**
   * Verifica status de permissões
   */
  static async checkPermissions(): Promise<NotificationPermissions> {
    try {
      const { status, canAskAgain } = await Notifications.getPermissionsAsync();

      return {
        status: status as 'granted' | 'denied' | 'undetermined',
        canAskAgain,
        granted: status === 'granted',
      };
    } catch (error) {
      console.error('[PushNotificationService] Error checking permissions:', error);
      return {
        status: 'denied',
        canAskAgain: false,
        granted: false,
      };
    }
  }

  /**
   * Obtém Expo Push Token (FCM token)
   */
  static async getPushToken(): Promise<string | null> {
    try {
      // Verifica se é device real
      if (!Device.isDevice) {
        console.warn('[PushNotificationService] Push tokens não funcionam em simulador');
        return null;
      }

      // Verifica permissões
      const permissions = await this.checkPermissions();
      if (!permissions.granted) {
        console.warn('[PushNotificationService] Sem permissão para notificações');
        return null;
      }

      // Obtém o project ID do Expo
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;

      if (!projectId) {
        console.warn('[PushNotificationService] Project ID não configurado');
        return null;
      }

      // Obtém o token
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      this.pushToken = tokenData.data;
      return tokenData.data;
    } catch (error) {
      console.error('[PushNotificationService] Error getting push token:', error);
      return null;
    }
  }

  /**
   * Obtém device token (FCM/APNs direto - opcional)
   */
  static async getDevicePushToken(): Promise<string | null> {
    try {
      if (!Device.isDevice) {
        return null;
      }

      const deviceToken = await Notifications.getDevicePushTokenAsync();
      return deviceToken.data;
    } catch (error) {
      console.error('[PushNotificationService] Error getting device token:', error);
      return null;
    }
  }

  /**
   * Registra listeners para notificações
   */
  static registerNotificationListeners(
    onNotificationReceived: (notification: Notifications.Notification) => void,
    onNotificationResponse: (response: Notifications.NotificationResponse) => void
  ): () => void {
    // Remove listeners anteriores
    this.removeNotificationListeners();

    // Listener para notificação recebida (app em foreground)
    this.notificationListener =
      Notifications.addNotificationReceivedListener(onNotificationReceived);

    // Listener para interação com notificação (tap)
    this.responseListener =
      Notifications.addNotificationResponseReceivedListener(onNotificationResponse);

    // Retorna função para cleanup
    return () => this.removeNotificationListeners();
  }

  /**
   * Remove listeners de notificação
   */
  static removeNotificationListeners(): void {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
      this.notificationListener = null;
    }

    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
      this.responseListener = null;
    }
  }

  /**
   * Agenda uma notificação local
   */
  static async scheduleLocalNotification(
    content: NotificationContent,
    trigger: LocalNotificationTrigger
  ): Promise<string | null> {
    try {
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: content.title,
          body: content.body,
          data: content.data || {},
          sound: content.sound,
          badge: content.badge,
        },
        trigger: trigger.seconds
          ? {
              seconds: trigger.seconds,
              repeats: trigger.repeats || false,
              channelId: trigger.channelId,
            }
          : null,
      });

      return identifier;
    } catch (error) {
      console.error('[PushNotificationService] Error scheduling notification:', error);
      return null;
    }
  }

  /**
   * Cancela uma notificação agendada
   */
  static async cancelNotification(identifier: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(identifier);
    } catch (error) {
      console.error('[PushNotificationService] Error canceling notification:', error);
    }
  }

  /**
   * Cancela todas as notificações agendadas
   */
  static async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('[PushNotificationService] Error canceling all notifications:', error);
    }
  }

  /**
   * Obtém notificações agendadas
   */
  static async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('[PushNotificationService] Error getting scheduled notifications:', error);
      return [];
    }
  }

  /**
   * Define badge count (número no ícone do app)
   */
  static async setBadgeCount(count: number): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.error('[PushNotificationService] Error setting badge count:', error);
    }
  }

  /**
   * Obtém badge count atual
   */
  static async getBadgeCount(): Promise<number> {
    try {
      return await Notifications.getBadgeCountAsync();
    } catch (error) {
      console.error('[PushNotificationService] Error getting badge count:', error);
      return 0;
    }
  }

  /**
   * Limpa badge count
   */
  static async clearBadgeCount(): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(0);
    } catch (error) {
      console.error('[PushNotificationService] Error clearing badge count:', error);
    }
  }

  /**
   * Configura canal de notificação (Android)
   */
  static async setupNotificationChannel(
    channelId: string,
    channelName: string,
    importance: Notifications.AndroidImportance = Notifications.AndroidImportance.HIGH
  ): Promise<void> {
    if (Platform.OS === 'android') {
      try {
        await Notifications.setNotificationChannelAsync(channelId, {
          name: channelName,
          importance,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#4F46E5',
          lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
          sound: 'default',
          enableVibrate: true,
          showBadge: true,
        });
      } catch (error) {
        console.error('[PushNotificationService] Error setting up channel:', error);
      }
    }
  }

  /**
   * Inicialização completa do serviço
   */
  static async initialize(): Promise<{
    supported: boolean;
    permissionGranted: boolean;
    pushToken: string | null;
  }> {
    try {
      // 1. Verifica suporte
      const supported = await this.isSupported();
      if (!supported) {
        return {
          supported: false,
          permissionGranted: false,
          pushToken: null,
        };
      }

      // 2. Solicita permissões
      const permissions = await this.requestPermissions();

      if (!permissions.granted) {
        return {
          supported: true,
          permissionGranted: false,
          pushToken: null,
        };
      }

      // 3. Configura canais (Android)
      await this.setupNotificationChannel('default', 'Notificações Gerais');
      await this.setupNotificationChannel('budget-alerts', 'Alertas de Orçamento');
      await this.setupNotificationChannel('goal-alerts', 'Alertas de Metas');
      await this.setupNotificationChannel('insights', 'Insights Financeiros');

      // 4. Obtém push token
      const pushToken = await this.getPushToken();

      return {
        supported: true,
        permissionGranted: true,
        pushToken,
      };
    } catch (error) {
      console.error('[PushNotificationService] Initialization error:', error);
      return {
        supported: false,
        permissionGranted: false,
        pushToken: null,
      };
    }
  }

  /**
   * Limpa todos os dados e listeners
   */
  static cleanup(): void {
    this.removeNotificationListeners();
    this.pushToken = null;
  }
}

export default PushNotificationService;
