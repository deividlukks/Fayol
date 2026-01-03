import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { STORAGE_KEYS } from '@fayol/shared-constants';

/**
 * Storage Adapter para React Native
 *
 * Utiliza:
 * - SecureStore (Keychain/Keystore) para dados sensíveis (tokens)
 * - AsyncStorage para cache e dados não-sensíveis
 */
export class MobileStorageAdapter {
  /**
   * Armazena token de autenticação no SecureStore (criptografado)
   */
  async setToken(token: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(STORAGE_KEYS.AUTH.TOKEN, token);
    } catch (error) {
      console.error('[MobileStorage] Error saving token:', error);
      // Fallback para AsyncStorage em caso de erro
      await AsyncStorage.setItem(STORAGE_KEYS.AUTH.TOKEN, token);
    }
  }

  /**
   * Obtém token de autenticação do SecureStore
   */
  async getToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(STORAGE_KEYS.AUTH.TOKEN);
    } catch (error) {
      console.error('[MobileStorage] Error reading token:', error);
      // Fallback para AsyncStorage
      return await AsyncStorage.getItem(STORAGE_KEYS.AUTH.TOKEN);
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

    // Remove também de AsyncStorage (fallback)
    await AsyncStorage.removeItem(STORAGE_KEYS.AUTH.TOKEN);
  }

  /**
   * Armazena refresh token no SecureStore (criptografado)
   */
  async setRefreshToken(token: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(STORAGE_KEYS.AUTH.REFRESH_TOKEN, token);
    } catch (error) {
      console.error('[MobileStorage] Error saving refresh token:', error);
      await AsyncStorage.setItem(STORAGE_KEYS.AUTH.REFRESH_TOKEN, token);
    }
  }

  /**
   * Obtém refresh token
   */
  async getRefreshToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(STORAGE_KEYS.AUTH.REFRESH_TOKEN);
    } catch (error) {
      console.error('[MobileStorage] Error reading refresh token:', error);
      return await AsyncStorage.getItem(STORAGE_KEYS.AUTH.REFRESH_TOKEN);
    }
  }

  /**
   * Remove refresh token
   */
  async clearRefreshToken(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(STORAGE_KEYS.AUTH.REFRESH_TOKEN);
    } catch (error) {
      console.error('[MobileStorage] Error clearing refresh token:', error);
    }
    await AsyncStorage.removeItem(STORAGE_KEYS.AUTH.REFRESH_TOKEN);
  }

  /**
   * Armazena dados do usuário no AsyncStorage (não-sensível)
   */
  async setUser(user: unknown): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.AUTH.USER, JSON.stringify(user));
    } catch (error) {
      console.error('[MobileStorage] Error saving user:', error);
    }
  }

  /**
   * Obtém dados do usuário
   */
  async getUser<T>(): Promise<T | null> {
    try {
      const userStr = await AsyncStorage.getItem(STORAGE_KEYS.AUTH.USER);
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('[MobileStorage] Error reading user:', error);
      return null;
    }
  }

  /**
   * Remove dados do usuário
   */
  async clearUser(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.AUTH.USER);
    } catch (error) {
      console.error('[MobileStorage] Error clearing user:', error);
    }
  }

  /**
   * Limpa todos os dados de autenticação
   */
  async clearAll(): Promise<void> {
    await Promise.all([this.clearToken(), this.clearRefreshToken(), this.clearUser()]);
  }

  /**
   * Métodos genéricos de AsyncStorage para cache
   */
  async setItem(key: string, value: string): Promise<void> {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error(`[MobileStorage] Error saving ${key}:`, error);
    }
  }

  async getItem(key: string): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.error(`[MobileStorage] Error reading ${key}:`, error);
      return null;
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`[MobileStorage] Error removing ${key}:`, error);
    }
  }

  async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('[MobileStorage] Error clearing storage:', error);
    }
  }

  /**
   * Armazena objeto JSON
   */
  async setObject(key: string, value: unknown): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`[MobileStorage] Error saving object ${key}:`, error);
    }
  }

  /**
   * Obtém objeto JSON
   */
  async getObject<T>(key: string): Promise<T | null> {
    try {
      const str = await AsyncStorage.getItem(key);
      return str ? JSON.parse(str) : null;
    } catch (error) {
      console.error(`[MobileStorage] Error reading object ${key}:`, error);
      return null;
    }
  }

  /**
   * Verifica se uma chave existe
   */
  async hasItem(key: string): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(key);
      return value !== null;
    } catch (error) {
      console.error(`[MobileStorage] Error checking ${key}:`, error);
      return false;
    }
  }

  /**
   * Obtém todas as chaves
   */
  async getAllKeys(): Promise<string[]> {
    try {
      return await AsyncStorage.getAllKeys();
    } catch (error) {
      console.error('[MobileStorage] Error getting all keys:', error);
      return [];
    }
  }

  /**
   * Obtém múltiplos itens
   */
  async multiGet(keys: string[]): Promise<[string, string | null][]> {
    try {
      return await AsyncStorage.multiGet(keys);
    } catch (error) {
      console.error('[MobileStorage] Error in multiGet:', error);
      return keys.map((key) => [key, null]);
    }
  }

  /**
   * Remove múltiplos itens
   */
  async multiRemove(keys: string[]): Promise<void> {
    try {
      await AsyncStorage.multiRemove(keys);
    } catch (error) {
      console.error('[MobileStorage] Error in multiRemove:', error);
    }
  }
}

// Export singleton instance
export const mobileStorage = new MobileStorageAdapter();
