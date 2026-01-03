import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { UsersService } from '../../../src/modules/users/services/users.service';
import { PrismaService } from '../../../src/prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

jest.mock('bcryptjs');

describe('UsersService', () => {
  let service: UsersService;
  let prismaService: jest.Mocked<PrismaService>;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    passwordHash: 'hashed_password',
    phoneNumber: '11999999999',
    roles: ['USER'],
    createdAt: new Date(),
    updatedAt: new Date(),
    investorProfile: null,
    resetPasswordToken: null,
    resetPasswordExpires: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              create: jest.fn(),
              findUnique: jest.fn(),
              findFirst: jest.fn(),
              findMany: jest.fn(),
              update: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prismaService = module.get(PrismaService) as jest.Mocked<PrismaService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const registerDto = {
      name: 'New User',
      email: 'newuser@example.com',
      password: 'password123',
      phone: '(11) 99999-9999',
    };

    it('should create a new user successfully', async () => {
      (prismaService.user.findFirst as jest.Mock).mockResolvedValue(null);
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
      (prismaService.user.create as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.create(registerDto);

      expect(result).toEqual(mockUser);
      expect(prismaService.user.findFirst).toHaveBeenCalledWith({
        where: {
          email: { equals: registerDto.email, mode: 'insensitive' },
        },
      });
      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: {
          name: registerDto.name,
          email: registerDto.email,
          passwordHash: 'hashed_password',
          phoneNumber: '11999999999', // Normalized phone
          roles: ['USER'],
        },
      });
    });

    it('should throw ConflictException when email already exists', async () => {
      (prismaService.user.findFirst as jest.Mock).mockResolvedValue(mockUser);

      await expect(service.create(registerDto)).rejects.toThrow(ConflictException);
      await expect(service.create(registerDto)).rejects.toThrow(
        'Usuário já cadastrado com este e-mail.'
      );
      expect(prismaService.user.create).not.toHaveBeenCalled();
    });

    it('should handle user creation without phone number', async () => {
      const dtoWithoutPhone = { ...registerDto, phone: undefined };
      (prismaService.user.findFirst as jest.Mock).mockResolvedValue(null);
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
      (prismaService.user.create as jest.Mock).mockResolvedValue(mockUser);

      await service.create(dtoWithoutPhone);

      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          phoneNumber: undefined,
        }),
      });
    });

    it('should normalize phone number by removing special characters', async () => {
      (prismaService.user.findFirst as jest.Mock).mockResolvedValue(null);
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
      (prismaService.user.create as jest.Mock).mockResolvedValue(mockUser);

      await service.create(registerDto);

      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          phoneNumber: '11999999999',
        }),
      });
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.findOne('user-123');

      expect(result).toEqual(mockUser);
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
      });
    });

    it('should throw NotFoundException when user not found', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.findOne('nonexistent-id')).rejects.toThrow(NotFoundException);
      await expect(service.findOne('nonexistent-id')).rejects.toThrow('Usuário não encontrado.');
    });
  });

  describe('findByEmail', () => {
    it('should return user by email (case insensitive)', async () => {
      (prismaService.user.findFirst as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.findByEmail('TEST@EXAMPLE.COM');

      expect(result).toEqual(mockUser);
      expect(prismaService.user.findFirst).toHaveBeenCalledWith({
        where: { email: { equals: 'TEST@EXAMPLE.COM', mode: 'insensitive' } },
      });
    });

    it('should return null when email not found', async () => {
      (prismaService.user.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await service.findByEmail('notfound@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findByIdentifier', () => {
    it('should find user by email', async () => {
      (prismaService.user.findFirst as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.findByIdentifier('test@example.com');

      expect(result).toEqual(mockUser);
      expect(prismaService.user.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [{ email: { equals: 'test@example.com', mode: 'insensitive' } }],
        },
      });
    });

    it('should find user by phone number', async () => {
      (prismaService.user.findFirst as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.findByIdentifier('(11) 99999-9999');

      expect(result).toEqual(mockUser);
      expect(prismaService.user.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [
            { email: { equals: '(11) 99999-9999', mode: 'insensitive' } },
            { phoneNumber: '11999999999' },
          ],
        },
      });
    });

    it('should not search by phone if identifier is too short', async () => {
      (prismaService.user.findFirst as jest.Mock).mockResolvedValue(null);

      await service.findByIdentifier('123');

      expect(prismaService.user.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [{ email: { equals: '123', mode: 'insensitive' } }],
        },
      });
    });
  });

  describe('update', () => {
    const updateDto = {
      name: 'Updated Name',
      investorProfile: 'CONSERVATIVE' as any,
    };

    it('should update user successfully', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prismaService.user.update as jest.Mock).mockResolvedValue({
        ...mockUser,
        ...updateDto,
      });

      const result = await service.update('user-123', updateDto);

      expect(result.name).toBe(updateDto.name);
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: {
          ...updateDto,
          investorProfile: updateDto.investorProfile,
        },
      });
    });

    it('should throw NotFoundException when user not found', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.update('nonexistent-id', updateDto)).rejects.toThrow(NotFoundException);
      expect(prismaService.user.update).not.toHaveBeenCalled();
    });
  });

  describe('updateResetToken', () => {
    it('should update reset token and expiration', async () => {
      const token = 'reset-token-123';
      const expires = new Date(Date.now() + 3600000);
      (prismaService.user.update as jest.Mock).mockResolvedValue({
        ...mockUser,
        resetPasswordToken: token,
        resetPasswordExpires: expires,
      });

      const result = await service.updateResetToken('user-123', token, expires);

      expect(result.resetPasswordToken).toBe(token);
      expect(result.resetPasswordExpires).toBe(expires);
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: {
          resetPasswordToken: token,
          resetPasswordExpires: expires,
        },
      });
    });
  });

  describe('findByResetToken', () => {
    it('should find user by reset token', async () => {
      const userWithToken = {
        ...mockUser,
        resetPasswordToken: 'valid-token',
      };
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(userWithToken);

      const result = await service.findByResetToken('valid-token');

      expect(result).toEqual(userWithToken);
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { resetPasswordToken: 'valid-token' },
      });
    });

    it('should return null when token not found', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await service.findByResetToken('invalid-token');

      expect(result).toBeNull();
    });
  });

  describe('updatePassword', () => {
    it('should update password and clear reset token', async () => {
      const newPasswordHash = 'new_hashed_password';
      (prismaService.user.update as jest.Mock).mockResolvedValue({
        ...mockUser,
        passwordHash: newPasswordHash,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      });

      const result = await service.updatePassword('user-123', newPasswordHash);

      expect(result.passwordHash).toBe(newPasswordHash);
      expect(result.resetPasswordToken).toBeNull();
      expect(result.resetPasswordExpires).toBeNull();
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: {
          passwordHash: newPasswordHash,
          resetPasswordToken: null,
          resetPasswordExpires: null,
        },
      });
    });
  });
});
