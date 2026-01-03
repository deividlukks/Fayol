import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from '../../../src/health/health.controller';
import {
  HealthCheckService,
  PrismaHealthIndicator,
  HttpHealthIndicator,
  MemoryHealthIndicator,
  DiskHealthIndicator,
  HealthCheckResult,
} from '@nestjs/terminus';
import { PrismaService } from '../../../src/prisma/prisma.service';

describe('HealthController', () => {
  let controller: HealthController;
  let healthCheckService: HealthCheckService;
  let prismaHealth: PrismaHealthIndicator;
  let httpHealth: HttpHealthIndicator;
  let memoryHealth: MemoryHealthIndicator;
  let diskHealth: DiskHealthIndicator;
  let prismaService: PrismaService;

  const mockHealthCheckResult: HealthCheckResult = {
    status: 'ok',
    info: {},
    error: {},
    details: {},
  };

  const mockHealthCheckService = {
    check: jest.fn(),
  };

  const mockPrismaHealth = {
    pingCheck: jest.fn(),
  };

  const mockHttpHealth = {
    pingCheck: jest.fn(),
  };

  const mockMemoryHealth = {
    checkHeap: jest.fn(),
  };

  const mockDiskHealth = {
    checkStorage: jest.fn(),
  };

  const mockPrismaService = {
    $queryRaw: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthCheckService,
          useValue: mockHealthCheckService,
        },
        {
          provide: PrismaHealthIndicator,
          useValue: mockPrismaHealth,
        },
        {
          provide: HttpHealthIndicator,
          useValue: mockHttpHealth,
        },
        {
          provide: MemoryHealthIndicator,
          useValue: mockMemoryHealth,
        },
        {
          provide: DiskHealthIndicator,
          useValue: mockDiskHealth,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    healthCheckService = module.get<HealthCheckService>(HealthCheckService);
    prismaHealth = module.get<PrismaHealthIndicator>(PrismaHealthIndicator);
    httpHealth = module.get<HttpHealthIndicator>(HttpHealthIndicator);
    memoryHealth = module.get<MemoryHealthIndicator>(MemoryHealthIndicator);
    diskHealth = module.get<DiskHealthIndicator>(DiskHealthIndicator);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('deve estar definido', () => {
    expect(controller).toBeDefined();
  });

  describe('check', () => {
    it('deve executar health check completo com sucesso', async () => {
      mockHealthCheckService.check.mockResolvedValue(mockHealthCheckResult);

      const result = await controller.check();

      expect(result).toEqual(mockHealthCheckResult);
      expect(healthCheckService.check).toHaveBeenCalledWith(
        expect.arrayContaining([expect.any(Function), expect.any(Function), expect.any(Function)])
      );
    });

    it('deve verificar database health', async () => {
      mockHealthCheckService.check.mockImplementation(async (checks) => {
        // Executar todas as checks
        await Promise.all(checks.map((check) => check()));
        return mockHealthCheckResult;
      });

      mockPrismaHealth.pingCheck.mockResolvedValue({ database: { status: 'up' } });

      await controller.check();

      expect(prismaHealth.pingCheck).toHaveBeenCalledWith('database', prismaService);
    });

    it('deve verificar memory heap', async () => {
      mockHealthCheckService.check.mockImplementation(async (checks) => {
        await Promise.all(checks.map((check) => check()));
        return mockHealthCheckResult;
      });

      mockMemoryHealth.checkHeap.mockResolvedValue({ memory_heap: { status: 'up' } });

      await controller.check();

      expect(memoryHealth.checkHeap).toHaveBeenCalledWith(
        'memory_heap',
        150 * 1024 * 1024 // 150MB
      );
    });

    it('deve verificar disk storage', async () => {
      mockHealthCheckService.check.mockImplementation(async (checks) => {
        await Promise.all(checks.map((check) => check()));
        return mockHealthCheckResult;
      });

      mockDiskHealth.checkStorage.mockResolvedValue({ storage: { status: 'up' } });

      await controller.check();

      expect(diskHealth.checkStorage).toHaveBeenCalledWith('storage', {
        path: '/',
        thresholdPercent: 0.9,
      });
    });

    it('deve retornar status degraded quando algum check falhar', async () => {
      const errorResult: HealthCheckResult = {
        status: 'error',
        info: {},
        error: {
          database: {
            status: 'down',
            message: 'Database connection failed',
          },
        },
        details: {
          database: {
            status: 'down',
            message: 'Database connection failed',
          },
        },
      };

      mockHealthCheckService.check.mockResolvedValue(errorResult);

      const result = await controller.check();

      expect(result.status).toBe('error');
      expect(result.error).toHaveProperty('database');
    });

    it('deve incluir todos os checks configurados', async () => {
      mockHealthCheckService.check.mockResolvedValue(mockHealthCheckResult);

      await controller.check();

      const checkFunctions = mockHealthCheckService.check.mock.calls[0][0];
      expect(checkFunctions).toHaveLength(3); // database, memory, disk
    });
  });

  describe('checkAiService', () => {
    it('deve verificar saúde do serviço AI com URL padrão', async () => {
      delete process.env.AI_SERVICE_URL;

      mockHealthCheckService.check.mockImplementation(async (checks) => {
        await Promise.all(checks.map((check) => check()));
        return mockHealthCheckResult;
      });

      mockHttpHealth.pingCheck.mockResolvedValue({ 'python-ai': { status: 'up' } });

      const result = await controller.checkAiService();

      expect(result).toEqual(mockHealthCheckResult);
      expect(httpHealth.pingCheck).toHaveBeenCalledWith(
        'python-ai',
        'http://localhost:8000/health',
        { timeout: 3000 }
      );
    });

    it('deve usar AI_SERVICE_URL do env se disponível', async () => {
      process.env.AI_SERVICE_URL = 'http://custom-ai:9000';

      mockHealthCheckService.check.mockImplementation(async (checks) => {
        await Promise.all(checks.map((check) => check()));
        return mockHealthCheckResult;
      });

      mockHttpHealth.pingCheck.mockResolvedValue({ 'python-ai': { status: 'up' } });

      await controller.checkAiService();

      expect(httpHealth.pingCheck).toHaveBeenCalledWith(
        'python-ai',
        'http://custom-ai:9000/health',
        { timeout: 3000 }
      );

      delete process.env.AI_SERVICE_URL;
    });

    it('deve retornar erro quando AI service está indisponível', async () => {
      const errorResult: HealthCheckResult = {
        status: 'error',
        info: {},
        error: {
          'python-ai': {
            status: 'down',
            message: 'Service unavailable',
          },
        },
        details: {
          'python-ai': {
            status: 'down',
            message: 'Service unavailable',
          },
        },
      };

      mockHealthCheckService.check.mockResolvedValue(errorResult);

      const result = await controller.checkAiService();

      expect(result.status).toBe('error');
      expect(result.error).toHaveProperty('python-ai');
    });

    it('deve usar timeout de 3 segundos', async () => {
      mockHealthCheckService.check.mockImplementation(async (checks) => {
        await Promise.all(checks.map((check) => check()));
        return mockHealthCheckResult;
      });

      mockHttpHealth.pingCheck.mockResolvedValue({ 'python-ai': { status: 'up' } });

      await controller.checkAiService();

      expect(httpHealth.pingCheck).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({ timeout: 3000 })
      );
    });
  });

  describe('ready', () => {
    it('deve retornar status ready quando banco está acessível', async () => {
      mockPrismaService.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);

      const result = await controller.ready();

      expect(result.status).toBe('ready');
      expect(result).toHaveProperty('uptime');
      expect(result).toHaveProperty('timestamp');
      expect(typeof result.uptime).toBe('number');
      expect(typeof result.timestamp).toBe('string');
      expect(prismaService.$queryRaw).toHaveBeenCalled();
    });

    it('deve retornar not_ready quando banco está inacessível', async () => {
      const dbError = new Error('Connection refused');
      mockPrismaService.$queryRaw.mockRejectedValue(dbError);

      const result = await controller.ready();

      expect(result.status).toBe('not_ready');
      expect(result.error).toBe('Connection refused');
    });

    it('deve lidar com erro desconhecido', async () => {
      mockPrismaService.$queryRaw.mockRejectedValue('Unknown error');

      const result = await controller.ready();

      expect(result.status).toBe('not_ready');
      expect(result.error).toBe('Unknown error');
    });

    it('deve incluir uptime do processo', async () => {
      mockPrismaService.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);

      const result = await controller.ready();

      expect(result.uptime).toBeGreaterThan(0);
    });

    it('deve incluir timestamp ISO', async () => {
      mockPrismaService.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);

      const result = await controller.ready();

      expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('deve executar query SELECT 1', async () => {
      mockPrismaService.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);

      await controller.ready();

      // Verificar que foi chamado com template string
      expect(prismaService.$queryRaw).toHaveBeenCalled();
    });
  });

  describe('live', () => {
    it('deve retornar status alive', () => {
      const result = controller.live();

      expect(result.status).toBe('alive');
      expect(result).toHaveProperty('uptime');
      expect(result).toHaveProperty('pid');
      expect(result).toHaveProperty('timestamp');
    });

    it('deve incluir uptime do processo', () => {
      const result = controller.live();

      expect(typeof result.uptime).toBe('number');
      expect(result.uptime).toBeGreaterThan(0);
    });

    it('deve incluir PID do processo', () => {
      const result = controller.live();

      expect(typeof result.pid).toBe('number');
      expect(result.pid).toBeGreaterThan(0);
      expect(result.pid).toBe(process.pid);
    });

    it('deve incluir timestamp ISO', () => {
      const result = controller.live();

      expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('deve sempre retornar sucesso sem dependências externas', () => {
      // Liveness não depende de banco ou serviços externos
      const result = controller.live();

      expect(result.status).toBe('alive');
      // Não deve chamar nenhum serviço externo
      expect(prismaService.$queryRaw).not.toHaveBeenCalled();
    });

    it('deve retornar resposta rápida', () => {
      const start = Date.now();
      controller.live();
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(10); // Deve ser instantâneo
    });
  });

  describe('Integration', () => {
    it('deve ter diferentes endpoints para diferentes tipos de probe', async () => {
      // Liveness - sempre sucesso
      const liveness = controller.live();
      expect(liveness.status).toBe('alive');

      // Readiness - depende do banco
      mockPrismaService.$queryRaw.mockResolvedValue([]);
      const readiness = await controller.ready();
      expect(readiness.status).toBe('ready');

      // Health - checks completos
      mockHealthCheckService.check.mockResolvedValue(mockHealthCheckResult);
      const health = await controller.check();
      expect(health.status).toBe('ok');
    });

    it('liveness não deve falhar mesmo se banco estiver down', () => {
      // Simular banco down não afeta liveness
      mockPrismaService.$queryRaw.mockRejectedValue(new Error('DB down'));

      const result = controller.live();

      expect(result.status).toBe('alive');
    });

    it('readiness deve falhar se banco estiver down', async () => {
      mockPrismaService.$queryRaw.mockRejectedValue(new Error('DB down'));

      const result = await controller.ready();

      expect(result.status).toBe('not_ready');
    });
  });
});
