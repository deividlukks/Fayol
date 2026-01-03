import { Test, TestingModule } from '@nestjs/testing';
import { AccountsService } from '../../../src/modules/accounts/services/accounts.service';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { CurrencyService } from '../../../src/modules/accounts/services/currency.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { AccountType } from '@fayol/shared-types';
import { mockPrismaFactory, createMockAccount, createMockInvestment } from '../../utils/test-helpers';

describe('AccountsService', () => {
  let service: AccountsService;
  let prisma: ReturnType<typeof mockPrismaFactory>;
  let currencyService: jest.Mocked<CurrencyService>;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
  };

  beforeEach(async () => {
    // Create mocks
    prisma = mockPrismaFactory();
    currencyService = {
      getExchangeRate: jest.fn(),
    } as any;

    // Create testing module
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountsService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
        {
          provide: CurrencyService,
          useValue: currencyService,
        },
      ],
    }).compile();

    service = module.get<AccountsService>(AccountsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ==================== CREATE METHOD ====================

  describe('create', () => {
    const createAccountDto = {
      name: 'My Checking Account',
      type: AccountType.CHECKING as any,
      balance: 1000,
      currency: 'BRL',
      color: '#4CAF50',
      icon: '💰',
    };

    it('should create a checking account successfully', async () => {
      const mockAccount = createMockAccount({
        ...createAccountDto,
        userId: mockUser.id,
      });

      prisma.account.create.mockResolvedValue(mockAccount as any);

      const result = await service.create(mockUser.id, createAccountDto);

      expect(prisma.account.create).toHaveBeenCalledWith({
        data: {
          name: createAccountDto.name,
          type: createAccountDto.type,
          balance: createAccountDto.balance,
          creditLimit: undefined,
          currency: createAccountDto.currency,
          color: createAccountDto.color,
          icon: createAccountDto.icon,
          user: {
            connect: { id: mockUser.id },
          },
        },
      });
      expect(result).toEqual(mockAccount);
    });

    it('should create a savings account', async () => {
      const savingsDto = {
        ...createAccountDto,
        type: AccountType.SAVINGS as any,
        name: 'My Savings',
      };

      const mockAccount = createMockAccount({
        ...savingsDto,
        userId: mockUser.id,
      });

      prisma.account.create.mockResolvedValue(mockAccount as any);

      const result = await service.create(mockUser.id, savingsDto);

      expect(result.type).toBe(AccountType.SAVINGS);
      expect(prisma.account.create).toHaveBeenCalled();
    });

    it('should create an investment account', async () => {
      const investmentDto = {
        ...createAccountDto,
        type: AccountType.INVESTMENT as any,
        name: 'My Investments',
      };

      const mockAccount = createMockAccount({
        ...investmentDto,
        userId: mockUser.id,
      });

      prisma.account.create.mockResolvedValue(mockAccount as any);

      const result = await service.create(mockUser.id, investmentDto);

      expect(result.type).toBe(AccountType.INVESTMENT);
    });

    it('should create a credit card account with credit limit', async () => {
      const creditCardDto = {
        ...createAccountDto,
        type: AccountType.CREDIT_CARD as any,
        name: 'My Credit Card',
        creditLimit: 5000,
      };

      const mockAccount = createMockAccount({
        ...creditCardDto,
        userId: mockUser.id,
      });

      prisma.account.create.mockResolvedValue(mockAccount as any);

      const result = await service.create(mockUser.id, creditCardDto);

      expect(prisma.account.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            creditLimit: 5000,
          }),
        }),
      );
      expect(result.type).toBe(AccountType.CREDIT_CARD);
    });

    it('should create a cash account', async () => {
      const cashDto = {
        ...createAccountDto,
        type: 'CASH' as any,
        name: 'My Cash',
      };

      const mockAccount = createMockAccount({
        ...cashDto,
        userId: mockUser.id,
      });

      prisma.account.create.mockResolvedValue(mockAccount as any);

      const result = await service.create(mockUser.id, cashDto);

      expect(result.type).toBe('CASH');
    });

    it('should create account with zero balance', async () => {
      const zeroBalanceDto = {
        ...createAccountDto,
        balance: 0,
      };

      const mockAccount = createMockAccount({
        ...zeroBalanceDto,
        userId: mockUser.id,
      });

      prisma.account.create.mockResolvedValue(mockAccount as any);

      const result = await service.create(mockUser.id, zeroBalanceDto);

      expect(result.balance).toBe(0);
    });

    it('should create account with negative balance (overdraft)', async () => {
      const negativeBalanceDto = {
        ...createAccountDto,
        balance: -500,
      };

      const mockAccount = createMockAccount({
        ...negativeBalanceDto,
        userId: mockUser.id,
      });

      prisma.account.create.mockResolvedValue(mockAccount as any);

      const result = await service.create(mockUser.id, negativeBalanceDto);

      expect(result.balance).toBe(-500);
    });

    it('should create account with USD currency', async () => {
      const usdDto = {
        ...createAccountDto,
        currency: 'USD',
      };

      const mockAccount = createMockAccount({
        ...usdDto,
        userId: mockUser.id,
      });

      prisma.account.create.mockResolvedValue(mockAccount as any);

      const result = await service.create(mockUser.id, usdDto);

      expect(result.currency).toBe('USD');
    });

    it('should create account with EUR currency', async () => {
      const eurDto = {
        ...createAccountDto,
        currency: 'EUR',
      };

      const mockAccount = createMockAccount({
        ...eurDto,
        userId: mockUser.id,
      });

      prisma.account.create.mockResolvedValue(mockAccount as any);

      const result = await service.create(mockUser.id, eurDto);

      expect(result.currency).toBe('EUR');
    });

    it('should create account without creditLimit for non-credit-card types', async () => {
      const mockAccount = createMockAccount({
        ...createAccountDto,
        userId: mockUser.id,
        creditLimit: undefined,
      });

      prisma.account.create.mockResolvedValue(mockAccount as any);

      await service.create(mockUser.id, createAccountDto);

      expect(prisma.account.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            creditLimit: undefined,
          }),
        }),
      );
    });
  });

  // ==================== FINDALL METHOD ====================

  describe('findAll', () => {
    it('should return all accounts for a user', async () => {
      const mockAccounts = [
        createMockAccount({ id: 'acc-1', name: 'Account 1', userId: mockUser.id, investments: [] }),
        createMockAccount({ id: 'acc-2', name: 'Account 2', userId: mockUser.id, investments: [] }),
      ];

      prisma.account.findMany.mockResolvedValue(mockAccounts as any);
      currencyService.getExchangeRate.mockResolvedValue(5.5);

      const result = await service.findAll(mockUser.id);

      expect(prisma.account.findMany).toHaveBeenCalledWith({
        where: { userId: mockUser.id, isArchived: false },
        include: {
          investments: {
            select: { quantity: true, currentPrice: true, averagePrice: true, type: true },
          },
        },
        orderBy: { name: 'asc' },
      });
      expect(result).toHaveLength(2);
    });

    it('should filter out archived accounts', async () => {
      prisma.account.findMany.mockResolvedValue([]);
      currencyService.getExchangeRate.mockResolvedValue(5.5);

      await service.findAll(mockUser.id);

      expect(prisma.account.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isArchived: false,
          }),
        }),
      );
    });

    it('should return empty array if no accounts exist', async () => {
      prisma.account.findMany.mockResolvedValue([]);
      currencyService.getExchangeRate.mockResolvedValue(5.5);

      const result = await service.findAll(mockUser.id);

      expect(result).toEqual([]);
    });

    it('should order accounts by name ascending', async () => {
      prisma.account.findMany.mockResolvedValue([]);
      currencyService.getExchangeRate.mockResolvedValue(5.5);

      await service.findAll(mockUser.id);

      expect(prisma.account.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { name: 'asc' },
        }),
      );
    });

    it('should fetch exchange rate USD to BRL', async () => {
      prisma.account.findMany.mockResolvedValue([]);
      currencyService.getExchangeRate.mockResolvedValue(5.5);

      await service.findAll(mockUser.id);

      expect(currencyService.getExchangeRate).toHaveBeenCalledWith('USD', 'BRL');
    });

    it('should calculate totalInvested for investment accounts with BR stocks', async () => {
      const mockInvestments = [
        { quantity: 10, currentPrice: 50, averagePrice: 45, type: 'STOCK_BR' },
        { quantity: 20, currentPrice: 30, averagePrice: 28, type: 'STOCK_BR' },
      ];

      const mockAccount = createMockAccount({
        id: 'inv-acc',
        type: AccountType.INVESTMENT,
        balance: 1000,
        investments: mockInvestments,
      });

      prisma.account.findMany.mockResolvedValue([mockAccount] as any);
      currencyService.getExchangeRate.mockResolvedValue(5.5);

      const result = await service.findAll(mockUser.id);

      // totalInvested = (10 * 50) + (20 * 30) = 500 + 600 = 1100
      expect(result[0].totalInvested).toBe(1100);
      expect(result[0].totalConsolidated).toBe(2100); // 1000 + 1100
    });

    it('should calculate totalInvested for investment accounts with US stocks (converted to BRL)', async () => {
      const mockInvestments = [
        { quantity: 10, currentPrice: 100, averagePrice: 95, type: 'STOCK_US' },
      ];

      const mockAccount = createMockAccount({
        id: 'inv-acc',
        type: AccountType.INVESTMENT,
        balance: 5000,
        investments: mockInvestments,
      });

      prisma.account.findMany.mockResolvedValue([mockAccount] as any);
      currencyService.getExchangeRate.mockResolvedValue(5.5);

      const result = await service.findAll(mockUser.id);

      // totalInvested = (10 * 100) * 5.5 = 1000 * 5.5 = 5500
      expect(result[0].totalInvested).toBe(5500);
      expect(result[0].totalConsolidated).toBe(10500); // 5000 + 5500
    });

    it('should calculate totalInvested for investment accounts with crypto (converted to BRL)', async () => {
      const mockInvestments = [
        { quantity: 0.5, currentPrice: 50000, averagePrice: 48000, type: 'CRYPTO' },
      ];

      const mockAccount = createMockAccount({
        id: 'inv-acc',
        type: AccountType.INVESTMENT,
        balance: 0,
        investments: mockInvestments,
      });

      prisma.account.findMany.mockResolvedValue([mockAccount] as any);
      currencyService.getExchangeRate.mockResolvedValue(5.5);

      const result = await service.findAll(mockUser.id);

      // totalInvested = (0.5 * 50000) * 5.5 = 25000 * 5.5 = 137500
      expect(result[0].totalInvested).toBe(137500);
    });

    it('should calculate totalInvested with mixed investment types', async () => {
      const mockInvestments = [
        { quantity: 10, currentPrice: 50, averagePrice: 45, type: 'STOCK_BR' },    // 500 BRL
        { quantity: 5, currentPrice: 100, averagePrice: 95, type: 'STOCK_US' },    // 500 * 5.5 = 2750 BRL
        { quantity: 0.1, currentPrice: 60000, averagePrice: 58000, type: 'CRYPTO' }, // 6000 * 5.5 = 33000 BRL
      ];

      const mockAccount = createMockAccount({
        id: 'inv-acc',
        type: AccountType.INVESTMENT,
        balance: 10000,
        investments: mockInvestments,
      });

      prisma.account.findMany.mockResolvedValue([mockAccount] as any);
      currencyService.getExchangeRate.mockResolvedValue(5.5);

      const result = await service.findAll(mockUser.id);

      // totalInvested = 500 + 2750 + 33000 = 36250
      expect(result[0].totalInvested).toBe(36250);
      expect(result[0].totalConsolidated).toBe(46250); // 10000 + 36250
    });

    it('should use averagePrice if currentPrice is null', async () => {
      const mockInvestments = [
        { quantity: 10, currentPrice: null, averagePrice: 45, type: 'STOCK_BR' },
      ];

      const mockAccount = createMockAccount({
        id: 'inv-acc',
        type: AccountType.INVESTMENT,
        balance: 1000,
        investments: mockInvestments,
      });

      prisma.account.findMany.mockResolvedValue([mockAccount] as any);
      currencyService.getExchangeRate.mockResolvedValue(5.5);

      const result = await service.findAll(mockUser.id);

      // totalInvested = 10 * 45 = 450
      expect(result[0].totalInvested).toBe(450);
    });

    it('should not calculate totalInvested for non-investment accounts', async () => {
      const mockAccount = createMockAccount({
        id: 'checking-acc',
        type: AccountType.CHECKING,
        balance: 1000,
        investments: [],
      });

      prisma.account.findMany.mockResolvedValue([mockAccount] as any);
      currencyService.getExchangeRate.mockResolvedValue(5.5);

      const result = await service.findAll(mockUser.id);

      expect(result[0].totalInvested).toBeUndefined();
      expect(result[0].totalConsolidated).toBeUndefined();
    });

    it('should handle investment account with no investments', async () => {
      const mockAccount = createMockAccount({
        id: 'inv-acc',
        type: AccountType.INVESTMENT,
        balance: 5000,
        investments: [],
      });

      prisma.account.findMany.mockResolvedValue([mockAccount] as any);
      currencyService.getExchangeRate.mockResolvedValue(5.5);

      const result = await service.findAll(mockUser.id);

      expect(result[0].totalInvested).toBe(0);
      expect(result[0].totalConsolidated).toBe(5000); // balance only
    });

    it('should handle multiple accounts with different types', async () => {
      const mockAccounts = [
        createMockAccount({ id: 'checking', type: AccountType.CHECKING, balance: 1000, investments: [] }),
        createMockAccount({
          id: 'investment',
          type: AccountType.INVESTMENT,
          balance: 5000,
          investments: [{ quantity: 10, currentPrice: 50, averagePrice: 45, type: 'STOCK_BR' }],
        }),
        createMockAccount({ id: 'savings', type: AccountType.SAVINGS, balance: 3000, investments: [] }),
      ];

      prisma.account.findMany.mockResolvedValue(mockAccounts as any);
      currencyService.getExchangeRate.mockResolvedValue(5.5);

      const result = await service.findAll(mockUser.id);

      expect(result).toHaveLength(3);
      expect(result[0].totalInvested).toBeUndefined();
      expect(result[1].totalInvested).toBe(500);
      expect(result[2].totalInvested).toBeUndefined();
    });
  });

  // ==================== FINDONE METHOD ====================

  describe('findOne', () => {
    it('should return an account by id', async () => {
      const mockAccount = createMockAccount({
        id: 'acc-123',
        userId: mockUser.id,
      });

      prisma.account.findUnique.mockResolvedValue(mockAccount as any);

      const result = await service.findOne('acc-123', mockUser.id);

      expect(prisma.account.findUnique).toHaveBeenCalledWith({
        where: { id: 'acc-123' },
      });
      expect(result).toEqual(mockAccount);
    });

    it('should throw NotFoundException if account does not exist', async () => {
      prisma.account.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent', mockUser.id)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('non-existent', mockUser.id)).rejects.toThrow(
        'Conta não encontrada.',
      );
    });

    it('should throw ForbiddenException if account belongs to another user', async () => {
      const mockAccount = createMockAccount({
        id: 'acc-123',
        userId: 'other-user-id',
      });

      prisma.account.findUnique.mockResolvedValue(mockAccount as any);

      await expect(service.findOne('acc-123', mockUser.id)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.findOne('acc-123', mockUser.id)).rejects.toThrow(
        'Acesso negado a esta conta.',
      );
    });

    it('should allow access if userId matches', async () => {
      const mockAccount = createMockAccount({
        id: 'acc-123',
        userId: mockUser.id,
      });

      prisma.account.findUnique.mockResolvedValue(mockAccount as any);

      const result = await service.findOne('acc-123', mockUser.id);

      expect(result.userId).toBe(mockUser.id);
    });
  });

  // ==================== UPDATE METHOD ====================

  describe('update', () => {
    const updateDto = {
      name: 'Updated Account Name',
      balance: 2000,
      color: '#FF5722',
    };

    it('should update account successfully', async () => {
      const existingAccount = createMockAccount({
        id: 'acc-123',
        userId: mockUser.id,
      });

      const updatedAccount = {
        ...existingAccount,
        ...updateDto,
      };

      prisma.account.findUnique.mockResolvedValue(existingAccount as any);
      prisma.account.update.mockResolvedValue(updatedAccount as any);

      const result = await service.update('acc-123', mockUser.id, updateDto);

      expect(prisma.account.update).toHaveBeenCalledWith({
        where: { id: 'acc-123' },
        data: {
          ...updateDto,
          creditLimit: undefined,
        },
      });
      expect(result.name).toBe(updateDto.name);
    });

    it('should update account with credit limit', async () => {
      const existingAccount = createMockAccount({
        id: 'acc-123',
        userId: mockUser.id,
        type: AccountType.CREDIT_CARD,
      });

      const updateWithLimit = {
        ...updateDto,
        creditLimit: 10000,
      };

      prisma.account.findUnique.mockResolvedValue(existingAccount as any);
      prisma.account.update.mockResolvedValue({ ...existingAccount, ...updateWithLimit } as any);

      await service.update('acc-123', mockUser.id, updateWithLimit);

      expect(prisma.account.update).toHaveBeenCalledWith({
        where: { id: 'acc-123' },
        data: expect.objectContaining({
          creditLimit: 10000,
        }),
      });
    });

    it('should check authorization before updating', async () => {
      const existingAccount = createMockAccount({
        id: 'acc-123',
        userId: mockUser.id,
      });

      prisma.account.findUnique.mockResolvedValue(existingAccount as any);
      prisma.account.update.mockResolvedValue(existingAccount as any);

      await service.update('acc-123', mockUser.id, updateDto);

      expect(prisma.account.findUnique).toHaveBeenCalledWith({
        where: { id: 'acc-123' },
      });
    });

    it('should throw error if account does not exist during update', async () => {
      prisma.account.findUnique.mockResolvedValue(null);

      await expect(service.update('non-existent', mockUser.id, updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw error if user is not authorized to update', async () => {
      const existingAccount = createMockAccount({
        id: 'acc-123',
        userId: 'other-user-id',
      });

      prisma.account.findUnique.mockResolvedValue(existingAccount as any);

      await expect(service.update('acc-123', mockUser.id, updateDto)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should allow partial updates', async () => {
      const existingAccount = createMockAccount({
        id: 'acc-123',
        userId: mockUser.id,
      });

      const partialUpdate = {
        name: 'New Name Only',
      };

      prisma.account.findUnique.mockResolvedValue(existingAccount as any);
      prisma.account.update.mockResolvedValue({ ...existingAccount, ...partialUpdate } as any);

      await service.update('acc-123', mockUser.id, partialUpdate);

      expect(prisma.account.update).toHaveBeenCalledWith({
        where: { id: 'acc-123' },
        data: expect.objectContaining({
          name: 'New Name Only',
        }),
      });
    });
  });

  // ==================== REMOVE METHOD ====================

  describe('remove', () => {
    it('should soft delete account (archive)', async () => {
      const existingAccount = createMockAccount({
        id: 'acc-123',
        userId: mockUser.id,
        isArchived: false,
      });

      const archivedAccount = {
        ...existingAccount,
        isArchived: true,
      };

      prisma.account.findUnique.mockResolvedValue(existingAccount as any);
      prisma.account.update.mockResolvedValue(archivedAccount as any);

      const result = await service.remove('acc-123', mockUser.id);

      expect(prisma.account.update).toHaveBeenCalledWith({
        where: { id: 'acc-123' },
        data: { isArchived: true },
      });
      expect(result.isArchived).toBe(true);
    });

    it('should check authorization before deleting', async () => {
      const existingAccount = createMockAccount({
        id: 'acc-123',
        userId: mockUser.id,
      });

      prisma.account.findUnique.mockResolvedValue(existingAccount as any);
      prisma.account.update.mockResolvedValue({ ...existingAccount, isArchived: true } as any);

      await service.remove('acc-123', mockUser.id);

      expect(prisma.account.findUnique).toHaveBeenCalledWith({
        where: { id: 'acc-123' },
      });
    });

    it('should throw error if account does not exist during deletion', async () => {
      prisma.account.findUnique.mockResolvedValue(null);

      await expect(service.remove('non-existent', mockUser.id)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw error if user is not authorized to delete', async () => {
      const existingAccount = createMockAccount({
        id: 'acc-123',
        userId: 'other-user-id',
      });

      prisma.account.findUnique.mockResolvedValue(existingAccount as any);

      await expect(service.remove('acc-123', mockUser.id)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should not permanently delete the account', async () => {
      const existingAccount = createMockAccount({
        id: 'acc-123',
        userId: mockUser.id,
      });

      prisma.account.findUnique.mockResolvedValue(existingAccount as any);
      prisma.account.update.mockResolvedValue({ ...existingAccount, isArchived: true } as any);

      await service.remove('acc-123', mockUser.id);

      expect(prisma.account.delete).not.toHaveBeenCalled();
      expect(prisma.account.update).toHaveBeenCalled();
    });
  });
});
