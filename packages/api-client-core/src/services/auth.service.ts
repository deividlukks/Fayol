import { HttpClient } from '../http-client';
import { ApiResponse, User } from '@fayol/shared-types';
import { LoginInput, RegisterInput } from '@fayol/validation-schemas';
import { IStorageAdapter } from '../storage.interface';

interface LoginResponse {
  access_token: string;
  refresh_token?: string;
  user: User;
}

interface CheckUserResponse {
  exists: boolean;
  name?: string;
  email?: string;
}

interface TwoFactorSetupResponse {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

/**
 * Auth Service
 *
 * Gerencia autenticação, registro, 2FA e recuperação de senha
 */
export class AuthService extends HttpClient {
  constructor(storage: IStorageAdapter, baseURL: string = 'http://localhost:3333/api/auth') {
    super({
      baseURL,
      enableRetry: true,
      enableCache: false, // Auth não usa cache
      storage,
    });
  }

  /**
   * Login do usuário
   * Auto-armazena token e dados do usuário após sucesso
   */
  async login(data: LoginInput): Promise<ApiResponse<LoginResponse>> {
    const response = await this.post<ApiResponse<LoginResponse>>('/login', data);

    // Auto-armazena token e usuário após login bem-sucedido
    if (response.success && response.data?.access_token) {
      await this.setToken(response.data.access_token);

      if (response.data.refresh_token) {
        await this.setRefreshToken(response.data.refresh_token);
      }

      if (response.data.user) {
        await this.setUser(response.data.user);
      }
    }

    return response;
  }

  /**
   * Registro de novo usuário
   */
  async register(data: RegisterInput): Promise<ApiResponse<User>> {
    return this.post<ApiResponse<User>>('/register', data);
  }

  /**
   * Verifica se usuário existe (por email ou CPF)
   */
  async checkUser(identifier: string): Promise<ApiResponse<CheckUserResponse>> {
    return this.post<ApiResponse<CheckUserResponse>>('/check', { identifier });
  }

  /**
   * Logout do usuário
   * Limpa tokens locais mesmo se request falhar
   */
  async logout(): Promise<void> {
    try {
      await this.post('/logout', {});
    } catch (error) {
      console.warn('[AuthService] Logout request failed:', error);
    } finally {
      // Limpa dados locais independentemente do resultado da API
      await this.clearToken();
    }
  }

  /**
   * Obtém dados do usuário autenticado
   */
  async me(): Promise<ApiResponse<{ user: User }>> {
    return this.get<ApiResponse<{ user: User }>>('/me');
  }

  /**
   * Solicita recuperação de senha
   */
  async forgotPassword(email: string): Promise<ApiResponse<{ message: string }>> {
    return this.post<ApiResponse<{ message: string }>>('/forgot-password', { email });
  }

  /**
   * Redefine senha com token
   */
  async resetPassword(token: string, newPassword: string): Promise<ApiResponse<{ message: string }>> {
    return this.post<ApiResponse<{ message: string }>>('/reset-password', {
      token,
      newPassword,
    });
  }

  /**
   * Verifica token de reset de senha
   */
  async verifyResetToken(token: string): Promise<ApiResponse<{ valid: boolean }>> {
    return this.post<ApiResponse<{ valid: boolean }>>('/verify-reset-token', { token });
  }

  /**
   * Configura 2FA (TOTP)
   */
  async setupTwoFactor(): Promise<ApiResponse<TwoFactorSetupResponse>> {
    return this.post<ApiResponse<TwoFactorSetupResponse>>('/2fa/setup', {});
  }

  /**
   * Verifica código 2FA
   */
  async verifyTwoFactor(code: string): Promise<ApiResponse<{ verified: boolean }>> {
    return this.post<ApiResponse<{ verified: boolean }>>('/2fa/verify', { code });
  }

  /**
   * Desabilita 2FA
   */
  async disableTwoFactor(password: string): Promise<ApiResponse<{ message: string }>> {
    return this.post<ApiResponse<{ message: string }>>('/2fa/disable', { password });
  }

  /**
   * Renova token usando refresh token
   */
  async refreshToken(): Promise<ApiResponse<{ access_token: string }>> {
    const refreshToken = await this.getRefreshToken();

    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await this.post<ApiResponse<{ access_token: string }>>('/refresh', {
      refresh_token: refreshToken,
    });

    // Atualiza access token
    if (response.success && response.data?.access_token) {
      await this.setToken(response.data.access_token);
    }

    return response;
  }
}
