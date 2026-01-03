import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { TwoFactorService } from './two-factor.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { UsersService } from '../../users/services/users.service';
import * as bcrypt from 'bcryptjs';
import * as speakeasy from 'speakeasy';

describe('TwoFactorService', () => {
  let service: TwoFactorService;
  let prismaService: PrismaService;
  let usersService: UsersService;
  let configService: ConfigService;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    passwordHash: 'hashed-password',
    twoFactorEnabled: false,
    twoFactorSecret: null,
    twoFactorBackupCodes: [],
    twoFactorTempToken: null,
    twoFactorTempExpires: null,
  };

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
      findFirst: jest.fn(),
    },
  };

  const mockUsersService = {
    findOne: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TwoFactorService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    // Mock da chave de encriptação
    mockConfigService.get.mockReturnValue(
      'e55888c8c76eda0d55cef6805d4e58f3bc5e39ae38c4ccb7f8476fc295306be9'
    );

    service = module.get<TwoFactorService>(TwoFactorService);
    prismaService = module.get<PrismaService>(PrismaService);
    usersService = module.get<UsersService>(UsersService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('setup2FA', () => {
    it('deve gerar QR code e backup codes com senha válida', async () => {
      const password = 'correct-password';
      mockUsersService.findOne.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed-backup-code' as never);
      mockPrismaService.user.update.mockResolvedValue({
        ...mockUser,
        twoFactorSecret: 'encrypted-secret',
      });

      const result = await service.setup2FA(mockUser.id, password);

      expect(result).toHaveProperty('qrCodeUrl');
      expect(result).toHaveProperty('secret');
      expect(result).toHaveProperty('backupCodes');
      expect(result.backupCodes).toHaveLength(8);
      expect(result.qrCodeUrl).toContain('data:image/png;base64');
      expect(mockPrismaService.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockUser.id },
          data: expect.objectContaining({
            twoFactorEnabled: false,
          }),
        })
      );
    });

    it('deve lançar UnauthorizedException com senha incorreta', async () => {
      mockUsersService.findOne.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      await expect(service.setup2FA(mockUser.id, 'wrong-password')).rejects.toThrow(
        UnauthorizedException
      );
    });

    it('deve lançar BadRequestException se 2FA já está ativado', async () => {
      const userWith2FA = { ...mockUser, twoFactorEnabled: true };
      mockUsersService.findOne.mockResolvedValue(userWith2FA);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      await expect(service.setup2FA(mockUser.id, 'password')).rejects.toThrow(BadRequestException);
    });
  });

  describe('verifySetup', () => {
    it('deve ativar 2FA com código TOTP válido', async () => {
      const validCode = '123456';
      const userWithSecret = {
        ...mockUser,
        twoFactorSecret: 'encrypted-secret',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(userWithSecret);
      jest.spyOn(speakeasy.totp, 'verify').mockReturnValue(true);
      mockPrismaService.user.update.mockResolvedValue({
        ...userWithSecret,
        twoFactorEnabled: true,
      });

      const result = await service.verifySetup(mockUser.id, validCode);

      expect(result).toHaveProperty('message');
      expect(mockPrismaService.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockUser.id },
          data: { twoFactorEnabled: true },
        })
      );
    });

    it('deve lançar BadRequestException com código inválido', async () => {
      const invalidCode = '000000';
      const userWithSecret = {
        ...mockUser,
        twoFactorSecret: 'encrypted-secret',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(userWithSecret);
      jest.spyOn(speakeasy.totp, 'verify').mockReturnValue(false);

      await expect(service.verifySetup(mockUser.id, invalidCode)).rejects.toThrow(
        BadRequestException
      );
    });

    it('deve lançar BadRequestException se 2FA não foi iniciado', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(service.verifySetup(mockUser.id, '123456')).rejects.toThrow(BadRequestException);
    });
  });

  describe('verifyCode', () => {
    it('deve retornar true com código TOTP válido', async () => {
      const validCode = '123456';
      const userWith2FA = {
        ...mockUser,
        twoFactorEnabled: true,
        twoFactorSecret: 'encrypted-secret',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(userWith2FA);
      jest.spyOn(speakeasy.totp, 'verify').mockReturnValue(true);

      const result = await service.verifyCode(mockUser.id, validCode);

      expect(result).toBe(true);
    });

    it('deve retornar false com código TOTP inválido', async () => {
      const invalidCode = '000000';
      const userWith2FA = {
        ...mockUser,
        twoFactorEnabled: true,
        twoFactorSecret: 'encrypted-secret',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(userWith2FA);
      jest.spyOn(speakeasy.totp, 'verify').mockReturnValue(false);

      const result = await service.verifyCode(mockUser.id, invalidCode);

      expect(result).toBe(false);
    });

    it('deve lançar BadRequestException se 2FA não está ativado', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(service.verifyCode(mockUser.id, '123456')).rejects.toThrow(BadRequestException);
    });
  });

  describe('verifyBackupCode', () => {
    it('deve retornar true e remover backup code usado', async () => {
      const backupCode = 'ABC123DEF456';
      const userWith2FA = {
        ...mockUser,
        twoFactorEnabled: true,
        twoFactorBackupCodes: ['hashed-code-1', 'hashed-code-2'],
      };

      mockPrismaService.user.findUnique.mockResolvedValue(userWith2FA);
      jest
        .spyOn(bcrypt, 'compare')
        .mockResolvedValueOnce(false as never)
        .mockResolvedValueOnce(true as never);
      mockPrismaService.user.update.mockResolvedValue({
        ...userWith2FA,
        twoFactorBackupCodes: ['hashed-code-1'],
      });

      const result = await service.verifyBackupCode(mockUser.id, backupCode);

      expect(result).toBe(true);
      expect(mockPrismaService.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockUser.id },
          data: {
            twoFactorBackupCodes: ['hashed-code-1'],
          },
        })
      );
    });

    it('deve retornar false se backup code não corresponder', async () => {
      const invalidBackupCode = 'INVALID';
      const userWith2FA = {
        ...mockUser,
        twoFactorEnabled: true,
        twoFactorBackupCodes: ['hashed-code-1'],
      };

      mockPrismaService.user.findUnique.mockResolvedValue(userWith2FA);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      const result = await service.verifyBackupCode(mockUser.id, invalidBackupCode);

      expect(result).toBe(false);
    });

    it('deve retornar false se não há backup codes', async () => {
      const userWith2FA = {
        ...mockUser,
        twoFactorEnabled: true,
        twoFactorBackupCodes: [],
      };

      mockPrismaService.user.findUnique.mockResolvedValue(userWith2FA);

      const result = await service.verifyBackupCode(mockUser.id, 'ANY_CODE');

      expect(result).toBe(false);
    });
  });

  describe('disable2FA', () => {
    it('deve desativar 2FA com senha e código corretos', async () => {
      const password = 'correct-password';
      const code = '123456';
      const userWith2FA = {
        ...mockUser,
        twoFactorEnabled: true,
        twoFactorSecret: 'encrypted-secret',
      };

      mockUsersService.findOne.mockResolvedValue(userWith2FA);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      mockPrismaService.user.findUnique.mockResolvedValue(userWith2FA);
      jest.spyOn(speakeasy.totp, 'verify').mockReturnValue(true);
      mockPrismaService.user.update.mockResolvedValue({
        ...mockUser,
        twoFactorEnabled: false,
      });

      const result = await service.disable2FA(mockUser.id, password, code);

      expect(result).toHaveProperty('message');
      expect(mockPrismaService.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockUser.id },
          data: expect.objectContaining({
            twoFactorEnabled: false,
            twoFactorSecret: null,
          }),
        })
      );
    });

    it('deve lançar UnauthorizedException com senha incorreta', async () => {
      mockUsersService.findOne.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      await expect(service.disable2FA(mockUser.id, 'wrong-password', '123456')).rejects.toThrow(
        UnauthorizedException
      );
    });

    it('deve lançar BadRequestException com código inválido', async () => {
      const userWith2FA = {
        ...mockUser,
        twoFactorEnabled: true,
        twoFactorSecret: 'encrypted-secret',
      };

      mockUsersService.findOne.mockResolvedValue(userWith2FA);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      mockPrismaService.user.findUnique.mockResolvedValue(userWith2FA);
      jest.spyOn(speakeasy.totp, 'verify').mockReturnValue(false);

      await expect(service.disable2FA(mockUser.id, 'password', 'invalid-code')).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('generateTempToken', () => {
    it('deve gerar token temporário com 5 minutos de validade', async () => {
      mockPrismaService.user.update.mockResolvedValue({
        ...mockUser,
        twoFactorTempToken: 'temp-token-123',
      });

      const token = await service.generateTempToken(mockUser.id);

      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
      expect(mockPrismaService.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockUser.id },
          data: expect.objectContaining({
            twoFactorTempToken: expect.any(String),
            twoFactorTempExpires: expect.any(Date),
          }),
        })
      );
    });
  });

  describe('validateTempToken', () => {
    it('deve retornar userId com token válido', async () => {
      const validToken = 'valid-temp-token';
      const futureDate = new Date(Date.now() + 300000);

      mockPrismaService.user.findFirst.mockResolvedValue({
        ...mockUser,
        twoFactorTempToken: validToken,
        twoFactorTempExpires: futureDate,
      });

      const userId = await service.validateTempToken(validToken);

      expect(userId).toBe(mockUser.id);
    });

    it('deve retornar null com token expirado', async () => {
      const expiredToken = 'expired-token';

      mockPrismaService.user.findFirst.mockResolvedValue(null);

      const userId = await service.validateTempToken(expiredToken);

      expect(userId).toBeNull();
    });
  });

  describe('regenerateBackupCodes', () => {
    it('deve gerar novos backup codes com senha válida', async () => {
      const password = 'correct-password';
      const userWith2FA = {
        ...mockUser,
        twoFactorEnabled: true,
      };

      mockUsersService.findOne.mockResolvedValue(userWith2FA);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('new-hashed-code' as never);
      mockPrismaService.user.update.mockResolvedValue(userWith2FA);

      const result = await service.regenerateBackupCodes(mockUser.id, password);

      expect(result).toHaveProperty('backupCodes');
      expect(result).toHaveProperty('message');
      expect(result.backupCodes).toHaveLength(8);
    });

    it('deve lançar BadRequestException se 2FA não está ativado', async () => {
      mockUsersService.findOne.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      await expect(service.regenerateBackupCodes(mockUser.id, 'password')).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('get2FAStatus', () => {
    it('deve retornar status correto do 2FA', async () => {
      const userWith2FA = {
        ...mockUser,
        twoFactorEnabled: true,
        twoFactorBackupCodes: ['code1', 'code2', 'code3'],
      };

      mockPrismaService.user.findUnique.mockResolvedValue(userWith2FA);

      const status = await service.get2FAStatus(mockUser.id);

      expect(status).toEqual({
        enabled: true,
        backupCodesRemaining: 3,
      });
    });

    it('deve lançar BadRequestException se usuário não existe', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.get2FAStatus('invalid-id')).rejects.toThrow(BadRequestException);
    });
  });
});
