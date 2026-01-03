import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { AiService } from '../../../src/modules/ai/services/ai.service';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { of, throwError } from 'rxjs';
import { AxiosResponse } from 'axios';
import { LaunchType } from '@fayol/shared-types';

describe('AiService', () => {
  let service: AiService;
  let httpService: HttpService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    category: {
      findFirst: jest.fn(),
    },
    transaction: {
      findMany: jest.fn(),
    },
  };

  const mockHttpService = {
    post: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AiService>(AiService);
    httpService = module.get<HttpService>(HttpService);
    prismaService = module.get<PrismaService>(PrismaService);

    // Silenciar logs durante testes
    jest.spyOn(service['logger'], 'log').mockImplementation();
    jest.spyOn(service['logger'], 'warn').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('deve usar AI_SERVICE_URL do env quando disponível', () => {
      const originalEnv = process.env.AI_SERVICE_URL;
      process.env.AI_SERVICE_URL = 'http://custom-ai:8080';

      const module = new AiService(prismaService as any, httpService as any);
      expect(module['aiServiceUrl']).toBe('http://custom-ai:8080');

      process.env.AI_SERVICE_URL = originalEnv;
    });

    it('deve usar fallback localhost:8000 quando AI_SERVICE_URL não está definido', () => {
      const originalEnv = process.env.AI_SERVICE_URL;
      delete process.env.AI_SERVICE_URL;

      const module = new AiService(prismaService as any, httpService as any);
      expect(module['aiServiceUrl']).toBe('http://localhost:8000');

      process.env.AI_SERVICE_URL = originalEnv;
    });
  });

  describe('predictCategory', () => {
    const userId = 'user-123';
    const description = 'Supermercado Extra';

    it('deve prever categoria com sucesso e encontrar no banco', async () => {
      const mockResponse: AxiosResponse = {
        data: { category: 'ALIMENTACAO', confidence: 0.95 },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      const mockCategory = {
        id: 'cat-1',
        name: 'Alimentação',
        icon: '🍔',
        color: '#FF6B6B',
        type: 'EXPENSE' as LaunchType,
        isSystemDefault: true,
        userId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockHttpService.post.mockReturnValue(of(mockResponse));
      mockPrismaService.category.findFirst.mockResolvedValue(mockCategory);

      const result = await service.predictCategory(userId, description);

      expect(result.found).toBe(true);
      expect(result.category).toEqual({
        id: mockCategory.id,
        name: mockCategory.name,
        icon: mockCategory.icon,
        color: mockCategory.color,
        type: mockCategory.type,
      });
      expect(mockHttpService.post).toHaveBeenCalledWith(expect.stringContaining('/categorize'), {
        description,
      });
      expect(mockPrismaService.category.findFirst).toHaveBeenCalledWith({
        where: {
          name: { contains: 'ALIMENTACAO', mode: 'insensitive' },
          OR: [{ isSystemDefault: true }, { userId }],
        },
      });
    });

    it('deve sugerir categoria quando não encontrada no banco', async () => {
      const mockResponse: AxiosResponse = {
        data: { category: 'NOVA_CATEGORIA', confidence: 0.85 },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      mockHttpService.post.mockReturnValue(of(mockResponse));
      mockPrismaService.category.findFirst.mockResolvedValue(null);

      const result = await service.predictCategory(userId, description);

      expect(result.found).toBe(false);
      expect(result.suggestedName).toBe('NOVA_CATEGORIA');
      expect(result.message).toContain('NOVA_CATEGORIA');
      expect(result.message).toContain('não está cadastrada');
    });

    it('deve retornar found=false quando IA não retorna categoria', async () => {
      const mockResponse: AxiosResponse = {
        data: { category: null, confidence: 0.1 },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      mockHttpService.post.mockReturnValue(of(mockResponse));

      const result = await service.predictCategory(userId, description);

      expect(result.found).toBe(false);
      expect(result.message).toContain('Não consegui identificar');
    });

    it('deve lidar com erro da IA graciosamente', async () => {
      mockHttpService.post.mockReturnValue(throwError(() => new Error('AI service unavailable')));

      const result = await service.predictCategory(userId, description);

      expect(result.found).toBe(false);
      expect(result.message).toContain('Não consegui identificar');
      expect(service['logger'].warn).toHaveBeenCalledWith(
        expect.stringContaining('IA indisponível')
      );
    });

    it('deve lidar com erro de rede', async () => {
      mockHttpService.post.mockReturnValue(
        throwError(() => ({ message: 'Network error', code: 'ECONNREFUSED' }))
      );

      const result = await service.predictCategory(userId, description);

      expect(result.found).toBe(false);
    });

    it('deve lidar com resposta vazia da IA', async () => {
      const mockResponse: AxiosResponse = {
        data: {},
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      mockHttpService.post.mockReturnValue(of(mockResponse));

      const result = await service.predictCategory(userId, description);

      expect(result.found).toBe(false);
    });

    it('deve buscar categoria do usuário além das padrão', async () => {
      const mockResponse: AxiosResponse = {
        data: { category: 'CUSTOM_CATEGORY' },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      const mockUserCategory = {
        id: 'cat-user-1',
        name: 'Custom Category',
        icon: '⭐',
        color: '#00FF00',
        type: 'EXPENSE' as LaunchType,
        isSystemDefault: false,
        userId: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockHttpService.post.mockReturnValue(of(mockResponse));
      mockPrismaService.category.findFirst.mockResolvedValue(mockUserCategory);

      const result = await service.predictCategory(userId, description);

      expect(result.found).toBe(true);
      expect(result.category?.name).toBe('Custom Category');
    });
  });

  describe('learnCategory', () => {
    it('deve enviar feedback de treinamento com sucesso', async () => {
      const description = 'Padaria do João';
      const correctCategory = 'ALIMENTACAO';

      const mockResponse: AxiosResponse = {
        data: { success: true },
        status: 201,
        statusText: 'Created',
        headers: {},
        config: {} as any,
      };

      mockHttpService.post.mockReturnValue(of(mockResponse));

      await service.learnCategory(description, correctCategory);

      expect(mockHttpService.post).toHaveBeenCalledWith(expect.stringContaining('/train'), {
        description: 'Padaria do João',
        category: 'ALIMENTACAO',
      });
      expect(service['logger'].log).toHaveBeenCalledWith(expect.stringContaining('Ensinando IA'));
      expect(service['logger'].log).toHaveBeenCalledWith(
        expect.stringContaining('IA atualizada com sucesso')
      );
    });

    it('deve ignorar descrições muito curtas', async () => {
      await service.learnCategory('ab', 'CATEGORIA');

      expect(mockHttpService.post).not.toHaveBeenCalled();
    });

    it('deve normalizar descrição removendo espaços extras', async () => {
      const mockResponse: AxiosResponse = {
        data: { success: true },
        status: 201,
        statusText: 'Created',
        headers: {},
        config: {} as any,
      };

      mockHttpService.post.mockReturnValue(of(mockResponse));

      await service.learnCategory('  Mercado   ', 'ALIMENTACAO');

      expect(mockHttpService.post).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          description: 'Mercado',
        })
      );
    });

    it('deve lidar com erro ao treinar sem lançar exceção', async () => {
      mockHttpService.post.mockReturnValue(throwError(() => new Error('Training failed')));

      // Não deve lançar erro
      await expect(service.learnCategory('Mercado', 'ALIMENTACAO')).resolves.not.toThrow();

      expect(service['logger'].warn).toHaveBeenCalledWith(
        expect.stringContaining('Falha ao treinar IA')
      );
    });

    it('deve lidar com timeout da IA', async () => {
      mockHttpService.post.mockReturnValue(
        throwError(() => ({ message: 'timeout of 5000ms exceeded' }))
      );

      await service.learnCategory('Mercado', 'ALIMENTACAO');

      expect(service['logger'].warn).toHaveBeenCalled();
    });

    it('deve aceitar descrições longas', async () => {
      const longDescription = 'A'.repeat(500);
      const mockResponse: AxiosResponse = {
        data: { success: true },
        status: 201,
        statusText: 'Created',
        headers: {},
        config: {} as any,
      };

      mockHttpService.post.mockReturnValue(of(mockResponse));

      await service.learnCategory(longDescription, 'CATEGORIA');

      expect(mockHttpService.post).toHaveBeenCalled();
    });
  });

  describe('generateInsights', () => {
    const userId = 'user-123';

    it('deve gerar insights com sucesso', async () => {
      const mockTransactions = [
        {
          id: 'tx-1',
          amount: 150.5,
          date: new Date('2024-01-15'),
          type: 'EXPENSE' as LaunchType,
          isPaid: true,
          userId,
          category: { id: 'cat-1', name: 'Alimentação' },
        },
        {
          id: 'tx-2',
          amount: 2000.0,
          date: new Date('2024-01-20'),
          type: 'INCOME' as LaunchType,
          isPaid: true,
          userId,
          category: { id: 'cat-2', name: 'Salário' },
        },
      ];

      const mockInsights = [
        {
          type: 'SPENDING_PATTERN',
          message: 'Seus gastos com alimentação aumentaram 15% este mês',
          severity: 'info',
        },
        {
          type: 'BUDGET_WARNING',
          message: 'Você está próximo de estourar o orçamento de transporte',
          severity: 'warning',
        },
      ];

      const mockResponse: AxiosResponse = {
        data: mockInsights,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      mockPrismaService.transaction.findMany.mockResolvedValue(mockTransactions);
      mockHttpService.post.mockReturnValue(of(mockResponse));

      const result = await service.generateInsights(userId);

      expect(result).toEqual(mockInsights);
      expect(mockPrismaService.transaction.findMany).toHaveBeenCalledWith({
        where: {
          userId,
          date: { gte: expect.any(Date) },
          isPaid: true,
        },
        include: { category: true },
        orderBy: { date: 'asc' },
      });
      expect(mockHttpService.post).toHaveBeenCalledWith(
        expect.stringContaining('/insights'),
        expect.objectContaining({
          transactions: expect.arrayContaining([
            expect.objectContaining({
              amount: 150.5,
              type: 'EXPENSE',
              category_name: 'Alimentação',
            }),
          ]),
        })
      );
    });

    it('deve retornar array vazio quando não há transações', async () => {
      mockPrismaService.transaction.findMany.mockResolvedValue([]);

      const result = await service.generateInsights(userId);

      expect(result).toEqual([]);
      expect(mockHttpService.post).not.toHaveBeenCalled();
    });

    it('deve usar "Outros" quando categoria é nula', async () => {
      const mockTransactions = [
        {
          id: 'tx-1',
          amount: 100,
          date: new Date('2024-01-15'),
          type: 'EXPENSE' as LaunchType,
          isPaid: true,
          userId,
          category: null,
        },
      ];

      const mockResponse: AxiosResponse = {
        data: [],
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      mockPrismaService.transaction.findMany.mockResolvedValue(mockTransactions);
      mockHttpService.post.mockReturnValue(of(mockResponse));

      await service.generateInsights(userId);

      expect(mockHttpService.post).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          transactions: expect.arrayContaining([
            expect.objectContaining({
              category_name: 'Outros',
            }),
          ]),
        })
      );
    });

    it('deve retornar array vazio em caso de erro da IA', async () => {
      const mockTransactions = [
        {
          id: 'tx-1',
          amount: 100,
          date: new Date('2024-01-15'),
          type: 'EXPENSE' as LaunchType,
          isPaid: true,
          userId,
          category: { id: 'cat-1', name: 'Alimentação' },
        },
      ];

      mockPrismaService.transaction.findMany.mockResolvedValue(mockTransactions);
      mockHttpService.post.mockReturnValue(throwError(() => new Error('AI service error')));

      const result = await service.generateInsights(userId);

      expect(result).toEqual([]);
      expect(service['logger'].warn).toHaveBeenCalledWith(
        expect.stringContaining('Falha ao gerar insights')
      );
    });

    it('deve buscar transações dos últimos 3 meses', async () => {
      mockPrismaService.transaction.findMany.mockResolvedValue([]);

      await service.generateInsights(userId);

      const callArgs = mockPrismaService.transaction.findMany.mock.calls[0][0];
      const dateFilter = callArgs.where.date.gte;
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      // Verificar que a data é aproximadamente 3 meses atrás (com margem de 1 dia)
      const diff = Math.abs(dateFilter.getTime() - threeMonthsAgo.getTime());
      expect(diff).toBeLessThan(24 * 60 * 60 * 1000); // Menos de 1 dia de diferença
    });

    it('deve ordenar transações por data ascendente', async () => {
      mockPrismaService.transaction.findMany.mockResolvedValue([]);

      await service.generateInsights(userId);

      expect(mockPrismaService.transaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { date: 'asc' },
        })
      );
    });

    it('deve converter amount para Number', async () => {
      const mockTransactions = [
        {
          id: 'tx-1',
          amount: '150.50', // String do Prisma Decimal
          date: new Date('2024-01-15'),
          type: 'EXPENSE' as LaunchType,
          isPaid: true,
          userId,
          category: { id: 'cat-1', name: 'Alimentação' },
        },
      ];

      const mockResponse: AxiosResponse = {
        data: [],
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      mockPrismaService.transaction.findMany.mockResolvedValue(mockTransactions);
      mockHttpService.post.mockReturnValue(of(mockResponse));

      await service.generateInsights(userId);

      expect(mockHttpService.post).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          transactions: expect.arrayContaining([
            expect.objectContaining({
              amount: 150.5, // Deve ser number
            }),
          ]),
        })
      );
    });

    it('deve converter data para ISO string', async () => {
      const testDate = new Date('2024-01-15T10:30:00Z');
      const mockTransactions = [
        {
          id: 'tx-1',
          amount: 100,
          date: testDate,
          type: 'EXPENSE' as LaunchType,
          isPaid: true,
          userId,
          category: { id: 'cat-1', name: 'Alimentação' },
        },
      ];

      const mockResponse: AxiosResponse = {
        data: [],
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      mockPrismaService.transaction.findMany.mockResolvedValue(mockTransactions);
      mockHttpService.post.mockReturnValue(of(mockResponse));

      await service.generateInsights(userId);

      expect(mockHttpService.post).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          transactions: expect.arrayContaining([
            expect.objectContaining({
              date: testDate.toISOString(),
            }),
          ]),
        })
      );
    });

    it('deve logar quantidade de insights gerados', async () => {
      const mockTransactions = [
        {
          id: 'tx-1',
          amount: 100,
          date: new Date(),
          type: 'EXPENSE' as LaunchType,
          isPaid: true,
          userId,
          category: { id: 'cat-1', name: 'Alimentação' },
        },
      ];

      const mockInsights = [
        { type: 'INFO', message: 'Test 1', severity: 'info' },
        { type: 'WARNING', message: 'Test 2', severity: 'warning' },
      ];

      const mockResponse: AxiosResponse = {
        data: mockInsights,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      mockPrismaService.transaction.findMany.mockResolvedValue(mockTransactions);
      mockHttpService.post.mockReturnValue(of(mockResponse));

      await service.generateInsights(userId);

      expect(service['logger'].log).toHaveBeenCalledWith(
        expect.stringContaining('IA gerou 2 insights')
      );
    });
  });
});
