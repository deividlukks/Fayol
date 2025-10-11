import { IWhatsAppProvider } from '../../core/interfaces/whatsapp-provider.interface';
import { ProviderType } from '../../core/enums/provider-type.enum';
import { UserTier } from '../../types/user.types';
import { BaileysProvider } from '../baileys/baileys.provider';
import { TwilioProvider } from '../twilio/twilio.provider';
import { config } from '../../config/app.config';
import { logger } from '../../utils/logger';

/**
 * Factory Pattern para criar o provider apropriado
 * 
 * Lógica de decisão:
 * - Usuários FREE → Baileys Provider
 * - Usuários PREMIUM → Twilio Provider
 * 
 * Também verifica se o provider está habilitado nas configurações
 */
export class ProviderFactory {
  private static providers: Map<string, IWhatsAppProvider> = new Map();

  /**
   * Cria ou retorna um provider existente para o usuário
   * 
   * @param userId - ID do usuário
   * @param phone - Número de telefone do usuário
   * @param tier - Tier do usuário (FREE ou PREMIUM)
   * @returns Provider apropriado
   */
  static async getProvider(
    userId: string,
    phone: string,
    tier: UserTier
  ): Promise<IWhatsAppProvider> {
    const cacheKey = `${userId}_${phone}`;

    // Retorna provider existente se já criado
    if (this.providers.has(cacheKey)) {
      logger.debug(`[ProviderFactory] Provider existente encontrado para ${userId}`);
      return this.providers.get(cacheKey)!;
    }

    // Determina qual provider usar
    const providerType = this.determineProviderType(tier);

    // Cria novo provider
    const provider = await this.createProvider(userId, phone, providerType);

    // Armazena no cache
    this.providers.set(cacheKey, provider);

    logger.info(
      `[ProviderFactory] Novo provider criado: ${providerType.toUpperCase()} para usuário ${userId} (tier: ${tier})`
    );

    return provider;
  }

  /**
   * Determina qual provider usar baseado no tier do usuário
   */
  private static determineProviderType(tier: UserTier): ProviderType {
    switch (tier) {
      case UserTier.FREE:
        if (!config.baileys.enabled) {
          throw new Error(
            '[ProviderFactory] Baileys desabilitado nas configurações, mas usuário FREE requer Baileys'
          );
        }
        return ProviderType.BAILEYS;

      case UserTier.PREMIUM:
        if (!config.twilio.enabled) {
          logger.warn(
            '[ProviderFactory] ⚠️  Twilio desabilitado, usando Baileys para usuário PREMIUM'
          );
          if (!config.baileys.enabled) {
            throw new Error('[ProviderFactory] Nenhum provider disponível!');
          }
          return ProviderType.BAILEYS;
        }
        return ProviderType.TWILIO;

      default:
        throw new Error(`[ProviderFactory] Tier desconhecido: ${tier}`);
    }
  }

  /**
   * Cria uma instância do provider
   */
  private static async createProvider(
    userId: string,
    phone: string,
    type: ProviderType
  ): Promise<IWhatsAppProvider> {
    let provider: IWhatsAppProvider;

    switch (type) {
      case ProviderType.BAILEYS:
        provider = new BaileysProvider(userId, phone, config.baileys.sessionsPath);
        break;

      case ProviderType.TWILIO:
        provider = new TwilioProvider(userId, phone);
        break;

      default:
        throw new Error(`[ProviderFactory] Tipo de provider desconhecido: ${type}`);
    }

    // Inicializa o provider
    await provider.initialize();

    return provider;
  }

  /**
   * Remove um provider do cache (útil ao fazer logout)
   */
  static removeProvider(userId: string, phone: string): void {
    const cacheKey = `${userId}_${phone}`;

    if (this.providers.has(cacheKey)) {
      const provider = this.providers.get(cacheKey)!;
      provider.disconnect(); // Desconecta antes de remover
      this.providers.delete(cacheKey);
      logger.info(`[ProviderFactory] Provider removido para ${userId}`);
    }
  }

  /**
   * Lista todos os providers ativos
   */
  static getActiveProviders(): Map<string, IWhatsAppProvider> {
    return this.providers;
  }

  /**
   * Limpa todos os providers (útil ao encerrar aplicação)
   */
  static async clearAll(): Promise<void> {
    logger.info('[ProviderFactory] Desconectando todos os providers...');

    for (const [key, provider] of this.providers.entries()) {
      try {
        await provider.disconnect();
        logger.debug(`[ProviderFactory] Provider ${key} desconectado`);
      } catch (error) {
        logger.error(`[ProviderFactory] Erro ao desconectar provider ${key}:`, error);
      }
    }

    this.providers.clear();
    logger.info('[ProviderFactory] ✅ Todos os providers foram desconectados');
  }

  /**
   * Força reconexão de um provider específico
   */
  static async reconnectProvider(userId: string, phone: string): Promise<void> {
    const cacheKey = `${userId}_${phone}`;

    if (this.providers.has(cacheKey)) {
      const provider = this.providers.get(cacheKey)!;
      
      try {
        await provider.disconnect();
        await provider.initialize();
        logger.info(`[ProviderFactory] ✅ Provider ${userId} reconectado`);
      } catch (error) {
        logger.error(`[ProviderFactory] ❌ Erro ao reconectar provider ${userId}:`, error);
        throw error;
      }
    } else {
      throw new Error(`[ProviderFactory] Provider não encontrado para ${userId}`);
    }
  }

  /**
   * Retorna estatísticas dos providers ativos
   */
  static getStatistics(): {
    totalProviders: number;
    byType: Record<string, number>;
  } {
    const stats = {
      totalProviders: this.providers.size,
      byType: {
        baileys: 0,
        twilio: 0,
      },
    };

    for (const provider of this.providers.values()) {
      if (provider instanceof BaileysProvider) {
        stats.byType.baileys++;
      } else if (provider instanceof TwilioProvider) {
        stats.byType.twilio++;
      }
    }

    return stats;
  }
}
