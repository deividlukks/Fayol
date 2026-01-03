import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ConsentService } from './consent.service';
import { PrismaService } from '../prisma/prisma.service';
import { ComplianceNotificationsService } from '../common/services/compliance-notifications.service';
import { ConsentType, ConsentStatus } from '@fayol/shared-types';

describe('ConsentService', () => {
  let service: ConsentService;
  let prismaService: PrismaService;
  let notificationsService: ComplianceNotificationsService;

  const mockUserId = 'user-123';
  const mockConsentId = 'consent-123';

  const mockConsent = {
    id: mockConsentId,
    userId: mockUserId,
    type: ConsentType.MARKETING,
    status: ConsentStatus.GRANTED,
    purpose: 'Marketing emails',
    legalBasis: 'Consent',
    grantedAt: new Date(),
    withdrawnAt: null,
    expiresAt: null,
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaService = {
    userConsent: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  };

  const mockNotificationsService = {
    notifyConsentWithdrawn: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConsentService,
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

    service = module.get<ConsentService>(ConsentService);
    prismaService = module.get<PrismaService>(PrismaService);
    notificationsService = module.get<ComplianceNotificationsService>(
      ComplianceNotificationsService
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('grantConsent', () => {
    it('deve criar novo consentimento quando não existe', async () => {
      const dto = {
        type: ConsentType.MARKETING,
        status: ConsentStatus.GRANTED,
        purpose: 'Marketing emails',
        legalBasis: 'Consent',
      };

      mockPrismaService.userConsent.findFirst.mockResolvedValue(null);
      mockPrismaService.userConsent.create.mockResolvedValue(mockConsent);

      const result = await service.grantConsent(mockUserId, dto, '192.168.1.1', 'Mozilla');

      expect(result).toEqual(mockConsent);
      expect(mockPrismaService.userConsent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: mockUserId,
            type: dto.type,
            status: dto.status,
          }),
        })
      );
    });

    it('deve retornar consentimento existente se já granted', async () => {
      const dto = {
        type: ConsentType.MARKETING,
        status: ConsentStatus.GRANTED,
      };

      mockPrismaService.userConsent.findFirst.mockResolvedValue(mockConsent);

      const result = await service.grantConsent(mockUserId, dto);

      expect(result).toEqual(mockConsent);
      expect(mockPrismaService.userConsent.create).not.toHaveBeenCalled();
    });

    it('deve atualizar consentimento existente ao negar', async () => {
      const dto = {
        type: ConsentType.MARKETING,
        status: ConsentStatus.DENIED,
      };

      mockPrismaService.userConsent.findFirst.mockResolvedValue(mockConsent);
      mockPrismaService.userConsent.update.mockResolvedValue({
        ...mockConsent,
        status: ConsentStatus.DENIED,
      });

      const result = await service.grantConsent(mockUserId, dto);

      expect(mockPrismaService.userConsent.update).toHaveBeenCalled();
    });
  });

  describe('withdrawConsent', () => {
    it('deve retirar consentimento existente', async () => {
      const consentWithUser = {
        ...mockConsent,
        user: { email: 'test@example.com' },
      };

      mockPrismaService.userConsent.findFirst.mockResolvedValue(consentWithUser);
      mockPrismaService.userConsent.update.mockResolvedValue({
        ...mockConsent,
        status: ConsentStatus.WITHDRAWN,
        withdrawnAt: new Date(),
      });

      const result = await service.withdrawConsent(mockUserId, ConsentType.MARKETING);

      expect(result.status).toBe(ConsentStatus.WITHDRAWN);
      expect(mockNotificationsService.notifyConsentWithdrawn).toHaveBeenCalledWith(
        mockUserId,
        'test@example.com',
        ConsentType.MARKETING
      );
    });

    it('deve lançar NotFoundException se consent não existe', async () => {
      mockPrismaService.userConsent.findFirst.mockResolvedValue(null);

      await expect(service.withdrawConsent(mockUserId, ConsentType.MARKETING)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('getUserConsents', () => {
    it('deve retornar todos os consentimentos do usuário', async () => {
      const consents = [mockConsent, { ...mockConsent, type: ConsentType.ANALYTICS }];
      mockPrismaService.userConsent.findMany.mockResolvedValue(consents);

      const result = await service.getUserConsents(mockUserId);

      expect(result).toEqual(consents);
      expect(mockPrismaService.userConsent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: mockUserId },
        })
      );
    });
  });

  describe('getConsentSummary', () => {
    it('deve retornar resumo dos consentimentos agrupados por tipo', async () => {
      const consents = [
        mockConsent,
        {
          ...mockConsent,
          id: 'consent-124',
          type: ConsentType.ANALYTICS,
        },
      ];

      mockPrismaService.userConsent.findMany.mockResolvedValue(consents);

      const result = await service.getConsentSummary(mockUserId);

      expect(result.userId).toBe(mockUserId);
      expect(result.consents).toHaveLength(2);
      expect(result.consents).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ type: ConsentType.MARKETING }),
          expect.objectContaining({ type: ConsentType.ANALYTICS }),
        ])
      );
    });
  });

  describe('hasConsent', () => {
    it('deve retornar true se usuário tem consentimento ativo', async () => {
      mockPrismaService.userConsent.findFirst.mockResolvedValue(mockConsent);

      const result = await service.hasConsent(mockUserId, ConsentType.MARKETING);

      expect(result).toBe(true);
    });

    it('deve retornar false se usuário não tem consentimento', async () => {
      mockPrismaService.userConsent.findFirst.mockResolvedValue(null);

      const result = await service.hasConsent(mockUserId, ConsentType.MARKETING);

      expect(result).toBe(false);
    });

    it('deve considerar data de expiração', async () => {
      mockPrismaService.userConsent.findFirst.mockResolvedValue(mockConsent);

      await service.hasConsent(mockUserId, ConsentType.MARKETING);

      expect(mockPrismaService.userConsent.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [{ expiresAt: null }, { expiresAt: { gt: expect.any(Date) } }],
          }),
        })
      );
    });
  });

  describe('expireOldConsents', () => {
    it('deve expirar consentimentos vencidos', async () => {
      mockPrismaService.userConsent.updateMany.mockResolvedValue({ count: 5 });

      const count = await service.expireOldConsents();

      expect(count).toBe(5);
      expect(mockPrismaService.userConsent.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            expiresAt: { lt: expect.any(Date) },
            status: ConsentStatus.GRANTED,
          }),
          data: {
            status: ConsentStatus.EXPIRED,
          },
        })
      );
    });

    it('deve retornar 0 se não há consentimentos expirados', async () => {
      mockPrismaService.userConsent.updateMany.mockResolvedValue({ count: 0 });

      const count = await service.expireOldConsents();

      expect(count).toBe(0);
    });
  });

  describe('acceptMandatoryConsents', () => {
    it('deve criar consentimentos obrigatórios (TERMS_OF_SERVICE e PRIVACY_POLICY)', async () => {
      mockPrismaService.userConsent.findFirst.mockResolvedValue(null);
      mockPrismaService.userConsent.create.mockResolvedValue(mockConsent);

      const result = await service.acceptMandatoryConsents(mockUserId, '192.168.1.1', 'Mozilla');

      expect(result).toHaveLength(2);
      expect(mockPrismaService.userConsent.create).toHaveBeenCalledTimes(2);
    });

    it('deve usar IP e userAgent fornecidos', async () => {
      const ipAddress = '10.0.0.1';
      const userAgent = 'Chrome';

      mockPrismaService.userConsent.findFirst.mockResolvedValue(null);
      mockPrismaService.userConsent.create.mockResolvedValue(mockConsent);

      await service.acceptMandatoryConsents(mockUserId, ipAddress, userAgent);

      expect(mockPrismaService.userConsent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            ipAddress,
            userAgent,
          }),
        })
      );
    });
  });
});
