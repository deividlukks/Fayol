import { Test, TestingModule } from '@nestjs/testing';
import { GoalsService } from '../../../src/modules/goals/services/goals.service';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { mockPrismaFactory, createMockGoal } from '../../utils/test-helpers';

describe('GoalsService', () => {
  let service: GoalsService;
  let prisma: ReturnType<typeof mockPrismaFactory>;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
  };

  const mockUser2 = {
    id: 'user-456',
    email: 'other@example.com',
    name: 'Other User',
  };

  beforeEach(async () => {
    // Create mocks
    prisma = mockPrismaFactory();

    // Create testing module
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoalsService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<GoalsService>(GoalsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ==================== CREATE METHOD ====================

  describe('create', () => {
    const createGoalDto = {
      title: 'Comprar um carro',
      currentAmount: 10000,
      targetAmount: 50000,
      deadline: new Date('2025-12-31'),
      color: '#FF5733',
    };

    it('should create a goal successfully with all fields', async () => {
      const mockGoal = createMockGoal({
        ...createGoalDto,
        userId: mockUser.id,
      });

      prisma.goal.create.mockResolvedValue(mockGoal as any);

      const result = await service.create(mockUser.id, createGoalDto);

      expect(prisma.goal.create).toHaveBeenCalledWith({
        data: {
          userId: mockUser.id,
          title: createGoalDto.title,
          currentAmount: createGoalDto.currentAmount,
          targetAmount: createGoalDto.targetAmount,
          deadline: createGoalDto.deadline,
          color: createGoalDto.color,
        },
      });
      expect(result).toEqual(mockGoal);
    });

    it('should create goal without optional deadline', async () => {
      const dtoWithoutDeadline = {
        title: 'Meta sem prazo',
        currentAmount: 0,
        targetAmount: 10000,
        color: '#00FF00',
      };

      const mockGoal = createMockGoal({
        ...dtoWithoutDeadline,
        userId: mockUser.id,
        deadline: undefined,
      });

      prisma.goal.create.mockResolvedValue(mockGoal as any);

      const result = await service.create(mockUser.id, dtoWithoutDeadline);

      expect(prisma.goal.create).toHaveBeenCalledWith({
        data: {
          userId: mockUser.id,
          title: dtoWithoutDeadline.title,
          currentAmount: dtoWithoutDeadline.currentAmount,
          targetAmount: dtoWithoutDeadline.targetAmount,
          deadline: undefined,
          color: dtoWithoutDeadline.color,
        },
      });
      expect(result.deadline).toBeUndefined();
    });

    it('should create goal without optional color', async () => {
      const dtoWithoutColor = {
        title: 'Meta sem cor',
        currentAmount: 0,
        targetAmount: 5000,
        deadline: new Date('2025-06-30'),
      };

      const mockGoal = createMockGoal({
        ...dtoWithoutColor,
        userId: mockUser.id,
        color: undefined,
      });

      prisma.goal.create.mockResolvedValue(mockGoal as any);

      const result = await service.create(mockUser.id, dtoWithoutColor);

      expect(result.color).toBeUndefined();
    });

    it('should create goal with currentAmount of 0', async () => {
      const dtoWithZeroCurrent = {
        ...createGoalDto,
        currentAmount: 0,
      };

      const mockGoal = createMockGoal({
        ...dtoWithZeroCurrent,
        userId: mockUser.id,
      });

      prisma.goal.create.mockResolvedValue(mockGoal as any);

      const result = await service.create(mockUser.id, dtoWithZeroCurrent);

      expect(result.currentAmount).toBe(0);
    });

    it('should create goal with minimum targetAmount (1)', async () => {
      const dtoWithMinTarget = {
        ...createGoalDto,
        targetAmount: 1,
      };

      const mockGoal = createMockGoal({
        ...dtoWithMinTarget,
        userId: mockUser.id,
      });

      prisma.goal.create.mockResolvedValue(mockGoal as any);

      const result = await service.create(mockUser.id, dtoWithMinTarget);

      expect(result.targetAmount).toBe(1);
    });

    it('should create goal with large targetAmount', async () => {
      const dtoWithLargeTarget = {
        ...createGoalDto,
        targetAmount: 999999999.99,
      };

      const mockGoal = createMockGoal({
        ...dtoWithLargeTarget,
        userId: mockUser.id,
      });

      prisma.goal.create.mockResolvedValue(mockGoal as any);

      const result = await service.create(mockUser.id, dtoWithLargeTarget);

      expect(result.targetAmount).toBe(999999999.99);
    });

    it('should create goal with decimal amounts', async () => {
      const dtoWithDecimals = {
        ...createGoalDto,
        currentAmount: 1234.56,
        targetAmount: 9999.99,
      };

      const mockGoal = createMockGoal({
        ...dtoWithDecimals,
        userId: mockUser.id,
      });

      prisma.goal.create.mockResolvedValue(mockGoal as any);

      const result = await service.create(mockUser.id, dtoWithDecimals);

      expect(result.currentAmount).toBe(1234.56);
      expect(result.targetAmount).toBe(9999.99);
    });

    it('should create goal where currentAmount equals targetAmount', async () => {
      const dtoEqual = {
        ...createGoalDto,
        currentAmount: 10000,
        targetAmount: 10000,
      };

      const mockGoal = createMockGoal({
        ...dtoEqual,
        userId: mockUser.id,
      });

      prisma.goal.create.mockResolvedValue(mockGoal as any);

      const result = await service.create(mockUser.id, dtoEqual);

      expect(result.currentAmount).toBe(result.targetAmount);
    });

    it('should create goal where currentAmount is greater than targetAmount', async () => {
      const dtoExceeded = {
        ...createGoalDto,
        currentAmount: 60000,
        targetAmount: 50000,
      };

      const mockGoal = createMockGoal({
        ...dtoExceeded,
        userId: mockUser.id,
      });

      prisma.goal.create.mockResolvedValue(mockGoal as any);

      const result = await service.create(mockUser.id, dtoExceeded);

      expect(result.currentAmount).toBeGreaterThan(result.targetAmount);
    });

    it('should create goal with deadline in the past', async () => {
      const dtoWithPastDeadline = {
        ...createGoalDto,
        deadline: new Date('2020-01-01'),
      };

      const mockGoal = createMockGoal({
        ...dtoWithPastDeadline,
        userId: mockUser.id,
      });

      prisma.goal.create.mockResolvedValue(mockGoal as any);

      const result = await service.create(mockUser.id, dtoWithPastDeadline);

      expect(result.deadline).toEqual(dtoWithPastDeadline.deadline);
    });

    it('should create goal with deadline far in the future', async () => {
      const futureDate = new Date('2050-12-31');
      const dtoWithFutureDeadline = {
        ...createGoalDto,
        deadline: futureDate,
      };

      const mockGoal = createMockGoal({
        ...dtoWithFutureDeadline,
        userId: mockUser.id,
      });

      prisma.goal.create.mockResolvedValue(mockGoal as any);

      const result = await service.create(mockUser.id, dtoWithFutureDeadline);

      expect(result.deadline).toEqual(futureDate);
    });

    it('should create goal for different user', async () => {
      const mockGoal = createMockGoal({
        ...createGoalDto,
        userId: mockUser2.id,
      });

      prisma.goal.create.mockResolvedValue(mockGoal as any);

      const result = await service.create(mockUser2.id, createGoalDto);

      expect(prisma.goal.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: mockUser2.id,
        }),
      });
      expect(result.userId).toBe(mockUser2.id);
    });

    it('should create multiple goals with different titles', async () => {
      const goal1Dto = { ...createGoalDto, title: 'Meta 1' };
      const goal2Dto = { ...createGoalDto, title: 'Meta 2' };

      const mockGoal1 = createMockGoal({ ...goal1Dto, userId: mockUser.id });
      const mockGoal2 = createMockGoal({ ...goal2Dto, userId: mockUser.id });

      prisma.goal.create.mockResolvedValueOnce(mockGoal1 as any);
      prisma.goal.create.mockResolvedValueOnce(mockGoal2 as any);

      const result1 = await service.create(mockUser.id, goal1Dto);
      const result2 = await service.create(mockUser.id, goal2Dto);

      expect(result1.title).not.toBe(result2.title);
      expect(prisma.goal.create).toHaveBeenCalledTimes(2);
    });

    it('should create goal with special characters in title', async () => {
      const dtoWithSpecialChars = {
        ...createGoalDto,
        title: 'Casa própria - Apê 100m² (2025)',
      };

      const mockGoal = createMockGoal({
        ...dtoWithSpecialChars,
        userId: mockUser.id,
      });

      prisma.goal.create.mockResolvedValue(mockGoal as any);

      const result = await service.create(mockUser.id, dtoWithSpecialChars);

      expect(result.title).toBe(dtoWithSpecialChars.title);
    });

    it('should create goal with unicode characters in title', async () => {
      const dtoWithUnicode = {
        ...createGoalDto,
        title: 'Viagem ao Japão 日本',
      };

      const mockGoal = createMockGoal({
        ...dtoWithUnicode,
        userId: mockUser.id,
      });

      prisma.goal.create.mockResolvedValue(mockGoal as any);

      const result = await service.create(mockUser.id, dtoWithUnicode);

      expect(result.title).toBe(dtoWithUnicode.title);
    });

    it('should create goal with hex color', async () => {
      const dtoWithHexColor = {
        ...createGoalDto,
        color: '#ABCDEF',
      };

      const mockGoal = createMockGoal({
        ...dtoWithHexColor,
        userId: mockUser.id,
      });

      prisma.goal.create.mockResolvedValue(mockGoal as any);

      const result = await service.create(mockUser.id, dtoWithHexColor);

      expect(result.color).toBe('#ABCDEF');
    });

    it('should create goal with named color', async () => {
      const dtoWithNamedColor = {
        ...createGoalDto,
        color: 'blue',
      };

      const mockGoal = createMockGoal({
        ...dtoWithNamedColor,
        userId: mockUser.id,
      });

      prisma.goal.create.mockResolvedValue(mockGoal as any);

      const result = await service.create(mockUser.id, dtoWithNamedColor);

      expect(result.color).toBe('blue');
    });
  });

  // ==================== FINDALL METHOD ====================

  describe('findAll', () => {
    it('should return all goals for user', async () => {
      const mockGoals = [
        createMockGoal({
          id: 'goal-1',
          userId: mockUser.id,
          title: 'Meta 1',
        }),
        createMockGoal({
          id: 'goal-2',
          userId: mockUser.id,
          title: 'Meta 2',
        }),
        createMockGoal({
          id: 'goal-3',
          userId: mockUser.id,
          title: 'Meta 3',
        }),
      ];

      prisma.goal.findMany.mockResolvedValue(mockGoals as any);

      const result = await service.findAll(mockUser.id);

      expect(prisma.goal.findMany).toHaveBeenCalledWith({
        where: { userId: mockUser.id },
        orderBy: { createdAt: 'asc' },
      });
      expect(result).toEqual(mockGoals);
      expect(result).toHaveLength(3);
    });

    it('should return empty array if user has no goals', async () => {
      prisma.goal.findMany.mockResolvedValue([]);

      const result = await service.findAll(mockUser.id);

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should order goals by createdAt ascending', async () => {
      const mockGoals = [
        createMockGoal({
          createdAt: new Date('2024-01-01'),
        }),
        createMockGoal({
          createdAt: new Date('2024-02-01'),
        }),
      ];

      prisma.goal.findMany.mockResolvedValue(mockGoals as any);

      await service.findAll(mockUser.id);

      expect(prisma.goal.findMany).toHaveBeenCalledWith({
        where: { userId: mockUser.id },
        orderBy: { createdAt: 'asc' },
      });
    });

    it('should not return goals from other users', async () => {
      const mockGoals = [
        createMockGoal({
          userId: mockUser.id,
          title: 'User 1 Goal',
        }),
      ];

      prisma.goal.findMany.mockResolvedValue(mockGoals as any);

      const result = await service.findAll(mockUser.id);

      expect(prisma.goal.findMany).toHaveBeenCalledWith({
        where: { userId: mockUser.id },
        orderBy: { createdAt: 'asc' },
      });
      expect(result.every((goal: any) => goal.userId === mockUser.id)).toBe(true);
    });

    it('should return goals with different completion percentages', async () => {
      const mockGoals = [
        createMockGoal({
          currentAmount: 0,
          targetAmount: 10000,
        }),
        createMockGoal({
          currentAmount: 5000,
          targetAmount: 10000,
        }),
        createMockGoal({
          currentAmount: 10000,
          targetAmount: 10000,
        }),
      ];

      prisma.goal.findMany.mockResolvedValue(mockGoals as any);

      const result = await service.findAll(mockUser.id);

      expect(result).toHaveLength(3);
      expect(result[0].currentAmount).toBe(0);
      expect(result[1].currentAmount).toBe(5000);
      expect(result[2].currentAmount).toBe(10000);
    });

    it('should return goals with and without deadlines', async () => {
      const mockGoals = [
        createMockGoal({
          deadline: new Date('2025-12-31'),
        }),
        createMockGoal({
          deadline: undefined,
        }),
      ];

      prisma.goal.findMany.mockResolvedValue(mockGoals as any);

      const result = await service.findAll(mockUser.id);

      expect(result).toHaveLength(2);
      expect(result[0].deadline).toBeDefined();
      expect(result[1].deadline).toBeUndefined();
    });

    it('should return goals with and without colors', async () => {
      const mockGoals = [
        createMockGoal({
          color: '#FF5733',
        }),
        createMockGoal({
          color: undefined,
        }),
      ];

      prisma.goal.findMany.mockResolvedValue(mockGoals as any);

      const result = await service.findAll(mockUser.id);

      expect(result).toHaveLength(2);
      expect(result[0].color).toBe('#FF5733');
      expect(result[1].color).toBeUndefined();
    });

    it('should return large number of goals', async () => {
      const mockGoals = Array.from({ length: 100 }, (_, i) =>
        createMockGoal({
          id: `goal-${i}`,
          userId: mockUser.id,
          title: `Meta ${i}`,
        })
      );

      prisma.goal.findMany.mockResolvedValue(mockGoals as any);

      const result = await service.findAll(mockUser.id);

      expect(result).toHaveLength(100);
    });

    it('should return single goal', async () => {
      const mockGoals = [
        createMockGoal({
          userId: mockUser.id,
        }),
      ];

      prisma.goal.findMany.mockResolvedValue(mockGoals as any);

      const result = await service.findAll(mockUser.id);

      expect(result).toHaveLength(1);
    });

    it('should handle multiple calls for different users', async () => {
      const user1Goals = [createMockGoal({ userId: mockUser.id })];
      const user2Goals = [createMockGoal({ userId: mockUser2.id })];

      prisma.goal.findMany.mockResolvedValueOnce(user1Goals as any);
      prisma.goal.findMany.mockResolvedValueOnce(user2Goals as any);

      await service.findAll(mockUser.id);
      await service.findAll(mockUser2.id);

      expect(prisma.goal.findMany).toHaveBeenCalledTimes(2);
      expect(prisma.goal.findMany).toHaveBeenNthCalledWith(1, {
        where: { userId: mockUser.id },
        orderBy: { createdAt: 'asc' },
      });
      expect(prisma.goal.findMany).toHaveBeenNthCalledWith(2, {
        where: { userId: mockUser2.id },
        orderBy: { createdAt: 'asc' },
      });
    });
  });

  // ==================== UPDATEAMOUNT METHOD ====================

  describe('updateAmount', () => {
    const goalId = 'goal-123';

    it('should update amount successfully', async () => {
      const mockGoal = createMockGoal({
        id: goalId,
        userId: mockUser.id,
        currentAmount: 10000,
        targetAmount: 50000,
      });

      const updatedGoal = createMockGoal({
        ...mockGoal,
        currentAmount: 15000,
      });

      prisma.goal.findFirst.mockResolvedValue(mockGoal as any);
      prisma.goal.update.mockResolvedValue(updatedGoal as any);

      const result = await service.updateAmount(goalId, mockUser.id, 15000);

      expect(prisma.goal.findFirst).toHaveBeenCalledWith({
        where: { id: goalId, userId: mockUser.id },
      });
      expect(prisma.goal.update).toHaveBeenCalledWith({
        where: { id: goalId },
        data: { currentAmount: 15000 },
      });
      expect(result.currentAmount).toBe(15000);
    });

    it('should check ownership before updating', async () => {
      const mockGoal = createMockGoal({
        id: goalId,
        userId: mockUser.id,
      });

      prisma.goal.findFirst.mockResolvedValue(mockGoal as any);
      prisma.goal.update.mockResolvedValue(mockGoal as any);

      await service.updateAmount(goalId, mockUser.id, 20000);

      expect(prisma.goal.findFirst).toHaveBeenCalledWith({
        where: { id: goalId, userId: mockUser.id },
      });
    });

    it('should throw NotFoundException when goal does not exist', async () => {
      prisma.goal.findFirst.mockResolvedValue(null);

      await expect(service.updateAmount(goalId, mockUser.id, 20000)).rejects.toThrow(
        NotFoundException
      );

      await expect(service.updateAmount(goalId, mockUser.id, 20000)).rejects.toThrow(
        'Meta não encontrada'
      );

      expect(prisma.goal.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when goal belongs to different user', async () => {
      prisma.goal.findFirst.mockResolvedValue(null); // Returns null because userId doesn't match

      await expect(service.updateAmount(goalId, mockUser.id, 20000)).rejects.toThrow(
        NotFoundException
      );

      expect(prisma.goal.update).not.toHaveBeenCalled();
    });

    it('should update amount to 0', async () => {
      const mockGoal = createMockGoal({
        id: goalId,
        userId: mockUser.id,
        currentAmount: 10000,
      });

      const updatedGoal = createMockGoal({
        ...mockGoal,
        currentAmount: 0,
      });

      prisma.goal.findFirst.mockResolvedValue(mockGoal as any);
      prisma.goal.update.mockResolvedValue(updatedGoal as any);

      const result = await service.updateAmount(goalId, mockUser.id, 0);

      expect(result.currentAmount).toBe(0);
    });

    it('should update amount to targetAmount (goal complete)', async () => {
      const mockGoal = createMockGoal({
        id: goalId,
        userId: mockUser.id,
        currentAmount: 10000,
        targetAmount: 50000,
      });

      const updatedGoal = createMockGoal({
        ...mockGoal,
        currentAmount: 50000,
      });

      prisma.goal.findFirst.mockResolvedValue(mockGoal as any);
      prisma.goal.update.mockResolvedValue(updatedGoal as any);

      const result = await service.updateAmount(goalId, mockUser.id, 50000);

      expect(result.currentAmount).toBe(result.targetAmount);
    });

    it('should update amount above targetAmount', async () => {
      const mockGoal = createMockGoal({
        id: goalId,
        userId: mockUser.id,
        currentAmount: 10000,
        targetAmount: 50000,
      });

      const updatedGoal = createMockGoal({
        ...mockGoal,
        currentAmount: 60000,
      });

      prisma.goal.findFirst.mockResolvedValue(mockGoal as any);
      prisma.goal.update.mockResolvedValue(updatedGoal as any);

      const result = await service.updateAmount(goalId, mockUser.id, 60000);

      expect(result.currentAmount).toBeGreaterThan(result.targetAmount);
    });

    it('should update amount with decimals', async () => {
      const mockGoal = createMockGoal({
        id: goalId,
        userId: mockUser.id,
        currentAmount: 1000,
      });

      const updatedGoal = createMockGoal({
        ...mockGoal,
        currentAmount: 1234.56,
      });

      prisma.goal.findFirst.mockResolvedValue(mockGoal as any);
      prisma.goal.update.mockResolvedValue(updatedGoal as any);

      const result = await service.updateAmount(goalId, mockUser.id, 1234.56);

      expect(result.currentAmount).toBe(1234.56);
    });

    it('should update amount to very large number', async () => {
      const mockGoal = createMockGoal({
        id: goalId,
        userId: mockUser.id,
        currentAmount: 0,
      });

      const updatedGoal = createMockGoal({
        ...mockGoal,
        currentAmount: 999999999.99,
      });

      prisma.goal.findFirst.mockResolvedValue(mockGoal as any);
      prisma.goal.update.mockResolvedValue(updatedGoal as any);

      const result = await service.updateAmount(goalId, mockUser.id, 999999999.99);

      expect(result.currentAmount).toBe(999999999.99);
    });

    it('should decrease amount', async () => {
      const mockGoal = createMockGoal({
        id: goalId,
        userId: mockUser.id,
        currentAmount: 10000,
      });

      const updatedGoal = createMockGoal({
        ...mockGoal,
        currentAmount: 5000,
      });

      prisma.goal.findFirst.mockResolvedValue(mockGoal as any);
      prisma.goal.update.mockResolvedValue(updatedGoal as any);

      const result = await service.updateAmount(goalId, mockUser.id, 5000);

      expect(result.currentAmount).toBe(5000);
    });

    it('should update amount multiple times', async () => {
      const mockGoal = createMockGoal({
        id: goalId,
        userId: mockUser.id,
        currentAmount: 0,
      });

      prisma.goal.findFirst.mockResolvedValue(mockGoal as any);

      const update1 = createMockGoal({ ...mockGoal, currentAmount: 1000 });
      const update2 = createMockGoal({ ...mockGoal, currentAmount: 2000 });
      const update3 = createMockGoal({ ...mockGoal, currentAmount: 3000 });

      prisma.goal.update.mockResolvedValueOnce(update1 as any);
      prisma.goal.update.mockResolvedValueOnce(update2 as any);
      prisma.goal.update.mockResolvedValueOnce(update3 as any);

      await service.updateAmount(goalId, mockUser.id, 1000);
      await service.updateAmount(goalId, mockUser.id, 2000);
      await service.updateAmount(goalId, mockUser.id, 3000);

      expect(prisma.goal.update).toHaveBeenCalledTimes(3);
    });

    it('should preserve other goal fields when updating amount', async () => {
      const mockGoal = createMockGoal({
        id: goalId,
        userId: mockUser.id,
        title: 'Original Title',
        currentAmount: 10000,
        targetAmount: 50000,
        deadline: new Date('2025-12-31'),
        color: '#FF5733',
      });

      const updatedGoal = createMockGoal({
        ...mockGoal,
        currentAmount: 20000,
      });

      prisma.goal.findFirst.mockResolvedValue(mockGoal as any);
      prisma.goal.update.mockResolvedValue(updatedGoal as any);

      const result = await service.updateAmount(goalId, mockUser.id, 20000);

      // Other fields should remain unchanged
      expect(result.title).toBe('Original Title');
      expect(result.targetAmount).toBe(50000);
      expect(result.deadline).toEqual(new Date('2025-12-31'));
      expect(result.color).toBe('#FF5733');
      // Only currentAmount changed
      expect(result.currentAmount).toBe(20000);
    });

    it('should handle concurrent updates to different goals', async () => {
      const goal1 = createMockGoal({
        id: 'goal-1',
        userId: mockUser.id,
        currentAmount: 1000,
      });

      const goal2 = createMockGoal({
        id: 'goal-2',
        userId: mockUser.id,
        currentAmount: 2000,
      });

      prisma.goal.findFirst.mockResolvedValueOnce(goal1 as any);
      prisma.goal.findFirst.mockResolvedValueOnce(goal2 as any);

      prisma.goal.update.mockResolvedValueOnce({
        ...goal1,
        currentAmount: 1500,
      } as any);

      prisma.goal.update.mockResolvedValueOnce({
        ...goal2,
        currentAmount: 2500,
      } as any);

      await service.updateAmount('goal-1', mockUser.id, 1500);
      await service.updateAmount('goal-2', mockUser.id, 2500);

      expect(prisma.goal.update).toHaveBeenCalledTimes(2);
    });

    it('should update amount for different users', async () => {
      const goal1 = createMockGoal({
        id: goalId,
        userId: mockUser.id,
      });

      const goal2 = createMockGoal({
        id: 'goal-456',
        userId: mockUser2.id,
      });

      prisma.goal.findFirst.mockResolvedValueOnce(goal1 as any);
      prisma.goal.findFirst.mockResolvedValueOnce(goal2 as any);

      prisma.goal.update.mockResolvedValueOnce({
        ...goal1,
        currentAmount: 10000,
      } as any);

      prisma.goal.update.mockResolvedValueOnce({
        ...goal2,
        currentAmount: 20000,
      } as any);

      await service.updateAmount(goalId, mockUser.id, 10000);
      await service.updateAmount('goal-456', mockUser2.id, 20000);

      expect(prisma.goal.findFirst).toHaveBeenCalledWith({
        where: { id: goalId, userId: mockUser.id },
      });

      expect(prisma.goal.findFirst).toHaveBeenCalledWith({
        where: { id: 'goal-456', userId: mockUser2.id },
      });
    });

    it('should update amount from partial progress to complete', async () => {
      const mockGoal = createMockGoal({
        id: goalId,
        userId: mockUser.id,
        currentAmount: 25000,
        targetAmount: 50000,
      });

      const updatedGoal = createMockGoal({
        ...mockGoal,
        currentAmount: 50000,
      });

      prisma.goal.findFirst.mockResolvedValue(mockGoal as any);
      prisma.goal.update.mockResolvedValue(updatedGoal as any);

      const result = await service.updateAmount(goalId, mockUser.id, 50000);

      expect(result.currentAmount).toBe(result.targetAmount);
    });
  });
});
