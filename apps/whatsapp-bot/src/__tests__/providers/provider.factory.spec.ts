import { ProviderFactory } from '../../providers/factory/provider.factory';
import { ProviderType } from '../../core/enums/provider-type.enum';
import { UserTier } from '../../types/user.types';

// Mock the providers
jest.mock('../../providers/baileys/baileys.provider');
jest.mock('../../providers/twilio/twilio.provider');
jest.mock('../../config/app.config', () => ({
  config: {
    baileys: { enabled: true, sessionsPath: './sessions' },
    twilio: { enabled: true },
  },
}));

describe('ProviderFactory', () => {
  const mockUserId = 'user-123';
  const mockPhone = '5534999999999';

  beforeEach(() => {
    // Clear providers before each test
    (ProviderFactory as any).providers.clear();
    jest.clearAllMocks();
  });

  describe('getProvider', () => {
    it('deve criar provider Baileys para usuário FREE', async () => {
      const provider = await ProviderFactory.getProvider(
        mockUserId,
        mockPhone,
        UserTier.FREE
      );

      expect(provider).toBeDefined();
    });

    it('deve criar provider Twilio para usuário PREMIUM', async () => {
      const provider = await ProviderFactory.getProvider(
        mockUserId,
        mockPhone,
        UserTier.PREMIUM
      );

      expect(provider).toBeDefined();
    });

    it('deve retornar provider em cache se já existir', async () => {
      const provider1 = await ProviderFactory.getProvider(
        mockUserId,
        mockPhone,
        UserTier.FREE
      );

      const provider2 = await ProviderFactory.getProvider(
        mockUserId,
        mockPhone,
        UserTier.FREE
      );

      expect(provider1).toBe(provider2);
    });

    it('deve usar Baileys para PREMIUM se Twilio estiver desabilitado', async () => {
      const mockConfig = require('../../config/app.config');
      mockConfig.config.twilio.enabled = false;

      const provider = await ProviderFactory.getProvider(
        mockUserId,
        mockPhone,
        UserTier.PREMIUM
      );

      expect(provider).toBeDefined();

      // Restore config
      mockConfig.config.twilio.enabled = true;
    });

    it('deve lançar erro se Baileys estiver desabilitado para usuário FREE', async () => {
      const mockConfig = require('../../config/app.config');
      mockConfig.config.baileys.enabled = false;

      await expect(
        ProviderFactory.getProvider(mockUserId, mockPhone, UserTier.FREE)
      ).rejects.toThrow();

      // Restore config
      mockConfig.config.baileys.enabled = true;
    });
  });

  describe('removeProvider', () => {
    it('deve remover provider do cache', async () => {
      await ProviderFactory.getProvider(mockUserId, mockPhone, UserTier.FREE);

      const providers = ProviderFactory.getActiveProviders();
      expect(providers.size).toBe(1);

      ProviderFactory.removeProvider(mockUserId, mockPhone);

      expect(providers.size).toBe(0);
    });

    it('não deve lançar erro ao remover provider inexistente', () => {
      expect(() => {
        ProviderFactory.removeProvider('non-existent', 'phone');
      }).not.toThrow();
    });
  });

  describe('getActiveProviders', () => {
    it('deve retornar mapa de providers ativos', async () => {
      await ProviderFactory.getProvider(mockUserId, mockPhone, UserTier.FREE);
      await ProviderFactory.getProvider('user-456', '5534888888888', UserTier.PREMIUM);

      const providers = ProviderFactory.getActiveProviders();

      expect(providers.size).toBe(2);
    });
  });

  describe('clearAll', () => {
    it('deve limpar todos os providers', async () => {
      await ProviderFactory.getProvider(mockUserId, mockPhone, UserTier.FREE);
      await ProviderFactory.getProvider('user-456', '5534888888888', UserTier.PREMIUM);

      await ProviderFactory.clearAll();

      const providers = ProviderFactory.getActiveProviders();
      expect(providers.size).toBe(0);
    });
  });

  describe('reconnectProvider', () => {
    it('deve reconectar provider existente', async () => {
      await ProviderFactory.getProvider(mockUserId, mockPhone, UserTier.FREE);

      await expect(
        ProviderFactory.reconnectProvider(mockUserId, mockPhone)
      ).resolves.not.toThrow();
    });

    it('deve lançar erro ao reconectar provider inexistente', async () => {
      await expect(
        ProviderFactory.reconnectProvider('non-existent', 'phone')
      ).rejects.toThrow();
    });
  });

  describe('getStatistics', () => {
    it('deve retornar estatísticas corretas', async () => {
      await ProviderFactory.getProvider(mockUserId, mockPhone, UserTier.FREE);
      await ProviderFactory.getProvider('user-456', '5534888888888', UserTier.PREMIUM);

      const stats = ProviderFactory.getStatistics();

      expect(stats.totalProviders).toBe(2);
      expect(stats.byType).toBeDefined();
    });

    it('deve retornar zero para factory vazia', () => {
      const stats = ProviderFactory.getStatistics();

      expect(stats.totalProviders).toBe(0);
      expect(stats.byType.baileys).toBe(0);
      expect(stats.byType.twilio).toBe(0);
    });
  });
});
