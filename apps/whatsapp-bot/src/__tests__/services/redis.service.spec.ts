import { RedisService } from '../../services/redis.service';

// Mock ioredis
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    set: jest.fn().mockResolvedValue('OK'),
    setex: jest.fn().mockResolvedValue('OK'),
    get: jest.fn().mockResolvedValue(null),
    del: jest.fn().mockResolvedValue(1),
    exists: jest.fn().mockResolvedValue(0),
    keys: jest.fn().mockResolvedValue([]),
    expire: jest.fn().mockResolvedValue(1),
    ttl: jest.fn().mockResolvedValue(-1),
    ping: jest.fn().mockResolvedValue('PONG'),
    quit: jest.fn().mockResolvedValue('OK'),
  }));
});

describe('RedisService', () => {
  let redisService: RedisService;

  beforeEach(() => {
    jest.clearAllMocks();
    redisService = new RedisService();
  });

  describe('set', () => {
    it('deve armazenar valor sem TTL', async () => {
      const mockSet = jest.fn().mockResolvedValue('OK');
      (redisService as any).client.set = mockSet;

      await redisService.set('test-key', { foo: 'bar' });

      expect(mockSet).toHaveBeenCalledWith('test-key', JSON.stringify({ foo: 'bar' }));
    });

    it('deve armazenar valor com TTL', async () => {
      const mockSetex = jest.fn().mockResolvedValue('OK');
      (redisService as any).client.setex = mockSetex;

      await redisService.set('test-key', { foo: 'bar' }, 300);

      expect(mockSetex).toHaveBeenCalledWith('test-key', 300, JSON.stringify({ foo: 'bar' }));
    });
  });

  describe('get', () => {
    it('deve retornar valor armazenado', async () => {
      const mockGet = jest.fn().mockResolvedValue(JSON.stringify({ foo: 'bar' }));
      (redisService as any).client.get = mockGet;

      const result = await redisService.get('test-key');

      expect(result).toEqual({ foo: 'bar' });
      expect(mockGet).toHaveBeenCalledWith('test-key');
    });

    it('deve retornar null se chave não existir', async () => {
      const mockGet = jest.fn().mockResolvedValue(null);
      (redisService as any).client.get = mockGet;

      const result = await redisService.get('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('deve deletar chave', async () => {
      const mockDel = jest.fn().mockResolvedValue(1);
      (redisService as any).client.del = mockDel;

      await redisService.delete('test-key');

      expect(mockDel).toHaveBeenCalledWith('test-key');
    });
  });

  describe('exists', () => {
    it('deve retornar true se chave existir', async () => {
      const mockExists = jest.fn().mockResolvedValue(1);
      (redisService as any).client.exists = mockExists;

      const result = await redisService.exists('test-key');

      expect(result).toBe(true);
    });

    it('deve retornar false se chave não existir', async () => {
      const mockExists = jest.fn().mockResolvedValue(0);
      (redisService as any).client.exists = mockExists;

      const result = await redisService.exists('non-existent');

      expect(result).toBe(false);
    });
  });

  describe('keys', () => {
    it('deve retornar chaves que correspondem ao padrão', async () => {
      const mockKeys = jest.fn().mockResolvedValue(['session:123', 'session:456']);
      (redisService as any).client.keys = mockKeys;

      const result = await redisService.keys('session:*');

      expect(result).toEqual(['session:123', 'session:456']);
      expect(mockKeys).toHaveBeenCalledWith('session:*');
    });
  });

  describe('expire', () => {
    it('deve definir TTL para chave', async () => {
      const mockExpire = jest.fn().mockResolvedValue(1);
      (redisService as any).client.expire = mockExpire;

      await redisService.expire('test-key', 600);

      expect(mockExpire).toHaveBeenCalledWith('test-key', 600);
    });
  });

  describe('ttl', () => {
    it('deve retornar tempo restante de vida', async () => {
      const mockTtl = jest.fn().mockResolvedValue(300);
      (redisService as any).client.ttl = mockTtl;

      const result = await redisService.ttl('test-key');

      expect(result).toBe(300);
    });
  });

  describe('ping', () => {
    it('deve retornar true se conexão estiver ativa', async () => {
      const mockPing = jest.fn().mockResolvedValue('PONG');
      (redisService as any).client.ping = mockPing;

      const result = await redisService.ping();

      expect(result).toBe(true);
    });

    it('deve retornar false se ping falhar', async () => {
      const mockPing = jest.fn().mockRejectedValue(new Error('Connection failed'));
      (redisService as any).client.ping = mockPing;

      const result = await redisService.ping();

      expect(result).toBe(false);
    });
  });

  describe('disconnect', () => {
    it('deve desconectar do Redis', async () => {
      const mockQuit = jest.fn().mockResolvedValue('OK');
      (redisService as any).client.quit = mockQuit;

      await redisService.disconnect();

      expect(mockQuit).toHaveBeenCalled();
      expect(redisService.isReady()).toBe(false);
    });
  });
});
