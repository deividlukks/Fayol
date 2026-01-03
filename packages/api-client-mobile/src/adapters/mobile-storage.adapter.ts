import { IStorageAdapter } from '@fayol/api-client-core';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '@fayol/shared-constants';

/**
 * Mobile Storage Adapter
 *
 * Implementação de storage para React Native usando:
 * - expo-secure-store para tokens (Keychain/Keystore)
 * - AsyncStorage para dados do usuário
 *
 * Todos os métodos são assíncronos
 */
export class MobileStorageAdapter implements IStorageAdapter {
  /**
   * Obtém token de autenticação (SecureStore)
   */
  async getToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(STORAGE_KEYS.AUTH.TOKEN);
    } catch (error) {
      console.error('[MobileStorage] Error getting token:', error);
      return null;
    }
  }

  /**
   * Armazena token de autenticação (SecureStore)
   */
  async setToken(token: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(STORAGE_KEYS.AUTH.TOKEN, token);
    } catch (error) {
      console.error('[MobileStorage] Error setting token:', error);
      throw error;
    }
  }

  /**
   * Remove token de autenticação
   */
  async clearToken(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(STORAGE_KEYS.AUTH.TOKEN);
    } catch (error) {
      console.error('[MobileStorage] Error clearing token:', error);
    }
  }

  /**
   * Obtém dados do usuário (AsyncStorage)
   */
  async getUser<T = unknown>(): Promise<T | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.AUTH.USER);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('[MobileStorage] Error getting user:', error);
      return null;
    }
  }

  /**
   * Armazena dados do usuário (AsyncStorage)
   */
  async setUser(user: unknown): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.AUTH.USER, JSON.stringify(user));
    } catch (error) {
      console.error('[MobileStorage] Error setting user:', error);
      throw error;
    }
  }

  /**
   * Obtém refresh token (SecureStore)
   */
  async getRefreshToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(STORAGE_KEYS.AUTH.REFRESH_TOKEN);
    } catch (error) {
      console.error('[MobileStorage] Error getting refresh token:', error);
      return null;
    }
  }

  /**
   * Armazena refresh token (SecureStore)
   */
  async setRefreshToken(token: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(STORAGE_KEYS.AUTH.REFRESH_TOKEN, token);
    } catch (error) {
      console.error('[MobileStorage] Error setting refresh token:', error);
      throw error;
    }
  }

  /**
   * Limpa todos os dados
   */
  async clearAll(): Promise<void> {
    try {
      await Promise.all([
        SecureStore.deleteItemAsync(STORAGE_KEYS.AUTH.TOKEN),
        SecureStore.deleteItemAsync(STORAGE_KEYS.AUTH.REFRESH_TOKEN),
        AsyncStorage.removeItem(STORAGE_KEYS.AUTH.USER),
      ]);
    } catch (error) {
      console.error('[MobileStorage] Error clearing all data:', error);
    }
  }

  /**
   * Obtém item genérico (AsyncStorage)
   */
  async getItem(key: string): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.error('[MobileStorage] Error getting item:', error);
      return null;
    }
  }

  /**
   * Armazena item genérico (AsyncStorage)
   */
  async setItem(key: string, value: string): Promise<void> {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error('[MobileStorage] Error setting item:', error);
      throw error;
    }
  }

  /**
   * Remove item genérico
   */
  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('[MobileStorage] Error removing item:', error);
    }
  }
}

/**
 * Singleton instance para uso global
 */
export const mobileStorage = new MobileStorageAdapter();
