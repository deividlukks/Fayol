import { Test, TestingModule } from '@nestjs/testing';
import { UsersModule } from '../../../src/modules/users/users.module';
import { UsersService } from '../../../src/modules/users/services/users.service';
import { UsersController } from '../../../src/modules/users/controllers/users.controller';
import { PrismaService } from '../../../src/prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

jest.mock('bcryptjs');

describe('UsersModule Integration', () => {
  let module: TestingModule;
  let usersService: UsersService;
  let usersController: UsersController;
  let prismaService: any;

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
    module = await Test.createTestingModule({
      imports: [UsersModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        user: {
          create: jest.fn(),
          findUnique: jest.fn(),
          findFirst: jest.fn(),
          findMany: jest.fn(),
          update: jest.fn(),
        },
      })
      .compile();

    usersService = module.get<UsersService>(UsersService);
    usersController = module.get<UsersController>(UsersController);
    prismaService = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
    expect(usersService).toBeDefined();
    expect(usersController).toBeDefined();
  });

  describe('User Creation Flow', () => {
    it('should create a new user with hashed password', async () => {
      const registerDto = {
        name: 'New User',
        email: 'newuser@example.com',
        password: 'password123',
        phone: '(11) 99999-9999',
      };

      prismaService.user.findFirst.mockResolvedValue(null);
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
      prismaService.user.create.mockResolvedValue(mockUser);

      const result = await usersService.create(registerDto);

      expect(result).toBeDefined();
      expect(result.email).toBe(mockUser.email);
      expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 'salt');
      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: registerDto.name,
          email: registerDto.email,
          passwordHash: 'hashed_password',
          phoneNumber: '11999999999',
          roles: ['USER'],
        }),
      });
    });

    it('should normalize phone number during creation', async () => {
      const registerDto = {
        name: 'New User',
        email: 'newuser@example.com',
        password: 'password123',
        phone: '(11) 99999-9999',
      };

      prismaService.user.findFirst.mockResolvedValue(null);
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
      prismaService.user.create.mockResolvedValue(mockUser);

      await usersService.create(registerDto);

      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          phoneNumber: '11999999999',
        }),
      });
    });

    it('should prevent duplicate email registration', async () => {
      const registerDto = {
        name: 'Duplicate User',
        email: 'test@example.com',
        password: 'password123',
        phone: '11999999999',
      };

      prismaService.user.findFirst.mockResolvedValue(mockUser);

      await expect(usersService.create(registerDto)).rejects.toThrow(
        'Usuário já cadastrado com este e-mail.'
      );
      expect(prismaService.user.create).not.toHaveBeenCalled();
    });

    it('should handle user creation without phone number', async () => {
      const registerDto = {
        name: 'No Phone User',
        email: 'nophone@example.com',
        password: 'password123',
        phone: undefined,
      };

      prismaService.user.findFirst.mockResolvedValue(null);
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
      prismaService.user.create.mockResolvedValue(mockUser);

      await usersService.create(registerDto);

      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          phoneNumber: undefined,
        }),
      });
    });
  });

  describe('User Retrieval Flow', () => {
    it('should find user by id', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await usersService.findOne('user-123');

      expect(result).toEqual(mockUser);
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
      });
    });

    it('should throw NotFoundException when user not found by id', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(usersService.findOne('nonexistent-id')).rejects.toThrow(
        'Usuário não encontrado.'
      );
    });

    it('should find user by email (case insensitive)', async () => {
      prismaService.user.findFirst.mockResolvedValue(mockUser);

      const result = await usersService.findByEmail('TEST@EXAMPLE.COM');

      expect(result).toEqual(mockUser);
      expect(prismaService.user.findFirst).toHaveBeenCalledWith({
        where: { email: { equals: 'TEST@EXAMPLE.COM', mode: 'insensitive' } },
      });
    });

    it('should find user by phone number or email', async () => {
      prismaService.user.findFirst.mockResolvedValue(mockUser);

      const result = await usersService.findByIdentifier('(11) 99999-9999');

      expect(result).toEqual(mockUser);
      expect(prismaService.user.findFirst).toHaveBeenCalledWith({
        where: {
          OR: expect.arrayContaining([
            { email: expect.anything() },
            { phoneNumber: '11999999999' },
          ]),
        },
      });
    });
  });

  describe('User Update Flow', () => {
    it('should update user information', async () => {
      const updateDto = {
        name: 'Updated Name',
        investorProfile: 'CONSERVATIVE' as any,
      };

      prismaService.user.findUnique.mockResolvedValue(mockUser);
      prismaService.user.update.mockResolvedValue({
        ...mockUser,
        ...updateDto,
      });

      const result = await usersService.update('user-123', updateDto);

      expect(result.name).toBe(updateDto.name);
      expect(result.investorProfile).toBe(updateDto.investorProfile);
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: expect.objectContaining(updateDto),
      });
    });

    it('should throw NotFoundException when updating non-existent user', async () => {
      const updateDto = { name: 'Updated Name' };
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(usersService.update('nonexistent-id', updateDto)).rejects.toThrow(
        'Usuário não encontrado.'
      );
      expect(prismaService.user.update).not.toHaveBeenCalled();
    });
  });

  describe('Password Reset Token Flow', () => {
    it('should update reset token and expiration', async () => {
      const token = 'reset-token-123';
      const expires = new Date(Date.now() + 3600000);

      prismaService.user.update.mockResolvedValue({
        ...mockUser,
        resetPasswordToken: token,
        resetPasswordExpires: expires,
      });

      const result = await usersService.updateResetToken('user-123', token, expires);

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

    it('should find user by reset token', async () => {
      const userWithToken = {
        ...mockUser,
        resetPasswordToken: 'valid-token',
        resetPasswordExpires: new Date(Date.now() + 3600000),
      };

      prismaService.user.findUnique.mockResolvedValue(userWithToken);

      const result = await usersService.findByResetToken('valid-token');

      expect(result).toEqual(userWithToken);
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { resetPasswordToken: 'valid-token' },
      });
    });

    it('should return null when reset token not found', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      const result = await usersService.findByResetToken('invalid-token');

      expect(result).toBeNull();
    });
  });

  describe('Password Update Flow', () => {
    it('should update password and clear reset token', async () => {
      const newPasswordHash = 'new_hashed_password';

      prismaService.user.update.mockResolvedValue({
        ...mockUser,
        passwordHash: newPasswordHash,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      });

      const result = await usersService.updatePassword('user-123', newPasswordHash);

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

  describe('Email Case Insensitivity', () => {
    it('should treat emails case-insensitively during registration', async () => {
      const registerDto = {
        name: 'Test User',
        email: 'TEST@EXAMPLE.COM',
        password: 'password123',
        phone: '11999999999',
      };

      prismaService.user.findFirst.mockResolvedValue(mockUser);

      await expect(usersService.create(registerDto)).rejects.toThrow();
      expect(prismaService.user.findFirst).toHaveBeenCalledWith({
        where: {
          email: { equals: registerDto.email, mode: 'insensitive' },
        },
      });
    });

    it('should find user with different email casing', async () => {
      prismaService.user.findFirst.mockResolvedValue(mockUser);

      const result1 = await usersService.findByEmail('test@example.com');
      const result2 = await usersService.findByEmail('TEST@EXAMPLE.COM');
      const result3 = await usersService.findByEmail('TeSt@ExAmPlE.cOm');

      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
      expect(result3).toBeDefined();
    });
  });

  describe('Phone Number Handling', () => {
    it('should normalize phone numbers with various formats', async () => {
      const formats = ['(11) 99999-9999', '11999999999', '11 99999-9999', '+55 11 99999-9999'];

      for (const phone of formats) {
        const dto = {
          name: 'Test',
          email: `test${phone}@example.com`,
          password: 'password123',
          phone,
        };

        prismaService.user.findFirst.mockResolvedValue(null);
        (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
        (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
        prismaService.user.create.mockResolvedValue(mockUser);

        await usersService.create(dto);

        expect(prismaService.user.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            phoneNumber: expect.stringMatching(/^\d+$/), // Only digits
          }),
        });
      }
    });

    it('should find user by phone number regardless of formatting', async () => {
      prismaService.user.findFirst.mockResolvedValue(mockUser);

      await usersService.findByIdentifier('(11) 99999-9999');

      expect(prismaService.user.findFirst).toHaveBeenCalledWith({
        where: expect.objectContaining({
          OR: expect.arrayContaining([expect.objectContaining({ phoneNumber: '11999999999' })]),
        }),
      });
    });
  });

  describe('Default Roles Assignment', () => {
    it('should assign USER role by default on registration', async () => {
      const registerDto = {
        name: 'New User',
        email: 'newuser@example.com',
        password: 'password123',
        phone: '11999999999',
      };

      prismaService.user.findFirst.mockResolvedValue(null);
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
      prismaService.user.create.mockResolvedValue(mockUser);

      await usersService.create(registerDto);

      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          roles: ['USER'],
        }),
      });
    });
  });
});
