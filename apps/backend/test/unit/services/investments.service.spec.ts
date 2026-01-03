import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { InvestmentsService } from '../../../src/modules/investments/services/investments.service';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { LaunchType } from '@fayol/shared-types';

describe('InvestmentsService', () => {
  let service: InvestmentsService;
  let prismaService: jest.Mocked<any>;

  const mockUser = { id: 'user-123' };
  const mockAccount = {
    id: 'account-123',
    userId: 'user-123',
    name: 'Investment Account',
    balance: 10000,
  };
  const mockCategory = {
    id: 'category-123',
    name: 'Investimentos',
    type: LaunchType.EXPENSE,
    icon: '📈',
    color: '#6A4C93',
  };
  const mockInvestment = {
    id: 'investment-123',
    userId: 'user-123',
    accountId: 'account-123',
    name: 'PETR4',
    ticker: 'PETR4',
    quantity: 100,
    averagePrice: 30.5,
    currentPrice: 32.0,
    type: 'STOCK',
    purchaseDate: new Date('2025-01-01'),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvestmentsService,
        {
          provide: PrismaService,
          useValue: {
            account: {
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            category: {
              findFirst: jest.fn(),
              create: jest.fn(),
            },
            investment: {
              create: jest.fn(),
              findUnique: jest.fn(),
              findMany: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            transaction: {
              create: jest.fn(),
            },
            $transaction: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<InvestmentsService>(InvestmentsService);
    prismaService = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto = {
      accountId: 'account-123',
      name: 'PETR4',
      ticker: 'petr4',
      quantity: 100,
      averagePrice: 30.5,
      currentPrice: 32.0,
      type: 'STOCK' as any,
      purchaseDate: new Date('2025-01-01'),
    };

    it('should create an investment successfully', async () => {
      prismaService.account.findUnique.mockResolvedValue(mockAccount);
      prismaService.category.findFirst.mockResolvedValue(mockCategory);

      prismaService.$transaction.mockImplementation((callback) =>
        callback({
          investment: {
            create: jest.fn().mockResolvedValue(mockInvestment),
          },
          account: {
            update: jest.fn().mockResolvedValue({ ...mockAccount, balance: 6950 }),
          },
          transaction: {
            create: jest.fn().mockResolvedValue({}),
          },
        })
      );

      const result = await service.create(mockUser.id, createDto);

      expect(result).toEqual(mockInvestment);
    });

    it('should throw NotFoundException when account not found', async () => {
      prismaService.account.findUnique.mockResolvedValue(null);

      await expect(service.create(mockUser.id, createDto)).rejects.toThrow(NotFoundException);
      await expect(service.create(mockUser.id, createDto)).rejects.toThrow(
        'Conta de custódia não encontrada.'
      );
    });

    it('should throw NotFoundException when account belongs to different user', async () => {
      prismaService.account.findUnique.mockResolvedValue({
        ...mockAccount,
        userId: 'different-user-id',
      });

      await expect(service.create(mockUser.id, createDto)).rejects.toThrow(NotFoundException);
    });

    it('should create investment category if not exists', async () => {
      prismaService.account.findUnique.mockResolvedValue(mockAccount);
      prismaService.category.findFirst.mockResolvedValue(null);
      prismaService.category.create.mockResolvedValue(mockCategory);

      prismaService.$transaction.mockImplementation((callback) =>
        callback({
          investment: {
            create: jest.fn().mockResolvedValue(mockInvestment),
          },
          account: {
            update: jest.fn().mockResolvedValue(mockAccount),
          },
          transaction: {
            create: jest.fn().mockResolvedValue({}),
          },
        })
      );

      await service.create(mockUser.id, createDto);

      expect(prismaService.category.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'Investimentos',
          type: LaunchType.EXPENSE,
        }),
      });
    });

    it('should convert ticker to uppercase', async () => {
      prismaService.account.findUnique.mockResolvedValue(mockAccount);
      prismaService.category.findFirst.mockResolvedValue(mockCategory);

      let createdInvestment: any;
      prismaService.$transaction.mockImplementation((callback) =>
        callback({
          investment: {
            create: jest.fn().mockImplementation((data) => {
              createdInvestment = data;
              return mockInvestment;
            }),
          },
          account: {
            update: jest.fn().mockResolvedValue(mockAccount),
          },
          transaction: {
            create: jest.fn().mockResolvedValue({}),
          },
        })
      );

      await service.create(mockUser.id, createDto);

      expect(createdInvestment.data.ticker).toBe('PETR4');
    });

    it('should calculate total cost correctly and debit account', async () => {
      prismaService.account.findUnique.mockResolvedValue(mockAccount);
      prismaService.category.findFirst.mockResolvedValue(mockCategory);

      let accountUpdateData: any;
      prismaService.$transaction.mockImplementation((callback) =>
        callback({
          investment: {
            create: jest.fn().mockResolvedValue(mockInvestment),
          },
          account: {
            update: jest.fn().mockImplementation((data) => {
              accountUpdateData = data;
              return mockAccount;
            }),
          },
          transaction: {
            create: jest.fn().mockResolvedValue({}),
          },
        })
      );

      await service.create(mockUser.id, createDto);

      const expectedCost = 100 * 30.5; // 3050
      expect(accountUpdateData.data.balance.decrement).toBe(expectedCost);
    });

    it('should create financial transaction for investment', async () => {
      prismaService.account.findUnique.mockResolvedValue(mockAccount);
      prismaService.category.findFirst.mockResolvedValue(mockCategory);

      let transactionData: any;
      prismaService.$transaction.mockImplementation((callback) =>
        callback({
          investment: {
            create: jest.fn().mockResolvedValue(mockInvestment),
          },
          account: {
            update: jest.fn().mockResolvedValue(mockAccount),
          },
          transaction: {
            create: jest.fn().mockImplementation((data) => {
              transactionData = data;
              return {};
            }),
          },
        })
      );

      await service.create(mockUser.id, createDto);

      expect(transactionData.data).toMatchObject({
        userId: mockUser.id,
        accountId: createDto.accountId,
        categoryId: mockCategory.id,
        type: LaunchType.EXPENSE,
        isPaid: true,
      });
    });
  });

  describe('findAll', () => {
    it('should return all investments with calculated values', async () => {
      const investments = [mockInvestment];
      prismaService.investment.findMany.mockResolvedValue(investments);

      const result = await service.findAll(mockUser.id);

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('totalValue');
      expect(result[0]).toHaveProperty('yield');
      expect(result[0].totalValue).toBe(3200); // 100 * 32.00
      expect(prismaService.investment.findMany).toHaveBeenCalledWith({
        where: { userId: mockUser.id },
        include: { account: { select: { name: true } } },
        orderBy: { name: 'asc' },
      });
    });

    it('should calculate yield correctly', async () => {
      prismaService.investment.findMany.mockResolvedValue([mockInvestment]);

      const result = await service.findAll(mockUser.id);

      // Yield = ((32 - 30.50) / 30.50) * 100 = 4.92%
      expect(result[0].yield).toBeCloseTo(4.92, 1);
    });

    it('should return 0 yield when currentPrice is not set', async () => {
      const investmentWithoutCurrentPrice = { ...mockInvestment, currentPrice: null };
      prismaService.investment.findMany.mockResolvedValue([investmentWithoutCurrentPrice]);

      const result = await service.findAll(mockUser.id);

      expect(result[0].yield).toBe(0);
    });

    it('should return empty array when no investments exist', async () => {
      prismaService.investment.findMany.mockResolvedValue([]);

      const result = await service.findAll(mockUser.id);

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return an investment with total value', async () => {
      prismaService.investment.findUnique.mockResolvedValue(mockInvestment);

      const result = await service.findOne('investment-123', mockUser.id);

      expect(result).toHaveProperty('totalValue', 3200);
      expect(result.id).toBe(mockInvestment.id);
    });

    it('should throw NotFoundException when investment not found', async () => {
      prismaService.investment.findUnique.mockResolvedValue(null);

      await expect(service.findOne('nonexistent-id', mockUser.id)).rejects.toThrow(
        NotFoundException
      );
      await expect(service.findOne('nonexistent-id', mockUser.id)).rejects.toThrow(
        'Investimento não encontrado.'
      );
    });

    it('should throw ForbiddenException when investment belongs to different user', async () => {
      prismaService.investment.findUnique.mockResolvedValue({
        ...mockInvestment,
        userId: 'different-user-id',
      });

      await expect(service.findOne('investment-123', mockUser.id)).rejects.toThrow(
        ForbiddenException
      );
      await expect(service.findOne('investment-123', mockUser.id)).rejects.toThrow(
        'Acesso negado.'
      );
    });
  });

  describe('update', () => {
    const updateDto = {
      name: 'Updated Investment',
      currentPrice: 35.0,
      quantity: 150,
    };

    it('should update an investment successfully', async () => {
      prismaService.investment.findUnique.mockResolvedValue(mockInvestment);
      prismaService.investment.update.mockResolvedValue({
        ...mockInvestment,
        ...updateDto,
      });

      const result = await service.update('investment-123', mockUser.id, updateDto);

      expect(result.name).toBe(updateDto.name);
      expect(result.currentPrice).toBe(updateDto.currentPrice);
      expect(prismaService.investment.update).toHaveBeenCalledWith({
        where: { id: 'investment-123' },
        data: expect.objectContaining(updateDto),
      });
    });

    it('should throw NotFoundException when investment not found', async () => {
      prismaService.investment.findUnique.mockResolvedValue(null);

      await expect(service.update('nonexistent-id', mockUser.id, updateDto)).rejects.toThrow(
        NotFoundException
      );
      expect(prismaService.investment.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should delete an investment successfully', async () => {
      prismaService.investment.findUnique.mockResolvedValue(mockInvestment);
      prismaService.investment.delete.mockResolvedValue(mockInvestment);

      const result = await service.remove('investment-123', mockUser.id);

      expect(result).toEqual(mockInvestment);
      expect(prismaService.investment.delete).toHaveBeenCalledWith({
        where: { id: 'investment-123' },
      });
    });

    it('should throw NotFoundException when trying to delete non-existent investment', async () => {
      prismaService.investment.findUnique.mockResolvedValue(null);

      await expect(service.remove('nonexistent-id', mockUser.id)).rejects.toThrow(
        NotFoundException
      );
      expect(prismaService.investment.delete).not.toHaveBeenCalled();
    });
  });

  describe('lookupTicker', () => {
    it('should return mock data for stock ticker', async () => {
      const result = await service.lookupTicker('PETR4');

      expect(result).toMatchObject({
        ticker: 'PETR4',
        type: 'STOCK',
        price: expect.any(Number),
      });
    });

    it('should identify FII by ticker ending in 11', async () => {
      const result = await service.lookupTicker('HGLG11');

      expect(result.type).toBe('FII');
      expect(result.ticker).toBe('HGLG11');
    });

    it('should identify cryptocurrency', async () => {
      const btcResult = await service.lookupTicker('BTC');
      const ethResult = await service.lookupTicker('ETH');

      expect(btcResult.type).toBe('CRYPTO');
      expect(btcResult.name).toBe('Bitcoin');
      expect(ethResult.type).toBe('CRYPTO');
      expect(ethResult.name).toBe('Ethereum');
    });

    it('should normalize ticker to uppercase', async () => {
      const result = await service.lookupTicker('petr4');

      expect(result.ticker).toBe('PETR4');
    });
  });
});
