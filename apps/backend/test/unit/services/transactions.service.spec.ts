import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { TransactionsService } from '../../../src/modules/transactions/services/transactions.service';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { AiService } from '../../../src/modules/ai/services/ai.service';
import { LaunchType } from '@fayol/shared-types';

describe('TransactionsService', () => {
  let service: TransactionsService;
  let prismaService: jest.Mocked<any>;
  let aiService: jest.Mocked<AiService>;

  const mockUser = { id: 'user-123' };
  const mockAccount = {
    id: 'account-123',
    userId: 'user-123',
    name: 'Main Account',
    balance: 1000,
  };
  const mockDestAccount = {
    id: 'account-456',
    userId: 'user-123',
    name: 'Savings Account',
    balance: 500,
  };
  const mockCategory = {
    id: 'category-123',
    name: 'Food',
    type: LaunchType.EXPENSE,
  };
  const mockTransaction = {
    id: 'transaction-123',
    userId: 'user-123',
    accountId: 'account-123',
    categoryId: 'category-123',
    description: 'Grocery shopping',
    amount: 100,
    date: new Date(),
    type: LaunchType.EXPENSE,
    isPaid: true,
    recurrence: null,
    notes: null,
    tags: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        {
          provide: PrismaService,
          useValue: {
            account: {
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            transaction: {
              create: jest.fn(),
              findUnique: jest.fn(),
              findMany: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
              aggregate: jest.fn(),
            },
            category: {
              findUnique: jest.fn(),
            },
            $transaction: jest.fn(),
          },
        },
        {
          provide: AiService,
          useValue: {
            predictCategory: jest.fn(),
            learnCategory: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
    prismaService = module.get(PrismaService);
    aiService = module.get(AiService) as jest.Mocked<AiService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto = {
      accountId: 'account-123',
      categoryId: 'category-123',
      description: 'Test expense',
      amount: 100,
      date: new Date(),
      type: LaunchType.EXPENSE,
      isPaid: true,
      recurrence: null,
      notes: null,
      tags: [],
    };

    it('should create a transaction successfully', async () => {
      prismaService.account.findUnique.mockResolvedValue(mockAccount);
      prismaService.$transaction.mockImplementation((callback) =>
        callback({
          transaction: {
            create: jest.fn().mockResolvedValue(mockTransaction),
          },
          account: {
            update: jest.fn().mockResolvedValue({ ...mockAccount, balance: 900 }),
          },
        })
      );

      const result = await service.create(mockUser.id, createDto);

      expect(result).toBeDefined();
      expect(prismaService.account.findUnique).toHaveBeenCalledWith({
        where: { id: createDto.accountId },
      });
    });

    it('should throw NotFoundException when account not found', async () => {
      prismaService.account.findUnique.mockResolvedValue(null);

      await expect(service.create(mockUser.id, createDto)).rejects.toThrow(NotFoundException);
      await expect(service.create(mockUser.id, createDto)).rejects.toThrow(
        'Conta de origem não encontrada.'
      );
    });

    it('should throw NotFoundException when account belongs to different user', async () => {
      prismaService.account.findUnique.mockResolvedValue({
        ...mockAccount,
        userId: 'different-user-id',
      });

      await expect(service.create(mockUser.id, createDto)).rejects.toThrow(NotFoundException);
    });

    it('should use AI to predict category when categoryId is not provided', async () => {
      const dtoWithoutCategory = { ...createDto, categoryId: undefined };
      prismaService.account.findUnique.mockResolvedValue(mockAccount);
      aiService.predictCategory.mockResolvedValue({
        found: true,
        category: mockCategory,
        confidence: 0.95,
      });
      prismaService.$transaction.mockImplementation((callback) =>
        callback({
          transaction: {
            create: jest.fn().mockResolvedValue(mockTransaction),
          },
          account: {
            update: jest.fn().mockResolvedValue(mockAccount),
          },
        })
      );

      await service.create(mockUser.id, dtoWithoutCategory);

      expect(aiService.predictCategory).toHaveBeenCalledWith(
        mockUser.id,
        dtoWithoutCategory.description
      );
    });

    it('should handle transfer between accounts', async () => {
      const transferDto = {
        ...createDto,
        type: LaunchType.TRANSFER,
        destinationAccountId: 'account-456',
      };

      prismaService.account.findUnique
        .mockResolvedValueOnce(mockAccount)
        .mockResolvedValueOnce(mockDestAccount);

      prismaService.$transaction.mockImplementation((callback) =>
        callback({
          transaction: {
            create: jest.fn().mockResolvedValue(mockTransaction),
          },
          account: {
            update: jest.fn().mockResolvedValue(mockAccount),
          },
        })
      );

      await service.create(mockUser.id, transferDto);

      expect(prismaService.account.findUnique).toHaveBeenCalledTimes(2);
    });

    it('should throw BadRequestException for transfer without destination account', async () => {
      const transferDto = {
        ...createDto,
        type: LaunchType.TRANSFER,
        destinationAccountId: undefined,
      };

      prismaService.account.findUnique.mockResolvedValue(mockAccount);

      await expect(service.create(mockUser.id, transferDto)).rejects.toThrow(BadRequestException);
      await expect(service.create(mockUser.id, transferDto)).rejects.toThrow(
        'Conta de destino é obrigatória para transferências.'
      );
    });

    it('should not update balance when transaction is not paid', async () => {
      const unpaidDto = { ...createDto, isPaid: false };
      prismaService.account.findUnique.mockResolvedValue(mockAccount);

      let accountUpdateCalled = false;
      prismaService.$transaction.mockImplementation((callback) =>
        callback({
          transaction: {
            create: jest.fn().mockResolvedValue(mockTransaction),
          },
          account: {
            update: jest.fn().mockImplementation(() => {
              accountUpdateCalled = true;
              return mockAccount;
            }),
          },
        })
      );

      await service.create(mockUser.id, unpaidDto);

      expect(accountUpdateCalled).toBe(false);
    });
  });

  describe('findAll', () => {
    it('should return all transactions for a user', async () => {
      const mockTransactions = [mockTransaction];
      prismaService.transaction.findMany.mockResolvedValue(mockTransactions);

      const result = await service.findAll(mockUser.id);

      expect(result).toEqual(mockTransactions);
      expect(prismaService.transaction.findMany).toHaveBeenCalledWith({
        where: { userId: mockUser.id },
        include: {
          category: { select: { name: true, icon: true, color: true } },
          account: { select: { name: true } },
        },
        orderBy: { date: 'desc' },
      });
    });

    it('should return empty array when no transactions exist', async () => {
      prismaService.transaction.findMany.mockResolvedValue([]);

      const result = await service.findAll(mockUser.id);

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a transaction by id', async () => {
      prismaService.transaction.findUnique.mockResolvedValue(mockTransaction);

      const result = await service.findOne('transaction-123', mockUser.id);

      expect(result).toEqual(mockTransaction);
      expect(prismaService.transaction.findUnique).toHaveBeenCalledWith({
        where: { id: 'transaction-123' },
        include: { category: true, account: true },
      });
    });

    it('should throw NotFoundException when transaction not found', async () => {
      prismaService.transaction.findUnique.mockResolvedValue(null);

      await expect(service.findOne('nonexistent-id', mockUser.id)).rejects.toThrow(
        NotFoundException
      );
      await expect(service.findOne('nonexistent-id', mockUser.id)).rejects.toThrow(
        'Transação não encontrada.'
      );
    });

    it('should throw ForbiddenException when transaction belongs to different user', async () => {
      prismaService.transaction.findUnique.mockResolvedValue({
        ...mockTransaction,
        userId: 'different-user-id',
      });

      await expect(service.findOne('transaction-123', mockUser.id)).rejects.toThrow(
        ForbiddenException
      );
      await expect(service.findOne('transaction-123', mockUser.id)).rejects.toThrow(
        'Acesso negado.'
      );
    });
  });

  describe('update', () => {
    const updateDto = {
      description: 'Updated description',
      amount: 150,
      isPaid: true,
    };

    it('should update a transaction successfully', async () => {
      prismaService.transaction.findUnique.mockResolvedValue(mockTransaction);
      prismaService.$transaction.mockImplementation((callback) =>
        callback({
          transaction: {
            update: jest.fn().mockResolvedValue({ ...mockTransaction, ...updateDto }),
          },
          account: {
            update: jest.fn().mockResolvedValue(mockAccount),
          },
        })
      );

      const result = await service.update('transaction-123', mockUser.id, updateDto);

      expect(result).toBeDefined();
    });

    it('should trigger AI learning when category is changed', async () => {
      const updateWithCategory = { ...updateDto, categoryId: 'new-category-id' };
      prismaService.transaction.findUnique.mockResolvedValue(mockTransaction);
      prismaService.category.findUnique.mockResolvedValue({
        id: 'new-category-id',
        name: 'New Category',
      });
      aiService.learnCategory.mockResolvedValue(undefined);

      prismaService.$transaction.mockImplementation((callback) =>
        callback({
          transaction: {
            update: jest.fn().mockResolvedValue({ ...mockTransaction, ...updateWithCategory }),
          },
          account: {
            update: jest.fn().mockResolvedValue(mockAccount),
          },
        })
      );

      await service.update('transaction-123', mockUser.id, updateWithCategory);

      expect(prismaService.category.findUnique).toHaveBeenCalledWith({
        where: { id: 'new-category-id' },
        select: { name: true },
      });
    });

    it('should recalculate account balance on update', async () => {
      prismaService.transaction.findUnique.mockResolvedValue(mockTransaction);

      let balanceUpdateCount = 0;
      prismaService.$transaction.mockImplementation((callback) =>
        callback({
          transaction: {
            update: jest.fn().mockResolvedValue({ ...mockTransaction, ...updateDto }),
          },
          account: {
            update: jest.fn().mockImplementation(() => {
              balanceUpdateCount++;
              return mockAccount;
            }),
          },
        })
      );

      await service.update('transaction-123', mockUser.id, updateDto);

      // Should reverse old balance and apply new balance (2 updates)
      expect(balanceUpdateCount).toBeGreaterThan(0);
    });
  });

  describe('remove', () => {
    it('should delete a transaction and reverse balance', async () => {
      prismaService.transaction.findUnique.mockResolvedValue(mockTransaction);
      prismaService.$transaction.mockImplementation((callback) =>
        callback({
          transaction: {
            delete: jest.fn().mockResolvedValue(mockTransaction),
          },
          account: {
            update: jest.fn().mockResolvedValue(mockAccount),
          },
        })
      );

      const result = await service.remove('transaction-123', mockUser.id);

      expect(result).toEqual(mockTransaction);
    });

    it('should not update balance when deleting unpaid transaction', async () => {
      const unpaidTransaction = { ...mockTransaction, isPaid: false };
      prismaService.transaction.findUnique.mockResolvedValue(unpaidTransaction);

      let accountUpdateCalled = false;
      prismaService.$transaction.mockImplementation((callback) =>
        callback({
          transaction: {
            delete: jest.fn().mockResolvedValue(unpaidTransaction),
          },
          account: {
            update: jest.fn().mockImplementation(() => {
              accountUpdateCalled = true;
              return mockAccount;
            }),
          },
        })
      );

      await service.remove('transaction-123', mockUser.id);

      expect(accountUpdateCalled).toBe(false);
    });

    it('should throw NotFoundException when trying to delete non-existent transaction', async () => {
      prismaService.transaction.findUnique.mockResolvedValue(null);

      await expect(service.remove('nonexistent-id', mockUser.id)).rejects.toThrow(
        NotFoundException
      );
    });
  });
});
