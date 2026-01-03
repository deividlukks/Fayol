import { HttpClient } from '../http-client';
import { ApiResponse, User } from '@fayol/shared-types';
import { IStorageAdapter } from '../storage.interface';

/**
 * Users Service
 *
 * Gerencia perfil do usuário
 */
export class UsersService extends HttpClient {
  constructor(storage: IStorageAdapter, baseURL: string = 'http://localhost:3333/api/users') {
    super({
      baseURL,
      enableRetry: true,
      enableCache: false, // Dados de perfil não usam cache
      storage,
    });
  }

  /**
   * Obtém perfil do usuário autenticado
   */
  async getProfile(): Promise<ApiResponse<User>> {
    return this.get<ApiResponse<User>>('/profile');
  }

  /**
   * Atualiza perfil do usuário
   */
  async updateProfile(data: Partial<User>): Promise<ApiResponse<User>> {
    const response = await this.patch<ApiResponse<User>>('/profile', data);

    // Atualiza dados do usuário no storage
    if (response.success && response.data) {
      await this.setUser(response.data);
    }

    return response;
  }

  /**
   * Altera senha
   */
  async changePassword(data: { currentPassword: string; newPassword: string }): Promise<ApiResponse<unknown>> {
    return this.patch<ApiResponse<unknown>>('/password', data);
  }

  /**
   * Deleta conta do usuário
   */
  async deleteAccount(password: string): Promise<ApiResponse<unknown>> {
    return this.delete<ApiResponse<unknown>>('/account', {
      data: { password },
    });
  }

  // ==========================================
  // PUSH NOTIFICATIONS
  // ==========================================

  /**
   * Registra um push token para notificações
   */
  async registerPushToken(token: string, deviceType?: 'ios' | 'android', deviceName?: string): Promise<ApiResponse<{ message: string; tokensCount: number }>> {
    return this.post<ApiResponse<{ message: string; tokensCount: number }>>('/push-token', {
      token,
      deviceType,
      deviceName,
    });
  }

  /**
   * Remove um push token específico
   */
  async removePushToken(token: string): Promise<ApiResponse<{ message: string; tokensCount: number }>> {
    return this.delete<ApiResponse<{ message: string; tokensCount: number }>>('/push-token', {
      data: { token },
    });
  }

  /**
   * Remove todos os push tokens
   */
  async removeAllPushTokens(): Promise<ApiResponse<{ message: string }>> {
    return this.delete<ApiResponse<{ message: string }>>('/push-token/all');
  }

  /**
   * Obtém todos os push tokens do usuário
   */
  async getPushTokens(): Promise<ApiResponse<{ tokens: string[]; count: number }>> {
    return this.get<ApiResponse<{ tokens: string[]; count: number }>>('/push-token');
  }
}
