'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.webStorage = exports.WebStorageAdapter = void 0;
const shared_constants_1 = require('@fayol/shared-constants');
/**
 * Web Storage Adapter
 *
 * Implementação de storage para web usando localStorage
 * Métodos síncronos compatíveis com browser
 */
class WebStorageAdapter {
  /**
   * Obtém token de autenticação
   */
  getToken() {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(shared_constants_1.STORAGE_KEYS.AUTH.TOKEN);
  }
  /**
   * Armazena token de autenticação
   */
  setToken(token) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(shared_constants_1.STORAGE_KEYS.AUTH.TOKEN, token);
    }
  }
  /**
   * Remove token de autenticação
   */
  clearToken() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(shared_constants_1.STORAGE_KEYS.AUTH.TOKEN);
    }
  }
  /**
   * Obtém dados do usuário
   */
  getUser() {
    if (typeof window === 'undefined') return null;
    try {
      const data = localStorage.getItem(shared_constants_1.STORAGE_KEYS.AUTH.USER);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('[WebStorage] Error parsing user data:', error);
      return null;
    }
  }
  /**
   * Armazena dados do usuário
   */
  setUser(user) {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(shared_constants_1.STORAGE_KEYS.AUTH.USER, JSON.stringify(user));
      } catch (error) {
        console.error('[WebStorage] Error storing user data:', error);
      }
    }
  }
  /**
   * Obtém refresh token
   */
  getRefreshToken() {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(shared_constants_1.STORAGE_KEYS.AUTH.REFRESH_TOKEN);
  }
  /**
   * Armazena refresh token
   */
  setRefreshToken(token) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(shared_constants_1.STORAGE_KEYS.AUTH.REFRESH_TOKEN, token);
    }
  }
  /**
   * Limpa todos os dados
   */
  clearAll() {
    if (typeof window !== 'undefined') {
      // Remove apenas dados relacionados à autenticação
      localStorage.removeItem(shared_constants_1.STORAGE_KEYS.AUTH.TOKEN);
      localStorage.removeItem(shared_constants_1.STORAGE_KEYS.AUTH.REFRESH_TOKEN);
      localStorage.removeItem(shared_constants_1.STORAGE_KEYS.AUTH.USER);
    }
  }
  /**
   * Obtém item genérico
   */
  getItem(key) {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(key);
  }
  /**
   * Armazena item genérico
   */
  setItem(key, value) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, value);
    }
  }
  /**
   * Remove item genérico
   */
  removeItem(key) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(key);
    }
  }
}
exports.WebStorageAdapter = WebStorageAdapter;
/**
 * Singleton instance para uso global
 */
exports.webStorage = new WebStorageAdapter();
//# sourceMappingURL=web-storage.adapter.js.map
