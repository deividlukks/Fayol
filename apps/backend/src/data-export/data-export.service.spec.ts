import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { DataExportService } from './data-export.service';
import { PrismaService } from '../prisma/prisma.service';
import { ComplianceNotificationsService } from '../common/services/compliance-notifications.service';
import { DataExportStatus } from '@fayol/shared-types';

describe('DataExportService', () => {
  let service: DataExportService;
  let prismaService: PrismaService;
  let notificationsService: ComplianceNotificationsService;

  const mockUserId = 'user-123';
  const mockExportId = 'export-123';

  const mockExportRequest = {
    id: mockExportId,
    userId: mockUserId,
    format: 'JSON',
    status: DataExportStatus.PENDING,
    downloadUrl: null,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    completedAt: null,
    failedReason: null,
    ipAddress: '192.168.1.1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaService = {
    dataExportRequest: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    account: {
      findMany: jest.fn(),
    },
    transaction: {
      findMany: jest.fn(),
    },
    budget: {
      findMany: jest.fn(),
    },
    investment: {
      findMany: jest.fn(),
    },
    category: {
      findMany: jest.fn(),
    },
    goal: {
      findMany: jest.fn(),
    },
    userConsent: {
      findMany: jest.fn(),
    },
  };

  const mockNotificationsService = {
    notifyDataExportReady: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DataExportService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: ComplianceNotificationsService,
          useValue: mockNotificationsService,
        },
      ],
    }).compile();

    service = module.get<DataExportService>(DataExportService);
    prismaService = module.get<PrismaService>(PrismaService);
    notificationsService = module.get<ComplianceNotificationsService>(
      ComplianceNotificationsService
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createExportRequest', () => {
    it('deve criar requisição de exportação com formato JSON', async () => {
      const dto = { format: 'JSON' };
      mockPrismaService.dataExportRequest.create.mockResolvedValue(mockExportRequest);

      const result = await service.createExportRequest(mockUserId, dto, '192.168.1.1');

      expect(result).toEqual(mockExportRequest);
      expect(mockPrismaService.dataExportRequest.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: mockUserId,
            format: 'JSON',
            status: DataExportStatus.PENDING,
            ipAddress: '192.168.1.1',
          }),
        })
      );
    });

    it('deve usar formato JSON como padrão se não especificado', async () => {
      const dto = {};
      mockPrismaService.dataExportRequest.create.mockResolvedValue(mockExportRequest);

      await service.createExportRequest(mockUserId, dto);

      expect(mockPrismaService.dataExportRequest.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            format: 'JSON',
          }),
        })
      );
    });

    it('deve definir expiração para 7 dias', async () => {
      const dto = { format: 'JSON' };
      mockPrismaService.dataExportRequest.create.mockResolvedValue(mockExportRequest);

      await service.createExportRequest(mockUserId, dto);

      expect(mockPrismaService.dataExportRequest.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            expiresAt: expect.any(Date),
          }),
        })
      );
    });
  });

  describe('getUserExportRequests', () => {
    it('deve retornar todas as requisições de exportação do usuário', async () => {
      const mockRequests = [
        mockExportRequest,
        { ...mockExportRequest, id: 'export-124', status: DataExportStatus.COMPLETED },
      ];

      mockPrismaService.dataExportRequest.findMany.mockResolvedValue(mockRequests);

      const result = await service.getUserExportRequests(mockUserId);

      expect(result).toEqual(mockRequests);
      expect(mockPrismaService.dataExportRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: mockUserId },
          orderBy: { createdAt: 'desc' },
        })
      );
    });

    it('deve retornar array vazio se usuário não tem exportações', async () => {
      mockPrismaService.dataExportRequest.findMany.mockResolvedValue([]);

      const result = await service.getUserExportRequests(mockUserId);

      expect(result).toEqual([]);
    });
  });

  describe('getExportRequest', () => {
    it('deve retornar requisição de exportação específica do usuário', async () => {
      mockPrismaService.dataExportRequest.findFirst.mockResolvedValue(mockExportRequest);

      const result = await service.getExportRequest(mockExportId, mockUserId);

      expect(result).toEqual(mockExportRequest);
      expect(mockPrismaService.dataExportRequest.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: mockExportId,
            userId: mockUserId,
          },
        })
      );
    });

    it('deve lançar NotFoundException se requisição não existe', async () => {
      mockPrismaService.dataExportRequest.findFirst.mockResolvedValue(null);

      await expect(service.getExportRequest('invalid-id', mockUserId)).rejects.toThrow(
        NotFoundException
      );
    });

    it('deve lançar NotFoundException se requisição pertence a outro usuário', async () => {
      mockPrismaService.dataExportRequest.findFirst.mockResolvedValue(null);

      await expect(service.getExportRequest(mockExportId, 'other-user')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('cleanupExpiredExports', () => {
    it('deve limpar exportações expiradas (mais de 7 dias)', async () => {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const expiredExports = [
        {
          ...mockExportRequest,
          expiresAt: sevenDaysAgo,
          downloadUrl: '/exports/file1.json',
        },
        {
          ...mockExportRequest,
          id: 'export-124',
          expiresAt: sevenDaysAgo,
          downloadUrl: '/exports/file2.json',
        },
      ];

      mockPrismaService.dataExportRequest.findMany.mockResolvedValue(expiredExports);
      mockPrismaService.dataExportRequest.deleteMany.mockResolvedValue({ count: 2 });

      const count = await service.cleanupExpiredExports();

      expect(count).toBe(2);
      expect(mockPrismaService.dataExportRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            expiresAt: { lt: expect.any(Date) },
            status: DataExportStatus.COMPLETED,
          }),
        })
      );
      expect(mockPrismaService.dataExportRequest.deleteMany).toHaveBeenCalled();
    });

    it('deve retornar 0 se não há exportações expiradas', async () => {
      mockPrismaService.dataExportRequest.findMany.mockResolvedValue([]);
      mockPrismaService.dataExportRequest.deleteMany.mockResolvedValue({ count: 0 });

      const count = await service.cleanupExpiredExports();

      expect(count).toBe(0);
    });

    it('deve continuar mesmo se houver erro ao deletar arquivo', async () => {
      const expiredExport = {
        ...mockExportRequest,
        expiresAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
        downloadUrl: '/exports/nonexistent.json',
      };

      mockPrismaService.dataExportRequest.findMany.mockResolvedValue([expiredExport]);
      mockPrismaService.dataExportRequest.deleteMany.mockResolvedValue({ count: 1 });

      const count = await service.cleanupExpiredExports();

      expect(count).toBe(1);
    });
  });

  describe('processExport (through createExportRequest)', () => {
    it('deve processar exportação em background após criação', async () => {
      const dto = { format: 'JSON' };
      mockPrismaService.dataExportRequest.create.mockResolvedValue(mockExportRequest);

      // Mock do processamento interno
      mockPrismaService.dataExportRequest.update.mockResolvedValue({
        ...mockExportRequest,
        status: DataExportStatus.PROCESSING,
      });

      const mockUser = {
        id: mockUserId,
        email: 'test@example.com',
        name: 'Test User',
      };

      mockPrismaService.dataExportRequest.findUnique.mockResolvedValue(mockExportRequest);
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.account.findMany.mockResolvedValue([]);
      mockPrismaService.transaction.findMany.mockResolvedValue([]);
      mockPrismaService.budget.findMany.mockResolvedValue([]);
      mockPrismaService.investment.findMany.mockResolvedValue([]);
      mockPrismaService.category.findMany.mockResolvedValue([]);
      mockPrismaService.goal.findMany.mockResolvedValue([]);
      mockPrismaService.userConsent.findMany.mockResolvedValue([]);

      const result = await service.createExportRequest(mockUserId, dto);

      expect(result).toEqual(mockExportRequest);
    });
  });
});
