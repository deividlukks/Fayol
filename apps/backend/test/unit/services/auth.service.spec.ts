import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from '../../../src/modules/auth/services/auth.service';
import { UsersService } from '../../../src/modules/users/services/users.service';
import * as bcrypt from 'bcryptjs';

jest.mock('bcryptjs');

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;

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
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findByIdentifier: jest.fn(),
            findByEmail: jest.fn(),
            updateResetToken: jest.fn(),
            findByResetToken: jest.fn(),
            updatePassword: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService) as jest.Mocked<UsersService>;
    jwtService = module.get(JwtService) as jest.Mocked<JwtService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateUser', () => {
    it('should return user without password when credentials are valid', async () => {
      usersService.findByIdentifier.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser('test@example.com', 'password123');

      expect(result).toBeDefined();
      expect(result.passwordHash).toBeUndefined();
      expect(result.email).toBe(mockUser.email);
      expect(usersService.findByIdentifier).toHaveBeenCalledWith('test@example.com');
    });

    it('should return null when user is not found', async () => {
      usersService.findByIdentifier.mockResolvedValue(null);

      const result = await service.validateUser('nonexistent@example.com', 'password123');

      expect(result).toBeNull();
    });

    it('should return null when password is incorrect', async () => {
      usersService.findByIdentifier.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validateUser('test@example.com', 'wrongpassword');

      expect(result).toBeNull();
    });
  });

  describe('checkUserExistence', () => {
    it('should return user data when user exists', async () => {
      usersService.findByIdentifier.mockResolvedValue(mockUser);

      const result = await service.checkUserExistence('test@example.com');

      expect(result).toEqual({
        exists: true,
        name: mockUser.name,
        email: mockUser.email,
      });
    });

    it('should return exists false when user does not exist', async () => {
      usersService.findByIdentifier.mockResolvedValue(null);

      const result = await service.checkUserExistence('nonexistent@example.com');

      expect(result).toEqual({ exists: false });
    });
  });

  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should return access token and user data on successful login', async () => {
      const userWithoutPassword = { ...mockUser };
      delete (userWithoutPassword as any).passwordHash;

      usersService.findByIdentifier.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwtService.sign.mockReturnValue('jwt-token-123');

      const result = await service.login(loginDto);

      expect(result).toHaveProperty('access_token', 'jwt-token-123');
      expect(result).toHaveProperty('user');
      expect(result.user.passwordHash).toBeUndefined();
      expect(jwtService.sign).toHaveBeenCalledWith({
        email: mockUser.email,
        sub: mockUser.id,
        roles: mockUser.roles,
      });
    });

    it('should throw UnauthorizedException when credentials are invalid', async () => {
      usersService.findByIdentifier.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      await expect(service.login(loginDto)).rejects.toThrow('Credenciais incorretas.');
    });

    it('should handle identifier field for backward compatibility', async () => {
      const loginDtoWithIdentifier = {
        identifier: 'test@example.com',
        email: '',
        password: 'password123',
      } as any;

      usersService.findByIdentifier.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwtService.sign.mockReturnValue('jwt-token-123');

      const result = await service.login(loginDtoWithIdentifier);

      expect(result).toHaveProperty('access_token');
      expect(usersService.findByIdentifier).toHaveBeenCalledWith('test@example.com');
    });
  });

  describe('forgotPassword', () => {
    const forgotPasswordDto = { email: 'test@example.com' };

    it('should generate reset token and return success message when user exists', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      usersService.updateResetToken.mockResolvedValue(mockUser);

      const result = await service.forgotPassword(forgotPasswordDto);

      expect(result).toHaveProperty(
        'message',
        'Se o email existe, um link de recuperação foi enviado.'
      );
      expect(result).toHaveProperty('devToken');
      expect(usersService.findByEmail).toHaveBeenCalledWith(forgotPasswordDto.email);
      expect(usersService.updateResetToken).toHaveBeenCalled();

      const updateCall = usersService.updateResetToken.mock.calls[0];
      expect(updateCall[0]).toBe(mockUser.id);
      expect(typeof updateCall[1]).toBe('string'); // token
      expect(updateCall[2]).toBeInstanceOf(Date); // expires
    });

    it('should return generic message when user does not exist (security)', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      const result = await service.forgotPassword(forgotPasswordDto);

      expect(result).toHaveProperty(
        'message',
        'Se o email existe, um link de recuperação foi enviado.'
      );
      expect(usersService.updateResetToken).not.toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    const resetPasswordDto = {
      token: 'valid-reset-token',
      newPassword: 'newPassword123',
    };

    const userWithValidToken = {
      ...mockUser,
      resetPasswordToken: 'valid-reset-token',
      resetPasswordExpires: new Date(Date.now() + 3600000), // 1 hour from now
    };

    it('should reset password successfully with valid token', async () => {
      usersService.findByResetToken.mockResolvedValue(userWithValidToken);
      usersService.updatePassword.mockResolvedValue(mockUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue('new_hashed_password');

      const result = await service.resetPassword(resetPasswordDto);

      expect(result).toHaveProperty(
        'message',
        'Senha alterada com sucesso! Você já pode fazer login.'
      );
      expect(usersService.findByResetToken).toHaveBeenCalledWith(resetPasswordDto.token);
      expect(bcrypt.hash).toHaveBeenCalledWith(resetPasswordDto.newPassword, 10);
      expect(usersService.updatePassword).toHaveBeenCalledWith(
        userWithValidToken.id,
        'new_hashed_password'
      );
    });

    it('should throw BadRequestException when token is invalid', async () => {
      usersService.findByResetToken.mockResolvedValue(null);

      await expect(service.resetPassword(resetPasswordDto)).rejects.toThrow(BadRequestException);
      await expect(service.resetPassword(resetPasswordDto)).rejects.toThrow(
        'Token inválido ou expirado.'
      );
    });

    it('should throw BadRequestException when token is expired', async () => {
      const userWithExpiredToken = {
        ...mockUser,
        resetPasswordToken: 'expired-token',
        resetPasswordExpires: new Date(Date.now() - 3600000), // 1 hour ago
      };

      usersService.findByResetToken.mockResolvedValue(userWithExpiredToken);

      await expect(service.resetPassword(resetPasswordDto)).rejects.toThrow(BadRequestException);
      await expect(service.resetPassword(resetPasswordDto)).rejects.toThrow(
        'Token expirado. Solicite um novo reset de senha.'
      );
    });

    it('should throw BadRequestException when new password is too short', async () => {
      const shortPasswordDto = {
        token: 'valid-reset-token',
        newPassword: '12345', // Less than 6 characters
      };

      usersService.findByResetToken.mockResolvedValue(userWithValidToken);

      await expect(service.resetPassword(shortPasswordDto)).rejects.toThrow(BadRequestException);
      await expect(service.resetPassword(shortPasswordDto)).rejects.toThrow(
        'A senha deve ter pelo menos 6 caracteres.'
      );
    });
  });
});
