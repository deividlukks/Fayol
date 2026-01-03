/**
 * Gerenciamento de sessões usando Redis
 * Permite múltiplas instâncias do bot (horizontal scaling)
 * Substitui Map em memória para produção
 */

import { createClient, RedisClientType } from 'redis';
import { ISessionService, UserSession, SessionStats } from './ISessionService';

export class RedisSessionService implements ISessionService {
  private client: RedisClientType;
  private connected: boolean = false;
  private keyPrefix: string = 'whatsapp:session:';
  private defaultTTL: number = 7 * 24 * 60 * 60; // 7 dias em segundos

  constructor() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

    this.client = createClient({
      url: redisUrl,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            console.error('❌ Redis: Máximo de tentativas de reconexão atingido');
            return new Error('Máximo de reconexões atingido');
          }
          // Backoff exponencial: 50ms, 100ms, 200ms, 400ms, etc
          const delay = Math.min(retries * 50, 3000);
          console.log(`⚠️ Redis: Tentando reconectar em ${delay}ms (tentativa ${retries})`);
          return delay;
        },
      },
    });

    this.client.on('error', (err) => {
      console.error('❌ Redis Error:', err);
      this.connected = false;
    });

    this.client.on('connect', () => {
      console.log('🔌 Redis: Conectando...');
    });

    this.client.on('ready', () => {
      console.log('✅ Redis: Conectado e pronto');
      this.connected = true;
    });

    this.client.on('reconnecting', () => {
      console.log('🔄 Redis: Reconectando...');
      this.connected = false;
    });

    this.client.on('end', () => {
      console.log('🔌 Redis: Conexão encerrada');
      this.connected = false;
    });
  }

  /**
   * Inicializa conexão com Redis
   */
  async connect(): Promise<void> {
    try {
      if (!this.connected) {
        await this.client.connect();
        console.log('✅ RedisSessionService inicializado');
      }
    } catch (error) {
      console.error('❌ Erro ao conectar Redis:', error);
      throw error;
    }
  }

  /**
   * Desconecta do Redis (graceful shutdown)
   */
  async disconnect(): Promise<void> {
    try {
      if (this.connected) {
        await this.client.quit();
        console.log('👋 Redis: Desconectado');
      }
    } catch (error) {
      console.error('❌ Erro ao desconectar Redis:', error);
    }
  }

  /**
   * Obtém sessão do usuário (cria se não existir)
   */
  async getSession(phoneNumber: string): Promise<UserSession> {
    this.assertConnected();

    const key = this.keyPrefix + phoneNumber;
    const data = await this.client.get(key);

    if (!data) {
      // Cria nova sessão vazia
      const newSession: UserSession = {};
      await this.setSession(phoneNumber, newSession);
      return newSession;
    }

    try {
      return JSON.parse(data);
    } catch (error) {
      console.error('❌ Erro ao parsear sessão:', error);
      return {};
    }
  }

  /**
   * Atualiza sessão do usuário (merge parcial)
   */
  async setSession(phoneNumber: string, session: Partial<UserSession>): Promise<void> {
    this.assertConnected();

    const key = this.keyPrefix + phoneNumber;

    // Faz merge com sessão existente
    const current = await this.getSession(phoneNumber);
    const updated = { ...current, ...session };

    await this.client.setEx(key, this.defaultTTL, JSON.stringify(updated));
  }

  /**
   * Limpa sessão do usuário (logout)
   */
  async clearSession(phoneNumber: string): Promise<void> {
    this.assertConnected();

    const key = this.keyPrefix + phoneNumber;
    await this.client.del(key);
  }

  /**
   * Verifica se usuário está autenticado
   */
  async isAuthenticated(phoneNumber: string): Promise<boolean> {
    const session = await this.getSession(phoneNumber);
    return !!session.token;
  }

  /**
   * Verifica se usuário está em onboarding
   */
  async isOnboarding(phoneNumber: string): Promise<boolean> {
    const session = await this.getSession(phoneNumber);
    return (
      session.user?.onboardingStep !== undefined &&
      session.user.onboardingStep < 5
    );
  }

  /**
   * Obtém token JWT do usuário
   */
  async getToken(phoneNumber: string): Promise<string | null> {
    const session = await this.getSession(phoneNumber);
    return session.token || null;
  }

  /**
   * Estende TTL da sessão (útil para usuários ativos)
   */
  async extendTTL(phoneNumber: string, ttlSeconds: number = this.defaultTTL): Promise<void> {
    this.assertConnected();

    const key = this.keyPrefix + phoneNumber;
    const exists = await this.client.exists(key);

    if (exists) {
      await this.client.expire(key, ttlSeconds);
    }
  }

  /**
   * Estatísticas (útil para monitoramento)
   */
  async getStats(): Promise<SessionStats> {
    this.assertConnected();

    const pattern = this.keyPrefix + '*';
    const keys = await this.client.keys(pattern);

    let authenticated = 0;
    let onboarding = 0;

    // Busca todas as sessões em paralelo
    const sessions = await Promise.all(
      keys.map(async (key) => {
        const data = await this.client.get(key);
        if (!data) return null;
        try {
          return JSON.parse(data) as UserSession;
        } catch {
          return null;
        }
      })
    );

    for (const session of sessions) {
      if (!session) continue;

      if (session.token) authenticated++;
      if (session.user?.onboardingStep !== undefined && session.user.onboardingStep < 5) {
        onboarding++;
      }
    }

    return {
      totalSessions: keys.length,
      authenticated,
      onboarding,
    };
  }

  /**
   * Limpa todas as sessões (usar com cuidado!)
   */
  async clearAllSessions(): Promise<void> {
    this.assertConnected();

    const pattern = this.keyPrefix + '*';
    const keys = await this.client.keys(pattern);

    if (keys.length > 0) {
      await this.client.del(keys);
      console.log(`🗑️ ${keys.length} sessões limpas`);
    }
  }

  /**
   * Verifica se está conectado
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Assert conectado (para uso interno)
   */
  private assertConnected(): void {
    if (!this.connected) {
      throw new Error('Redis não conectado. Chame connect() primeiro.');
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      if (!this.connected) return false;
      const result = await this.client.ping();
      return result === 'PONG';
    } catch {
      return false;
    }
  }
}
