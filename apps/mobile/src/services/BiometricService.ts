import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * BiometricService
 *
 * Serviço para gerenciar autenticação biométrica (Face ID, Touch ID, Fingerprint)
 *
 * Features:
 * - Verifica disponibilidade de biometria no device
 * - Identifica tipos de biometria suportados
 * - Executa autenticação biométrica
 * - Armazena credenciais de forma segura (Secure Store)
 * - Habilita/desabilita biometria para o usuário
 */

const BIOMETRIC_ENABLED_KEY = 'biometric_enabled';
const USER_CREDENTIALS_KEY = 'user_credentials';

export interface BiometricType {
  faceId: boolean;
  touchId: boolean;
  fingerprint: boolean;
  iris: boolean;
}

export interface UserCredentials {
  email: string;
  password: string; // Encrypted
}

export class BiometricService {
  /**
   * Verifica se o device suporta autenticação biométrica
   */
  static async isAvailable(): Promise<boolean> {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      if (!compatible) {
        return false;
      }

      const enrolled = await LocalAuthentication.isEnrolledAsync();
      return enrolled;
    } catch (error) {
      console.error('[BiometricService] Error checking availability:', error);
      return false;
    }
  }

  /**
   * Retorna os tipos de biometria disponíveis no device
   */
  static async getAvailableTypes(): Promise<BiometricType> {
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();

    return {
      faceId: types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION),
      touchId: types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT),
      fingerprint: types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT),
      iris: types.includes(LocalAuthentication.AuthenticationType.IRIS),
    };
  }

  /**
   * Retorna o nome amigável do tipo de biometria principal
   */
  static async getBiometricTypeName(): Promise<string> {
    const types = await this.getAvailableTypes();

    if (types.faceId) {
      return Platform.OS === 'ios' ? 'Face ID' : 'Reconhecimento Facial';
    }

    if (types.touchId || types.fingerprint) {
      return Platform.OS === 'ios' ? 'Touch ID' : 'Impressão Digital';
    }

    if (types.iris) {
      return 'Reconhecimento de Íris';
    }

    return 'Biometria';
  }

  /**
   * Executa autenticação biométrica
   */
  static async authenticate(promptMessage?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const isAvailable = await this.isAvailable();

      if (!isAvailable) {
        return {
          success: false,
          error: 'Biometria não disponível neste dispositivo',
        };
      }

      const biometricType = await this.getBiometricTypeName();

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: promptMessage || `Autentique-se com ${biometricType}`,
        fallbackLabel: 'Usar senha',
        cancelLabel: 'Cancelar',
        disableDeviceFallback: false, // Permite fallback para PIN/senha do device
      });

      if (result.success) {
        return { success: true };
      }

      // Tratamento de erros específicos
      let errorMessage = 'Autenticação falhou';

      if (result.error === 'user_cancel') {
        errorMessage = 'Autenticação cancelada pelo usuário';
      } else if (result.error === 'not_enrolled') {
        errorMessage = 'Nenhuma biometria cadastrada no dispositivo';
      } else if (result.error === 'lockout') {
        errorMessage = 'Muitas tentativas. Dispositivo bloqueado.';
      } else if (result.error === 'system_cancel') {
        errorMessage = 'Autenticação cancelada pelo sistema';
      } else if (result.error === 'app_cancel') {
        errorMessage = 'Autenticação cancelada';
      }

      return {
        success: false,
        error: errorMessage,
      };
    } catch (error) {
      console.error('[BiometricService] Authentication error:', error);
      return {
        success: false,
        error: 'Erro ao autenticar. Tente novamente.',
      };
    }
  }

  /**
   * Verifica se o usuário tem biometria habilitada no app
   */
  static async isBiometricEnabled(): Promise<boolean> {
    try {
      const enabled = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);
      return enabled === 'true';
    } catch (error) {
      console.error('[BiometricService] Error checking if enabled:', error);
      return false;
    }
  }

  /**
   * Habilita autenticação biométrica e salva credenciais
   */
  static async enableBiometric(credentials: UserCredentials): Promise<boolean> {
    try {
      // Primeiro, autentica para garantir que o usuário quer habilitar
      const authResult = await this.authenticate('Confirme para habilitar biometria');

      if (!authResult.success) {
        return false;
      }

      // Salva credenciais de forma segura
      await SecureStore.setItemAsync(USER_CREDENTIALS_KEY, JSON.stringify(credentials));

      // Marca como habilitado
      await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, 'true');

      return true;
    } catch (error) {
      console.error('[BiometricService] Error enabling biometric:', error);
      return false;
    }
  }

  /**
   * Desabilita autenticação biométrica e remove credenciais
   */
  static async disableBiometric(): Promise<boolean> {
    try {
      await SecureStore.deleteItemAsync(USER_CREDENTIALS_KEY);
      await SecureStore.deleteItemAsync(BIOMETRIC_ENABLED_KEY);
      return true;
    } catch (error) {
      console.error('[BiometricService] Error disabling biometric:', error);
      return false;
    }
  }

  /**
   * Obtém credenciais salvas (após autenticação biométrica)
   */
  static async getStoredCredentials(): Promise<UserCredentials | null> {
    try {
      const isEnabled = await this.isBiometricEnabled();

      if (!isEnabled) {
        return null;
      }

      // Autentica antes de retornar credenciais
      const authResult = await this.authenticate('Autentique-se para fazer login');

      if (!authResult.success) {
        return null;
      }

      // Recupera credenciais
      const credentialsStr = await SecureStore.getItemAsync(USER_CREDENTIALS_KEY);

      if (!credentialsStr) {
        return null;
      }

      const credentials: UserCredentials = JSON.parse(credentialsStr);
      return credentials;
    } catch (error) {
      console.error('[BiometricService] Error getting credentials:', error);
      return null;
    }
  }

  /**
   * Limpa todos os dados de biometria (útil no logout)
   */
  static async clearAll(): Promise<void> {
    try {
      await this.disableBiometric();
    } catch (error) {
      console.error('[BiometricService] Error clearing biometric data:', error);
    }
  }
}

export default BiometricService;
