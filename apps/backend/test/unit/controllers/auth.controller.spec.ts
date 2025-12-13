import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AuthController } from '../../../src/modules/auth/controllers/auth.controller';
import { AuthService } from '../../../src/modules/auth/services/auth.service';
import { UsersService } from '../../../src/modules/users/services/users.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;
  let usersService: jest.Mocked<UsersService>;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
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
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            checkUserExistence: jest.fn(),
            login: jest.fn(),
            forgotPassword: jest.fn(),
            resetPassword: jest.fn(),
          },
        },
        {
          provide: UsersService,
          useValue: {
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService) as jest.Mocked<AuthService>;
    usersService = module.get(UsersService) as jest.Mocked<UsersService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('check', () => {
    it('should check if user exists', async () => {
      const identifier = 'test@example.com';
      const expectedResponse = {
        exists: true,
        name: 'Test User',
        email: 'test@example.com',
      };

      authService.checkUserExistence.mockResolvedValue(expectedResponse);

      const result = await controller.check(identifier);

      expect(result).toEqual(expectedResponse);
      expect(authService.checkUserExistence).toHaveBeenCalledWith(identifier);
    });

    it('should return exists false when user does not exist', async () => {
      const identifier = 'nonexistent@example.com';
      authService.checkUserExistence.mockResolvedValue({ exists: false });

      const result = await controller.check(identifier);

      expect(result).toEqual({ exists: false });
    });
  });

  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should return access token and user on successful login', async () => {
      const expectedResponse = {
        access_token: 'jwt-token-123',
        user: mockUser,
      };

      authService.login.mockResolvedValue(expectedResponse);

      const result = await controller.login(loginDto);

      expect(result).toEqual(expectedResponse);
      expect(authService.login).toHaveBeenCalledWith(loginDto);
    });

    it('should throw UnauthorizedException on invalid credentials', async () => {
      authService.login.mockRejectedValue(new UnauthorizedException('Credenciais incorretas.'));

      await expect(controller.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('register', () => {
    const registerDto = {
      name: 'New User',
      email: 'newuser@example.com',
      password: 'password123',
      phone: '11999999999',
    };

    it('should create a new user successfully', async () => {
      const newUser = {
        ...mockUser,
        email: registerDto.email,
        name: registerDto.name,
      };

      usersService.create.mockResolvedValue(newUser);

      const result = await controller.register(registerDto);

      expect(result).toEqual(newUser);
      expect(usersService.create).toHaveBeenCalledWith(registerDto);
    });

    it('should handle registration errors', async () => {
      usersService.create.mockRejectedValue(new Error('Email already exists'));

      await expect(controller.register(registerDto)).rejects.toThrow();
    });
  });

  describe('forgotPassword', () => {
    const forgotPasswordDto = {
      email: 'test@example.com',
    };

    it('should send password reset email', async () => {
      const expectedResponse = {
        message: 'Se o email existe, um link de recuperação foi enviado.',
        devToken: 'reset-token-123',
      };

      authService.forgotPassword.mockResolvedValue(expectedResponse);

      const result = await controller.forgotPassword(forgotPasswordDto);

      expect(result).toEqual(expectedResponse);
      expect(authService.forgotPassword).toHaveBeenCalledWith(forgotPasswordDto);
    });

    it('should return generic message for security reasons', async () => {
      const genericResponse = {
        message: 'Se o email existe, um link de recuperação foi enviado.',
      };

      authService.forgotPassword.mockResolvedValue(genericResponse);

      const result = await controller.forgotPassword({ email: 'nonexistent@example.com' });

      expect(result.message).toBe('Se o email existe, um link de recuperação foi enviado.');
    });
  });

  describe('resetPassword', () => {
    const resetPasswordDto = {
      token: 'valid-reset-token',
      newPassword: 'newPassword123',
    };

    it('should reset password successfully', async () => {
      const expectedResponse = {
        message: 'Senha alterada com sucesso! Você já pode fazer login.',
      };

      authService.resetPassword.mockResolvedValue(expectedResponse);

      const result = await controller.resetPassword(resetPasswordDto);

      expect(result).toEqual(expectedResponse);
      expect(authService.resetPassword).toHaveBeenCalledWith(resetPasswordDto);
    });

    it('should handle invalid token', async () => {
      authService.resetPassword.mockRejectedValue(new Error('Token inválido ou expirado.'));

      await expect(controller.resetPassword(resetPasswordDto)).rejects.toThrow();
    });

    it('should handle expired token', async () => {
      authService.resetPassword.mockRejectedValue(
        new Error('Token expirado. Solicite um novo reset de senha.')
      );

      await expect(controller.resetPassword(resetPasswordDto)).rejects.toThrow();
    });
  });
});
