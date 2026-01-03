import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { BudgetsService } from '../../../src/modules/budgets/services/budgets.service';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { LaunchType } from '@fayol/shared-types';

describe('BudgetsService', () => {
  let service: BudgetsService;
  let prismaService: jest.Mocked<any>;

  const mockUser = { id: 'user-123' };
  const mockCategory = {
    id: 'category-123',
    name: 'Food',
    type: LaunchType.EXPENSE,
  };
  const mockBudget = {
    id: 'budget-123',
    userId: 'user-123',
    categoryId: 'category-123',
    name: 'Monthly Food Budget',
    amount: 1000,
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-01-31'),
    notifyThreshold: 80,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BudgetsService,
        {
          provide: PrismaService,
          useValue: {
            budget: {
              create: jest.fn(),
              findUnique: jest.fn(),
              findMany: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            transaction: {
              aggregate: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<BudgetsService>(BudgetsService);
    prismaService = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto = {
      name: 'Monthly Food Budget',
      amount: 1000,
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-01-31'),
      notifyThreshold: 80,
      categoryId: 'category-123',
    };

    it('should create a budget successfully', async () => {
      prismaService.budget.create.mockResolvedValue(mockBudget);

      const result = await service.create(mockUser.id, createDto);

      expect(result).toEqual(mockBudget);
      expect(prismaService.budget.create).toHaveBeenCalledWith({
        data: {
          name: createDto.name,
          amount: createDto.amount,
          startDate: createDto.startDate,
          endDate: createDto.endDate,
          notifyThreshold: createDto.notifyThreshold,
          user: { connect: { id: mockUser.id } },
          category: { connect: { id: createDto.categoryId } },
        },
      });
    });

    it('should create a global budget without category', async () => {
      const globalBudgetDto = { ...createDto, categoryId: undefined };
      const globalBudget = { ...mockBudget, categoryId: null };
      prismaService.budget.create.mockResolvedValue(globalBudget);

      const result = await service.create(mockUser.id, globalBudgetDto);

      expect(result).toEqual(globalBudget);
      expect(prismaService.budget.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          category: undefined,
        }),
      });
    });
  });

  describe('findAll', () => {
    it('should return all budgets with spent amount calculated', async () => {
      const budgets = [mockBudget];
      prismaService.budget.findMany.mockResolvedValue(budgets);
      prismaService.transaction.aggregate.mockResolvedValue({
        _sum: { amount: 600 },
      });

      const result = await service.findAll(mockUser.id);

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('spent', 600);
      expect(prismaService.budget.findMany).toHaveBeenCalledWith({
        where: { userId: mockUser.id },
        include: { category: true },
        orderBy: { endDate: 'desc' },
      });
    });

    it('should calculate spent as 0 when no transactions exist', async () => {
      prismaService.budget.findMany.mockResolvedValue([mockBudget]);
      prismaService.transaction.aggregate.mockResolvedValue({
        _sum: { amount: null },
      });

      const result = await service.findAll(mockUser.id);

      expect(result[0]).toHaveProperty('spent', 0);
    });

    it('should filter transactions by category when budget has categoryId', async () => {
      prismaService.budget.findMany.mockResolvedValue([mockBudget]);
      prismaService.transaction.aggregate.mockResolvedValue({
        _sum: { amount: 500 },
      });

      await service.findAll(mockUser.id);

      expect(prismaService.transaction.aggregate).toHaveBeenCalledWith({
        _sum: { amount: true },
        where: expect.objectContaining({
          categoryId: mockBudget.categoryId,
        }),
      });
    });
  });

  describe('findOne', () => {
    it('should return a budget with spent amount', async () => {
      prismaService.budget.findUnique.mockResolvedValue(mockBudget);
      prismaService.transaction.aggregate.mockResolvedValue({
        _sum: { amount: 750 },
      });

      const result = await service.findOne('budget-123', mockUser.id);

      expect(result).toHaveProperty('spent', 750);
      expect(result.id).toBe(mockBudget.id);
    });

    it('should throw NotFoundException when budget not found', async () => {
      prismaService.budget.findUnique.mockResolvedValue(null);

      await expect(service.findOne('nonexistent-id', mockUser.id)).rejects.toThrow(
        NotFoundException
      );
      await expect(service.findOne('nonexistent-id', mockUser.id)).rejects.toThrow(
        'Orçamento não encontrado.'
      );
    });

    it('should throw ForbiddenException when budget belongs to different user', async () => {
      prismaService.budget.findUnique.mockResolvedValue({
        ...mockBudget,
        userId: 'different-user-id',
      });

      await expect(service.findOne('budget-123', mockUser.id)).rejects.toThrow(ForbiddenException);
      await expect(service.findOne('budget-123', mockUser.id)).rejects.toThrow('Acesso negado.');
    });
  });

  describe('update', () => {
    const updateDto = {
      name: 'Updated Budget',
      amount: 1200,
      notifyThreshold: 90,
    };

    it('should update a budget successfully', async () => {
      prismaService.budget.findUnique.mockResolvedValue(mockBudget);
      prismaService.transaction.aggregate.mockResolvedValue({ _sum: { amount: 0 } });
      prismaService.budget.update.mockResolvedValue({
        ...mockBudget,
        ...updateDto,
      });

      const result = await service.update('budget-123', mockUser.id, updateDto);

      expect(result.name).toBe(updateDto.name);
      expect(result.amount).toBe(updateDto.amount);
      expect(prismaService.budget.update).toHaveBeenCalledWith({
        where: { id: 'budget-123' },
        data: expect.objectContaining(updateDto),
      });
    });

    it('should throw NotFoundException when budget not found', async () => {
      prismaService.budget.findUnique.mockResolvedValue(null);

      await expect(service.update('nonexistent-id', mockUser.id, updateDto)).rejects.toThrow(
        NotFoundException
      );
      expect(prismaService.budget.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should delete a budget successfully', async () => {
      prismaService.budget.findUnique.mockResolvedValue(mockBudget);
      prismaService.transaction.aggregate.mockResolvedValue({ _sum: { amount: 0 } });
      prismaService.budget.delete.mockResolvedValue(mockBudget);

      const result = await service.remove('budget-123', mockUser.id);

      expect(result).toEqual(mockBudget);
      expect(prismaService.budget.delete).toHaveBeenCalledWith({
        where: { id: 'budget-123' },
      });
    });
  });

  describe('getProgress', () => {
    it('should calculate budget progress correctly', async () => {
      const budget = { ...mockBudget, category: mockCategory };
      prismaService.budget.findMany.mockResolvedValue([budget]);
      prismaService.transaction.aggregate.mockResolvedValue({
        _sum: { amount: 850 },
      });

      const result = await service.getProgress(mockUser.id);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: budget.id,
        name: budget.name,
        amount: 1000,
        spent: 850,
        remaining: 150,
        percentage: 85,
        status: 'warning',
      });
    });

    it('should set status to "exceeded" when spent is over 100%', async () => {
      prismaService.budget.findMany.mockResolvedValue([mockBudget]);
      prismaService.transaction.aggregate.mockResolvedValue({
        _sum: { amount: 1200 },
      });

      const result = await service.getProgress(mockUser.id);

      expect(result[0].status).toBe('exceeded');
      expect(result[0].percentage).toBe(120);
    });

    it('should set status to "safe" when spent is below threshold', async () => {
      prismaService.budget.findMany.mockResolvedValue([mockBudget]);
      prismaService.transaction.aggregate.mockResolvedValue({
        _sum: { amount: 500 },
      });

      const result = await service.getProgress(mockUser.id);

      expect(result[0].status).toBe('safe');
      expect(result[0].percentage).toBe(50);
    });

    it('should calculate days remaining correctly', async () => {
      const futureBudget = {
        ...mockBudget,
        endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
      };
      prismaService.budget.findMany.mockResolvedValue([futureBudget]);
      prismaService.transaction.aggregate.mockResolvedValue({
        _sum: { amount: 100 },
      });

      const result = await service.getProgress(mockUser.id);

      expect(result[0].daysRemaining).toBeGreaterThan(0);
      expect(result[0].daysRemaining).toBeLessThanOrEqual(11);
    });
  });

  describe('getAlerts', () => {
    it('should return alerts for budgets exceeding threshold', async () => {
      prismaService.budget.findMany.mockResolvedValue([mockBudget]);
      prismaService.transaction.aggregate.mockResolvedValue({
        _sum: { amount: 900 },
      });

      const result = await service.getAlerts(mockUser.id);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        budgetId: mockBudget.id,
        budgetName: mockBudget.name,
        severity: 'warning',
        percentage: 90,
      });
    });

    it('should return critical alert when budget is exceeded', async () => {
      prismaService.budget.findMany.mockResolvedValue([mockBudget]);
      prismaService.transaction.aggregate.mockResolvedValue({
        _sum: { amount: 1100 },
      });

      const result = await service.getAlerts(mockUser.id);

      expect(result[0].severity).toBe('critical');
      expect(result[0].message).toContain('excedido');
    });

    it('should return empty array when no budgets exceed threshold', async () => {
      prismaService.budget.findMany.mockResolvedValue([mockBudget]);
      prismaService.transaction.aggregate.mockResolvedValue({
        _sum: { amount: 500 },
      });

      const result = await service.getAlerts(mockUser.id);

      expect(result).toHaveLength(0);
    });
  });

  describe('checkBudgetAfterTransaction', () => {
    it('should check active budgets for a specific category', async () => {
      const today = new Date();
      const activeBudget = {
        ...mockBudget,
        startDate: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000),
        endDate: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000),
      };

      prismaService.budget.findMany.mockResolvedValue([activeBudget]);
      prismaService.transaction.aggregate.mockResolvedValue({
        _sum: { amount: 850 },
      });

      const result = await service.checkBudgetAfterTransaction(mockUser.id, 'category-123');

      expect(result).toHaveLength(1);
      expect(result[0].severity).toBe('warning');
    });

    it('should check global budgets (without category)', async () => {
      const globalBudget = { ...mockBudget, categoryId: null };
      const today = new Date();
      globalBudget.startDate = new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000);
      globalBudget.endDate = new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000);

      prismaService.budget.findMany.mockResolvedValue([globalBudget]);
      prismaService.transaction.aggregate.mockResolvedValue({
        _sum: { amount: 950 },
      });

      const result = await service.checkBudgetAfterTransaction(mockUser.id);

      expect(result).toHaveLength(1);
    });

    it('should return empty array when no active budgets exist', async () => {
      prismaService.budget.findMany.mockResolvedValue([]);

      const result = await service.checkBudgetAfterTransaction(mockUser.id, 'category-123');

      expect(result).toHaveLength(0);
    });
  });
});
