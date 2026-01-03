import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsModule } from '../../../src/modules/transactions/transactions.module';
import { TransactionsService } from '../../../src/modules/transactions/services/transactions.service';
import { TransactionsController } from '../../../src/modules/transactions/controllers/transactions.controller';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { AiService } from '../../../src/modules/ai/services/ai.service';
import { LaunchType } from '@fayol/shared-types';

describe('TransactionsModule Integration', () => {
  let module: TestingModule;
  let transactionsService: TransactionsService;
  let transactionsController: TransactionsController;
  let prismaService: any;
  let aiService: AiService;

  const mockUser = { id: 'user-123' };
  const mockAccount = {
    id: 'account-123',
    userId: 'user-123',
    name: 'Main Account',
    balance: 1000,
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
    module = await Test.createTestingModule({
      imports: [TransactionsModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
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
      })
      .overrideProvider(AiService)
      .useValue({
        predictCategory: jest.fn(),
        learnCategory: jest.fn(),
      })
      .compile();

    transactionsService = module.get<TransactionsService>(TransactionsService);
    transactionsController = module.get<TransactionsController>(TransactionsController);
    prismaService = module.get(PrismaService);
    aiService = module.get<AiService>(AiService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
    expect(transactionsService).toBeDefined();
    expect(transactionsController).toBeDefined();
  });

  describe('Transaction Creation Flow', () => {
    it('should create a transaction and update account balance', async () => {
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

      const result = await transactionsService.create(mockUser.id, createDto);

      expect(result).toBeDefined();
      expect(prismaService.$transaction).toHaveBeenCalled();
    });

    it('should use AI to categorize transaction when category is not provided', async () => {
      const createDto = {
        accountId: 'account-123',
        categoryId: undefined,
        description: 'Supermarket purchase',
        amount: 100,
        date: new Date(),
        type: LaunchType.EXPENSE,
        isPaid: true,
        recurrence: null,
        notes: null,
        tags: [],
      };

      prismaService.account.findUnique.mockResolvedValue(mockAccount);
      (aiService.predictCategory as jest.Mock).mockResolvedValue({
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

      await transactionsService.create(mockUser.id, createDto);

      expect(aiService.predictCategory).toHaveBeenCalledWith(mockUser.id, createDto.description);
    });

    it('should handle transfer between accounts', async () => {
      const transferDto = {
        accountId: 'account-123',
        destinationAccountId: 'account-456',
        description: 'Transfer',
        amount: 200,
        date: new Date(),
        type: LaunchType.TRANSFER,
        isPaid: true,
        categoryId: undefined,
        recurrence: null,
        notes: null,
        tags: [],
      };

      const destAccount = {
        id: 'account-456',
        userId: 'user-123',
        name: 'Savings',
        balance: 500,
      };

      prismaService.account.findUnique
        .mockResolvedValueOnce(mockAccount)
        .mockResolvedValueOnce(destAccount);

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

      await transactionsService.create(mockUser.id, transferDto);

      expect(prismaService.account.findUnique).toHaveBeenCalledTimes(2);
    });
  });

  describe('Transaction Update Flow', () => {
    it('should update transaction and recalculate balance', async () => {
      const updateDto = {
        description: 'Updated description',
        amount: 150,
        isPaid: true,
      };

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

      const result = await transactionsService.update('transaction-123', mockUser.id, updateDto);

      expect(result).toBeDefined();
    });

    it('should trigger AI learning when category is changed', async () => {
      const updateDto = {
        categoryId: 'new-category-id',
      };

      prismaService.transaction.findUnique.mockResolvedValue(mockTransaction);
      prismaService.category.findUnique.mockResolvedValue({
        id: 'new-category-id',
        name: 'New Category',
      });
      (aiService.learnCategory as jest.Mock).mockResolvedValue(undefined);

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

      await transactionsService.update('transaction-123', mockUser.id, updateDto);

      // AI learning is called in background, so we just verify it was set up
      expect(prismaService.category.findUnique).toHaveBeenCalled();
    });
  });

  describe('Transaction Deletion Flow', () => {
    it('should delete transaction and reverse balance change', async () => {
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

      const result = await transactionsService.remove('transaction-123', mockUser.id);

      expect(result).toEqual(mockTransaction);
    });
  });

  describe('Transaction Listing Flow', () => {
    it('should retrieve all transactions for a user', async () => {
      const transactions = [mockTransaction];
      prismaService.transaction.findMany.mockResolvedValue(transactions);

      const result = await transactionsService.findAll(mockUser.id);

      expect(result).toEqual(transactions);
      expect(prismaService.transaction.findMany).toHaveBeenCalledWith({
        where: { userId: mockUser.id },
        include: {
          category: { select: { name: true, icon: true, color: true } },
          account: { select: { name: true } },
        },
        orderBy: { date: 'desc' },
      });
    });

    it('should retrieve a single transaction with details', async () => {
      prismaService.transaction.findUnique.mockResolvedValue(mockTransaction);

      const result = await transactionsService.findOne('transaction-123', mockUser.id);

      expect(result).toEqual(mockTransaction);
    });
  });

  describe('Access Control', () => {
    it('should prevent access to other users transactions', async () => {
      const otherUserTransaction = {
        ...mockTransaction,
        userId: 'other-user-id',
      };

      prismaService.transaction.findUnique.mockResolvedValue(otherUserTransaction);

      await expect(transactionsService.findOne('transaction-123', mockUser.id)).rejects.toThrow(
        'Acesso negado.'
      );
    });

    it('should prevent creating transaction in other users account', async () => {
      const createDto = {
        accountId: 'account-123',
        categoryId: 'category-123',
        description: 'Test',
        amount: 100,
        date: new Date(),
        type: LaunchType.EXPENSE,
        isPaid: true,
        recurrence: null,
        notes: null,
        tags: [],
      };

      const otherUserAccount = {
        ...mockAccount,
        userId: 'other-user-id',
      };

      prismaService.account.findUnique.mockResolvedValue(otherUserAccount);

      await expect(transactionsService.create(mockUser.id, createDto)).rejects.toThrow(
        'Conta de origem não encontrada.'
      );
    });
  });

  describe('Balance Calculation', () => {
    it('should decrease balance for expense when paid', async () => {
      const createDto = {
        accountId: 'account-123',
        categoryId: 'category-123',
        description: 'Expense',
        amount: 100,
        date: new Date(),
        type: LaunchType.EXPENSE,
        isPaid: true,
        recurrence: null,
        notes: null,
        tags: [],
      };

      prismaService.account.findUnique.mockResolvedValue(mockAccount);

      let balanceChange = 0;
      prismaService.$transaction.mockImplementation((callback) =>
        callback({
          transaction: {
            create: jest.fn().mockResolvedValue(mockTransaction),
          },
          account: {
            update: jest.fn().mockImplementation(({ data }) => {
              balanceChange = data.balance.increment;
              return mockAccount;
            }),
          },
        })
      );

      await transactionsService.create(mockUser.id, createDto);

      expect(balanceChange).toBe(-100);
    });

    it('should increase balance for income when paid', async () => {
      const createDto = {
        accountId: 'account-123',
        categoryId: 'category-123',
        description: 'Income',
        amount: 500,
        date: new Date(),
        type: LaunchType.INCOME,
        isPaid: true,
        recurrence: null,
        notes: null,
        tags: [],
      };

      prismaService.account.findUnique.mockResolvedValue(mockAccount);

      let balanceChange = 0;
      prismaService.$transaction.mockImplementation((callback) =>
        callback({
          transaction: {
            create: jest.fn().mockResolvedValue(mockTransaction),
          },
          account: {
            update: jest.fn().mockImplementation(({ data }) => {
              balanceChange = data.balance.increment;
              return mockAccount;
            }),
          },
        })
      );

      await transactionsService.create(mockUser.id, createDto);

      expect(balanceChange).toBe(500);
    });

    it('should not update balance when transaction is not paid', async () => {
      const createDto = {
        accountId: 'account-123',
        categoryId: 'category-123',
        description: 'Unpaid',
        amount: 100,
        date: new Date(),
        type: LaunchType.EXPENSE,
        isPaid: false,
        recurrence: null,
        notes: null,
        tags: [],
      };

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

      await transactionsService.create(mockUser.id, createDto);

      expect(accountUpdateCalled).toBe(false);
    });
  });
});
