/**
 * Biometric Authentication Service
 *
 * Handles biometric authentication (Face ID, Touch ID, Fingerprint)
 * using expo-local-authentication
 */

import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';
import { mobileStorage } from '@fayol/api-client-mobile';

const BIOMETRIC_ENABLED_KEY = 'biometric_enabled';

export class BiometricService {
  /**
   * Check if biometric hardware is available on device
   */
  async isAvailable(): Promise<boolean> {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      return hasHardware;
    } catch (error) {
      console.error('[BiometricService] Error checking hardware:', error);
      return false;
    }
  }

  /**
   * Check if biometric authentication is enrolled (e.g., fingerprints/face registered)
   */
  async isEnrolled(): Promise<boolean> {
    try {
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      return isEnrolled;
    } catch (error) {
      console.error('[BiometricService] Error checking enrollment:', error);
      return false;
    }
  }

  /**
   * Get supported biometric types
   */
  async getSupportedTypes(): Promise<LocalAuthentication.AuthenticationType[]> {
    try {
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      return types;
    } catch (error) {
      console.error('[BiometricService] Error getting supported types:', error);
      return [];
    }
  }

  /**
   * Get user-friendly biometric type name
   */
  async getBiometricTypeName(): Promise<string> {
    const types = await this.getSupportedTypes();

    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      return Platform.OS === 'ios' ? 'Face ID' : 'Reconhecimento Facial';
    }

    if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      return Platform.OS === 'ios' ? 'Touch ID' : 'Digital';
    }

    if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      return 'Íris';
    }

    return 'Biometria';
  }

  /**
   * Authenticate user with biometric
   */
  async authenticate(promptMessage?: string): Promise<boolean> {
    try {
      const biometricTypeName = await this.getBiometricTypeName();

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: promptMessage || `Autentique-se com ${biometricTypeName}`,
        fallbackLabel: 'Usar senha',
        cancelLabel: 'Cancelar',
        disableDeviceFallback: false,
      });

      return result.success;
    } catch (error) {
      console.error('[BiometricService] Authentication error:', error);
      return false;
    }
  }

  /**
   * Check if biometric authentication is enabled for the app
   */
  async isBiometricEnabled(): Promise<boolean> {
    try {
      const enabled = await mobileStorage.getItem(BIOMETRIC_ENABLED_KEY);
      return enabled === 'true';
    } catch (error) {
      console.error('[BiometricService] Error checking if enabled:', error);
      return false;
    }
  }

  /**
   * Enable biometric authentication for the app
   */
  async enableBiometric(): Promise<void> {
    try {
      await mobileStorage.setItem(BIOMETRIC_ENABLED_KEY, 'true');
    } catch (error) {
      console.error('[BiometricService] Error enabling biometric:', error);
      throw error;
    }
  }

  /**
   * Disable biometric authentication for the app
   */
  async disableBiometric(): Promise<void> {
    try {
      await mobileStorage.removeItem(BIOMETRIC_ENABLED_KEY);
    } catch (error) {
      console.error('[BiometricService] Error disabling biometric:', error);
      throw error;
    }
  }

  /**
   * Check if biometric can be used (hardware + enrollment + user preference)
   */
  async canUseBiometric(): Promise<boolean> {
    const [available, enrolled, enabled] = await Promise.all([
      this.isAvailable(),
      this.isEnrolled(),
      this.isBiometricEnabled(),
    ]);

    return available && enrolled && enabled;
  }

  /**
   * Save user credentials for biometric login
   * Note: This stores credentials in SecureStore, which is encrypted
   */
  async saveCredentials(email: string, password: string): Promise<void> {
    try {
      await mobileStorage.setItem('biometric_email', email);
      await mobileStorage.setItem('biometric_password', password);
    } catch (error) {
      console.error('[BiometricService] Error saving credentials:', error);
      throw error;
    }
  }

  /**
   * Get saved email for biometric login
   */
  async getSavedEmail(): Promise<string | null> {
    try {
      return await mobileStorage.getItem('biometric_email');
    } catch (error) {
      console.error('[BiometricService] Error getting saved email:', error);
      return null;
    }
  }

  /**
   * Get saved password for biometric login
   */
  async getSavedPassword(): Promise<string | null> {
    try {
      return await mobileStorage.getItem('biometric_password');
    } catch (error) {
      console.error('[BiometricService] Error getting saved password:', error);
      return null;
    }
  }

  /**
   * Clear saved credentials
   */
  async clearSavedCredentials(): Promise<void> {
    try {
      await mobileStorage.removeItem('biometric_email');
      await mobileStorage.removeItem('biometric_password');
    } catch (error) {
      console.error('[BiometricService] Error clearing credentials:', error);
    }
  }
}

// Singleton instance
export const biometricService = new BiometricService();
