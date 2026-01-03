import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { UserDeletionService } from './user-deletion.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConsentService } from '../../../consent/consent.service';
import { ComplianceNotificationsService } from '../../../common/services/compliance-notifications.service';
import { ConsentType } from '@fayol/shared-types';

describe('UserDeletionService', () => {
  let service: UserDeletionService;
  let prismaService: PrismaService;
  let consentService: ConsentService;
  let notificationsService: ComplianceNotificationsService;

  const mockUserId = 'user-123';
  const mockEmail = 'test@example.com';

  const mockUser = {
    id: mockUserId,
    email: mockEmail,
    name: 'Test User',
    passwordHash: 'hashed-password',
    isActive: true,
    deletedAt: null,
    transactions: [],
  };

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
    },
    trade: {
      deleteMany: jest.fn(),
    },
    transaction: {
      deleteMany: jest.fn(),
    },
    investment: {
      deleteMany: jest.fn(),
    },
    budget: {
      deleteMany: jest.fn(),
    },
    goal: {
      deleteMany: jest.fn(),
    },
    notification: {
      deleteMany: jest.fn(),
    },
    account: {
      deleteMany: jest.fn(),
    },
    category: {
      deleteMany: jest.fn(),
    },
    userConsent: {
      deleteMany: jest.fn(),
    },
    dataExportRequest: {
      deleteMany: jest.fn(),
    },
    auditLog: {
      updateMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockConsentService = {
    withdrawConsent: jest.fn(),
  };

  const mockNotificationsService = {
    notifyAccountDeleted: jest.fn(),
    notifyAccountDeletionScheduled: jest.fn(),
    notifyAccountDeletionImminent: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserDeletionService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: ConsentService,
          useValue: mockConsentService,
        },
        {
          provide: ComplianceNotificationsService,
          useValue: mockNotificationsService,
        },
      ],
    }).compile();

    service = module.get<UserDeletionService>(UserDeletionService);
    prismaService = module.get<PrismaService>(PrismaService);
    consentService = module.get<ConsentService>(ConsentService);
    notificationsService = module.get<ComplianceNotificationsService>(
      ComplianceNotificationsService
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('deleteUserData', () => {
    it('deve deletar todos os dados do usuário com email confirmado', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockConsentService.withdrawConsent.mockResolvedValue(true);

      // Mock da transação
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        const txMock = {
          trade: { deleteMany: jest.fn().mockResolvedValue({ count: 1 }) },
          transaction: { deleteMany: jest.fn().mockResolvedValue({ count: 5 }) },
          investment: { deleteMany: jest.fn().mockResolvedValue({ count: 2 }) },
          budget: { deleteMany: jest.fn().mockResolvedValue({ count: 3 }) },
          goal: { deleteMany: jest.fn().mockResolvedValue({ count: 1 }) },
          notification: { deleteMany: jest.fn().mockResolvedValue({ count: 10 }) },
          account: { deleteMany: jest.fn().mockResolvedValue({ count: 4 }) },
          category: { deleteMany: jest.fn().mockResolvedValue({ count: 2 }) },
          userConsent: { deleteMany: jest.fn().mockResolvedValue({ count: 5 }) },
          dataExportRequest: { deleteMany: jest.fn().mockResolvedValue({ count: 1 }) },
          auditLog: { updateMany: jest.fn().mockResolvedValue({ count: 15 }) },
          user: { delete: jest.fn().mockResolvedValue(mockUser) },
        };
        return callback(txMock);
      });

      const result = await service.deleteUserData(mockUserId, mockEmail);

      expect(result.userId).toBe(mockUserId);
      expect(result.itemsDeleted).toBeDefined();
      expect(result.itemsDeleted.trades).toBe(1);
      expect(result.itemsDeleted.transactions).toBe(5);
      expect(mockNotificationsService.notifyAccountDeleted).toHaveBeenCalledWith(mockEmail);
    });

    it('deve lançar BadRequestException se usuário não existe', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.deleteUserData(mockUserId, mockEmail)).rejects.toThrow(
        BadRequestException
      );
    });

    it('deve lançar BadRequestException se email não confere', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(service.deleteUserData(mockUserId, 'wrong@example.com')).rejects.toThrow(
        BadRequestException
      );
    });

    it('deve retirar todos os tipos de consentimento antes da deletion', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockConsentService.withdrawConsent.mockResolvedValue(true);

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        const txMock = {
          trade: { deleteMany: jest.fn().mockResolvedValue({ count: 0 }) },
          transaction: { deleteMany: jest.fn().mockResolvedValue({ count: 0 }) },
          investment: { deleteMany: jest.fn().mockResolvedValue({ count: 0 }) },
          budget: { deleteMany: jest.fn().mockResolvedValue({ count: 0 }) },
          goal: { deleteMany: jest.fn().mockResolvedValue({ count: 0 }) },
          notification: { deleteMany: jest.fn().mockResolvedValue({ count: 0 }) },
          account: { deleteMany: jest.fn().mockResolvedValue({ count: 0 }) },
          category: { deleteMany: jest.fn().mockResolvedValue({ count: 0 }) },
          userConsent: { deleteMany: jest.fn().mockResolvedValue({ count: 0 }) },
          dataExportRequest: { deleteMany: jest.fn().mockResolvedValue({ count: 0 }) },
          auditLog: { updateMany: jest.fn().mockResolvedValue({ count: 0 }) },
          user: { delete: jest.fn().mockResolvedValue(mockUser) },
        };
        return callback(txMock);
      });

      await service.deleteUserData(mockUserId, mockEmail);

      // Verifica se tentou retirar todos os tipos de consentimento
      expect(mockConsentService.withdrawConsent).toHaveBeenCalledTimes(7);
    });
  });

  describe('softDeleteUser', () => {
    it('deve desativar e anonimizar usuário sem deletar dados', async () => {
      mockPrismaService.user.update.mockResolvedValue({
        ...mockUser,
        isActive: false,
        deletedAt: new Date(),
        email: `deleted_${mockUserId}@deleted.com`,
      });

      await service.softDeleteUser(mockUserId);

      expect(mockPrismaService.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockUserId },
          data: expect.objectContaining({
            isActive: false,
            deletedAt: expect.any(Date),
            email: `deleted_${mockUserId}@deleted.com`,
            name: 'Deleted User',
          }),
        })
      );
    });
  });

  describe('canDeleteUser', () => {
    it('deve retornar true se pode deletar (sem transações pendentes)', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.canDeleteUser(mockUserId);

      expect(result.canDelete).toBe(true);
      expect(result.reasons).toHaveLength(0);
    });

    it('deve retornar false se há transações pendentes', async () => {
      const userWithPendingTransactions = {
        ...mockUser,
        transactions: [
          { id: 'tx-1', isPaid: false },
          { id: 'tx-2', isPaid: false },
        ],
      };

      mockPrismaService.user.findUnique.mockResolvedValue(userWithPendingTransactions);

      const result = await service.canDeleteUser(mockUserId);

      expect(result.canDelete).toBe(false);
      expect(result.reasons).toHaveLength(1);
      expect(result.reasons[0]).toContain('pending transactions');
    });

    it('deve retornar false se usuário não existe', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.canDeleteUser(mockUserId);

      expect(result.canDelete).toBe(false);
      expect(result.reasons).toContain('User not found');
    });
  });

  describe('scheduleDeletion', () => {
    it('deve agendar deletion para 30 dias no futuro por padrão', async () => {
      mockPrismaService.user.update.mockResolvedValue({
        ...mockUser,
        deletedAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        isActive: false,
      });

      const deletionDate = await service.scheduleDeletion(mockUserId);

      expect(deletionDate).toBeInstanceOf(Date);
      expect(mockPrismaService.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockUserId },
          data: expect.objectContaining({
            deletedAt: expect.any(Date),
            isActive: false,
          }),
        })
      );
      expect(mockNotificationsService.notifyAccountDeletionScheduled).toHaveBeenCalled();
    });

    it('deve permitir customizar dias de espera', async () => {
      const customDays = 15;
      mockPrismaService.user.update.mockResolvedValue({
        ...mockUser,
        deletedAt: new Date(Date.now() + customDays * 24 * 60 * 60 * 1000),
        isActive: false,
      });

      await service.scheduleDeletion(mockUserId, customDays);

      expect(mockPrismaService.user.update).toHaveBeenCalled();
    });
  });

  describe('cancelScheduledDeletion', () => {
    it('deve cancelar deletion agendada', async () => {
      mockPrismaService.user.update.mockResolvedValue({
        ...mockUser,
        deletedAt: null,
        isActive: true,
      });

      await service.cancelScheduledDeletion(mockUserId);

      expect(mockPrismaService.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockUserId },
          data: {
            deletedAt: null,
            isActive: true,
          },
        })
      );
    });
  });

  describe('processScheduledDeletions', () => {
    it('deve processar deletions cuja data já passou', async () => {
      const usersToDelete = [
        { id: 'user-1', email: 'user1@example.com' },
        { id: 'user-2', email: 'user2@example.com' },
      ];

      mockPrismaService.user.findMany.mockResolvedValue(usersToDelete);
      mockPrismaService.user.findUnique.mockImplementation((args) => {
        const user = usersToDelete.find((u) => u.id === args.where.id);
        return Promise.resolve(user ? { ...mockUser, ...user } : null);
      });

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        const txMock = {
          trade: { deleteMany: jest.fn().mockResolvedValue({ count: 0 }) },
          transaction: { deleteMany: jest.fn().mockResolvedValue({ count: 0 }) },
          investment: { deleteMany: jest.fn().mockResolvedValue({ count: 0 }) },
          budget: { deleteMany: jest.fn().mockResolvedValue({ count: 0 }) },
          goal: { deleteMany: jest.fn().mockResolvedValue({ count: 0 }) },
          notification: { deleteMany: jest.fn().mockResolvedValue({ count: 0 }) },
          account: { deleteMany: jest.fn().mockResolvedValue({ count: 0 }) },
          category: { deleteMany: jest.fn().mockResolvedValue({ count: 0 }) },
          userConsent: { deleteMany: jest.fn().mockResolvedValue({ count: 0 }) },
          dataExportRequest: { deleteMany: jest.fn().mockResolvedValue({ count: 0 }) },
          auditLog: { updateMany: jest.fn().mockResolvedValue({ count: 0 }) },
          user: { delete: jest.fn().mockResolvedValue(mockUser) },
        };
        return callback(txMock);
      });

      const count = await service.processScheduledDeletions();

      expect(count).toBe(2);
      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            deletedAt: { lte: expect.any(Date) },
            isActive: false,
          }),
        })
      );
    });

    it('deve continuar processando mesmo se uma deletion falhar', async () => {
      const usersToDelete = [
        { id: 'user-1', email: 'user1@example.com' },
        { id: 'user-2', email: 'user2@example.com' },
      ];

      mockPrismaService.user.findMany.mockResolvedValue(usersToDelete);
      mockPrismaService.user.findUnique
        .mockResolvedValueOnce({ ...mockUser, ...usersToDelete[0] })
        .mockResolvedValueOnce(null);

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        const txMock = {
          trade: { deleteMany: jest.fn().mockResolvedValue({ count: 0 }) },
          transaction: { deleteMany: jest.fn().mockResolvedValue({ count: 0 }) },
          investment: { deleteMany: jest.fn().mockResolvedValue({ count: 0 }) },
          budget: { deleteMany: jest.fn().mockResolvedValue({ count: 0 }) },
          goal: { deleteMany: jest.fn().mockResolvedValue({ count: 0 }) },
          notification: { deleteMany: jest.fn().mockResolvedValue({ count: 0 }) },
          account: { deleteMany: jest.fn().mockResolvedValue({ count: 0 }) },
          category: { deleteMany: jest.fn().mockResolvedValue({ count: 0 }) },
          userConsent: { deleteMany: jest.fn().mockResolvedValue({ count: 0 }) },
          dataExportRequest: { deleteMany: jest.fn().mockResolvedValue({ count: 0 }) },
          auditLog: { updateMany: jest.fn().mockResolvedValue({ count: 0 }) },
          user: { delete: jest.fn().mockResolvedValue(mockUser) },
        };
        return callback(txMock);
      });

      const count = await service.processScheduledDeletions();

      expect(count).toBe(1); // Apenas 1 sucesso
    });
  });

  describe('sendDeletionReminders', () => {
    it('deve enviar lembretes para usuários com deletion em 7 dias', async () => {
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

      const usersToRemind = [
        {
          id: 'user-1',
          email: 'user1@example.com',
          name: 'User 1',
          deletedAt: sevenDaysFromNow,
        },
        {
          id: 'user-2',
          email: 'user2@example.com',
          name: 'User 2',
          deletedAt: sevenDaysFromNow,
        },
      ];

      mockPrismaService.user.findMany.mockResolvedValue(usersToRemind);

      const count = await service.sendDeletionReminders();

      expect(count).toBe(2);
      expect(mockNotificationsService.notifyAccountDeletionImminent).toHaveBeenCalledTimes(2);
    });

    it('deve continuar mesmo se falhar ao enviar um lembrete', async () => {
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

      const usersToRemind = [
        {
          id: 'user-1',
          email: 'user1@example.com',
          name: 'User 1',
          deletedAt: sevenDaysFromNow,
        },
        {
          id: 'user-2',
          email: 'user2@example.com',
          name: 'User 2',
          deletedAt: sevenDaysFromNow,
        },
      ];

      mockPrismaService.user.findMany.mockResolvedValue(usersToRemind);
      mockNotificationsService.notifyAccountDeletionImminent
        .mockRejectedValueOnce(new Error('Email failed'))
        .mockResolvedValueOnce(undefined);

      const count = await service.sendDeletionReminders();

      expect(count).toBe(1); // Apenas 1 sucesso
    });
  });
});
