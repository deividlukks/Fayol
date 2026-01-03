import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsController } from '../../../src/modules/transactions/controllers/transactions.controller';
import { TransactionsService } from '../../../src/modules/transactions/services/transactions.service';
import { ImportExportService } from '../../../src/modules/transactions/services/import-export.service';
import { RecurrenceService } from '../../../src/modules/transactions/services/recurrence.service';
import { LaunchType } from '@fayol/shared-types';

describe('TransactionsController', () => {
  let controller: TransactionsController;
  let transactionsService: jest.Mocked<TransactionsService>;
  let importExportService: jest.Mocked<ImportExportService>;
  let recurrenceService: jest.Mocked<RecurrenceService>;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    passwordHash: 'hash',
    phoneNumber: '11999999999',
    roles: ['USER'],
    createdAt: new Date(),
    updatedAt: new Date(),
    investorProfile: null,
    resetPasswordToken: null,
    resetPasswordExpires: null,
  };

  const mockTransaction = {
    id: 'transaction-123',
    userId: 'user-123',
    accountId: 'account-123',
    categoryId: 'category-123',
    description: 'Test transaction',
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
      controllers: [TransactionsController],
      providers: [
        {
          provide: TransactionsService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: ImportExportService,
          useValue: {
            exportToCsv: jest.fn(),
            importFromCsv: jest.fn(),
            generateTemplate: jest.fn(),
          },
        },
        {
          provide: RecurrenceService,
          useValue: {
            getUpcomingRecurrences: jest.fn(),
            manualProcess: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<TransactionsController>(TransactionsController);
    transactionsService = module.get(TransactionsService) as jest.Mocked<TransactionsService>;
    importExportService = module.get(ImportExportService) as jest.Mocked<ImportExportService>;
    recurrenceService = module.get(RecurrenceService) as jest.Mocked<RecurrenceService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto = {
      accountId: 'account-123',
      categoryId: 'category-123',
      description: 'New expense',
      amount: 100,
      date: new Date(),
      type: LaunchType.EXPENSE,
      isPaid: true,
      recurrence: null,
      notes: null,
      tags: [],
    };

    it('should create a transaction', async () => {
      transactionsService.create.mockResolvedValue(mockTransaction);

      const result = await controller.create(mockUser, createDto);

      expect(result).toEqual(mockTransaction);
      expect(transactionsService.create).toHaveBeenCalledWith(mockUser.id, createDto);
    });
  });

  describe('findAll', () => {
    it('should return all transactions for a user', async () => {
      const transactions = [mockTransaction];
      transactionsService.findAll.mockResolvedValue(transactions);

      const result = await controller.findAll(mockUser);

      expect(result).toEqual(transactions);
      expect(transactionsService.findAll).toHaveBeenCalledWith(mockUser.id);
    });

    it('should return empty array when no transactions exist', async () => {
      transactionsService.findAll.mockResolvedValue([]);

      const result = await controller.findAll(mockUser);

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a single transaction', async () => {
      transactionsService.findOne.mockResolvedValue(mockTransaction);

      const result = await controller.findOne(mockUser, 'transaction-123');

      expect(result).toEqual(mockTransaction);
      expect(transactionsService.findOne).toHaveBeenCalledWith('transaction-123', mockUser.id);
    });
  });

  describe('update', () => {
    const updateDto = {
      description: 'Updated description',
      amount: 150,
    };

    it('should update a transaction', async () => {
      const updatedTransaction = { ...mockTransaction, ...updateDto };
      transactionsService.update.mockResolvedValue(updatedTransaction);

      const result = await controller.update(mockUser, 'transaction-123', updateDto);

      expect(result).toEqual(updatedTransaction);
      expect(transactionsService.update).toHaveBeenCalledWith(
        'transaction-123',
        mockUser.id,
        updateDto
      );
    });
  });

  describe('remove', () => {
    it('should delete a transaction', async () => {
      transactionsService.remove.mockResolvedValue(mockTransaction);

      const result = await controller.remove(mockUser, 'transaction-123');

      expect(result).toEqual(mockTransaction);
      expect(transactionsService.remove).toHaveBeenCalledWith('transaction-123', mockUser.id);
    });
  });

  describe('exportCsv', () => {
    it('should export transactions to CSV', async () => {
      const csvContent = 'date,description,amount\n2025-01-01,Test,100';
      importExportService.exportToCsv.mockResolvedValue(csvContent);

      const result = await controller.exportCsv(mockUser);

      expect(result).toBe(csvContent);
      expect(importExportService.exportToCsv).toHaveBeenCalledWith(mockUser.id, {});
    });

    it('should export with date range filters', async () => {
      const csvContent = 'date,description,amount\n2025-01-01,Test,100';
      importExportService.exportToCsv.mockResolvedValue(csvContent);

      const result = await controller.exportCsv(mockUser, '2025-01-01', '2025-01-31');

      expect(result).toBe(csvContent);
      expect(importExportService.exportToCsv).toHaveBeenCalledWith(mockUser.id, {
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-31'),
      });
    });
  });

  describe('importCsv', () => {
    it('should import transactions from CSV', async () => {
      const csvContent = 'date,description,amount\n2025-01-01,Test,100';
      const importResult = {
        success: 1,
        failed: 0,
        errors: [],
      };

      importExportService.importFromCsv.mockResolvedValue(importResult);

      const result = await controller.importCsv(mockUser, csvContent);

      expect(result).toEqual(importResult);
      expect(importExportService.importFromCsv).toHaveBeenCalledWith(mockUser.id, csvContent);
    });

    it('should handle import errors', async () => {
      const csvContent = 'invalid,csv,content';
      const importResult = {
        success: 0,
        failed: 1,
        errors: [{ row: 1, error: 'Invalid format' }],
      };

      importExportService.importFromCsv.mockResolvedValue(importResult);

      const result = await controller.importCsv(mockUser, csvContent);

      expect(result.failed).toBe(1);
      expect(result.errors).toHaveLength(1);
    });
  });

  describe('getTemplate', () => {
    it('should return CSV template', () => {
      const template = 'date,description,amount,type,category,account,isPaid';
      importExportService.generateTemplate.mockReturnValue(template);

      const result = controller.getTemplate();

      expect(result).toBe(template);
      expect(importExportService.generateTemplate).toHaveBeenCalled();
    });
  });

  describe('getUpcomingRecurrences', () => {
    it('should return upcoming recurrent transactions', async () => {
      const upcomingRecurrences = [
        {
          id: 'recurrence-1',
          description: 'Monthly rent',
          nextOccurrence: new Date('2025-02-01'),
        },
      ];

      recurrenceService.getUpcomingRecurrences.mockResolvedValue(upcomingRecurrences);

      const result = await controller.getUpcomingRecurrences(mockUser);

      expect(result).toEqual(upcomingRecurrences);
      expect(recurrenceService.getUpcomingRecurrences).toHaveBeenCalledWith(mockUser.id, 30);
    });

    it('should accept custom days parameter', async () => {
      recurrenceService.getUpcomingRecurrences.mockResolvedValue([]);

      await controller.getUpcomingRecurrences(mockUser, '60');

      expect(recurrenceService.getUpcomingRecurrences).toHaveBeenCalledWith(mockUser.id, 60);
    });
  });

  describe('processRecurrences', () => {
    it('should manually process recurrent transactions', async () => {
      const processResult = {
        created: 5,
        skipped: 2,
        errors: 0,
      };

      recurrenceService.manualProcess.mockResolvedValue(processResult);

      const result = await controller.processRecurrences();

      expect(result).toEqual(processResult);
      expect(recurrenceService.manualProcess).toHaveBeenCalled();
    });

    it('should handle processing errors', async () => {
      const processResult = {
        created: 3,
        skipped: 1,
        errors: 2,
      };

      recurrenceService.manualProcess.mockResolvedValue(processResult);

      const result = await controller.processRecurrences();

      expect(result.errors).toBe(2);
    });
  });
});
