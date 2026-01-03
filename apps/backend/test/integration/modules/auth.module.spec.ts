import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthModule } from '../../../src/modules/auth/auth.module';
import { AuthService } from '../../../src/modules/auth/services/auth.service';
import { AuthController } from '../../../src/modules/auth/controllers/auth.controller';
import { UsersService } from '../../../src/modules/users/services/users.service';
import { PrismaService } from '../../../src/prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

jest.mock('bcryptjs');

describe('AuthModule Integration', () => {
  let module: TestingModule;
  let authService: AuthService;
  let authController: AuthController;
  let usersService: UsersService;
  let jwtService: JwtService;
  let prismaService: PrismaService;

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
      imports: [AuthModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        user: {
          create: jest.fn(),
          findUnique: jest.fn(),
          findFirst: jest.fn(),
          update: jest.fn(),
        },
      })
      .compile();

    authService = module.get<AuthService>(AuthService);
    authController = module.get<AuthController>(AuthController);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
    expect(authService).toBeDefined();
    expect(authController).toBeDefined();
    expect(usersService).toBeDefined();
    expect(jwtService).toBeDefined();
  });

  describe('User Registration Flow', () => {
    it('should register a new user and hash password', async () => {
      const registerDto = {
        name: 'New User',
        email: 'newuser@example.com',
        password: 'password123',
        phone: '11999999999',
      };

      (prismaService.user.findFirst as jest.Mock).mockResolvedValue(null);
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
      (prismaService.user.create as jest.Mock).mockResolvedValue(mockUser);

      const result = await usersService.create(registerDto);

      expect(result).toBeDefined();
      expect(prismaService.user.create).toHaveBeenCalled();
      expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 'salt');
    });

    it('should prevent duplicate email registration', async () => {
      const registerDto = {
        name: 'Duplicate User',
        email: 'test@example.com',
        password: 'password123',
        phone: '11999999999',
      };

      (prismaService.user.findFirst as jest.Mock).mockResolvedValue(mockUser);

      await expect(usersService.create(registerDto)).rejects.toThrow(
        'Usuário já cadastrado com este e-mail.'
      );
    });
  });

  describe('Login Flow', () => {
    it('should authenticate user and return JWT token', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      (prismaService.user.findFirst as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await authService.login(loginDto);

      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('user');
      expect(result.user.passwordHash).toBeUndefined();
    });

    it('should fail login with incorrect password', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      (prismaService.user.findFirst as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(authService.login(loginDto)).rejects.toThrow('Credenciais incorretas.');
    });

    it('should fail login with non-existent user', async () => {
      const loginDto = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      (prismaService.user.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(authService.login(loginDto)).rejects.toThrow('Credenciais incorretas.');
    });
  });

  describe('Password Reset Flow', () => {
    it('should generate reset token and save to database', async () => {
      const forgotPasswordDto = { email: 'test@example.com' };

      (prismaService.user.findFirst as jest.Mock).mockResolvedValue(mockUser);
      (prismaService.user.update as jest.Mock).mockResolvedValue({
        ...mockUser,
        resetPasswordToken: 'token-123',
        resetPasswordExpires: new Date(),
      });

      const result = await authService.forgotPassword(forgotPasswordDto);

      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('devToken');
      expect(prismaService.user.update).toHaveBeenCalled();
    });

    it('should reset password with valid token', async () => {
      const resetPasswordDto = {
        token: 'valid-token',
        newPassword: 'newPassword123',
      };

      const userWithToken = {
        ...mockUser,
        resetPasswordToken: 'valid-token',
        resetPasswordExpires: new Date(Date.now() + 3600000),
      };

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(userWithToken);
      (bcrypt.hash as jest.Mock).mockResolvedValue('new_hashed_password');
      (prismaService.user.update as jest.Mock).mockResolvedValue(mockUser);

      const result = await authService.resetPassword(resetPasswordDto);

      expect(result).toHaveProperty(
        'message',
        'Senha alterada com sucesso! Você já pode fazer login.'
      );
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: userWithToken.id },
        data: {
          passwordHash: 'new_hashed_password',
          resetPasswordToken: null,
          resetPasswordExpires: null,
        },
      });
    });

    it('should reject expired reset token', async () => {
      const resetPasswordDto = {
        token: 'expired-token',
        newPassword: 'newPassword123',
      };

      const userWithExpiredToken = {
        ...mockUser,
        resetPasswordToken: 'expired-token',
        resetPasswordExpires: new Date(Date.now() - 3600000),
      };

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(userWithExpiredToken);

      await expect(authService.resetPassword(resetPasswordDto)).rejects.toThrow(
        'Token expirado. Solicite um novo reset de senha.'
      );
    });
  });

  describe('JWT Token Generation and Validation', () => {
    it('should generate valid JWT token with user payload', async () => {
      const payload = {
        email: mockUser.email,
        sub: mockUser.id,
        roles: mockUser.roles,
      };

      const token = jwtService.sign(payload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');

      const decoded = jwtService.decode(token) as any;
      expect(decoded.email).toBe(mockUser.email);
      expect(decoded.sub).toBe(mockUser.id);
    });

    it('should include roles in JWT payload', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      (prismaService.user.findFirst as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await authService.login(loginDto);
      const decoded = jwtService.decode(result.access_token) as any;

      expect(decoded.roles).toEqual(mockUser.roles);
    });
  });

  describe('User Existence Check', () => {
    it('should check if user exists by email', async () => {
      (prismaService.user.findFirst as jest.Mock).mockResolvedValue(mockUser);

      const result = await authService.checkUserExistence('test@example.com');

      expect(result.exists).toBe(true);
      expect(result.name).toBe(mockUser.name);
      expect(result.email).toBe(mockUser.email);
    });

    it('should check if user exists by phone number', async () => {
      (prismaService.user.findFirst as jest.Mock).mockResolvedValue(mockUser);

      const result = await authService.checkUserExistence('(11) 99999-9999');

      expect(result.exists).toBe(true);
    });

    it('should return exists false for non-existent user', async () => {
      (prismaService.user.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await authService.checkUserExistence('nonexistent@example.com');

      expect(result.exists).toBe(false);
    });
  });
});
