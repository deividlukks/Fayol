import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: PrismaService;
  let jwtService: JwtService;

  const mockPrismaService = {
    user: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      name: 'Test User',
      email: 'test@example.com',
      phone: '11999999999',
      password: 'Test@1234',
      investorProfile: 'CONSERVATIVE',
    };

    const mockUser = {
      id: '123',
      name: 'Test User',
      email: 'test@example.com',
      phone: '11999999999',
      investorProfile: 'CONSERVATIVE',
      createdAt: new Date(),
    };

    it('should successfully register a new user', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('mock-token');

      const result = await service.register(registerDto);

      expect(prismaService.user.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [{ email: registerDto.email }, { phone: registerDto.phone }],
        },
      });
      expect(prismaService.user.create).toHaveBeenCalled();
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken', 'mock-token');
      expect(result.user.email).toBe(registerDto.email);
    });

    it('should throw ConflictException if email already exists', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue({
        ...mockUser,
        email: registerDto.email,
      });

      await expect(service.register(registerDto)).rejects.toThrow(
        new ConflictException('Email já cadastrado'),
      );
      expect(prismaService.user.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictException if phone already exists', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue({
        ...mockUser,
        email: 'other@example.com',
        phone: registerDto.phone,
      });

      await expect(service.register(registerDto)).rejects.toThrow(
        new ConflictException('Telefone já cadastrado'),
      );
      expect(prismaService.user.create).not.toHaveBeenCalled();
    });

    it('should hash the password before saving', async () => {
      const hashSpy = jest.spyOn(bcrypt, 'hash');
      mockPrismaService.user.findFirst.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('mock-token');

      await service.register(registerDto);

      expect(hashSpy).toHaveBeenCalledWith(registerDto.password, 10);
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'Test@1234',
    };

    const mockUser = {
      id: '123',
      name: 'Test User',
      email: 'test@example.com',
      phone: '11999999999',
      password: 'hashed-password',
      investorProfile: 'CONSERVATIVE',
      isActive: true,
    };

    it('should successfully login with valid credentials', async () => {
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('mock-token');

      const result = await service.login(loginDto);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: loginDto.email },
      });
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken', 'mock-token');
      expect(result.user.email).toBe(loginDto.email);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        new UnauthorizedException('Credenciais inválidas'),
      );
    });

    it('should throw UnauthorizedException if user is inactive', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        isActive: false,
      });

      await expect(service.login(loginDto)).rejects.toThrow(
        new UnauthorizedException('Credenciais inválidas'),
      );
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(service.login(loginDto)).rejects.toThrow(
        new UnauthorizedException('Credenciais inválidas'),
      );
    });
  });

  describe('validateUser', () => {
    const mockUser = {
      id: '123',
      name: 'Test User',
      email: 'test@example.com',
      phone: '11999999999',
      investorProfile: 'CONSERVATIVE',
      isActive: true,
    };

    it('should return user if found and active', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.validateUser('123');

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: '123' },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          investorProfile: true,
          isActive: true,
        },
      });
      expect(result).toEqual(mockUser);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.validateUser('999')).rejects.toThrow(
        new UnauthorizedException('Usuário não encontrado ou inativo'),
      );
    });

    it('should throw UnauthorizedException if user is inactive', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        isActive: false,
      });

      await expect(service.validateUser('123')).rejects.toThrow(
        new UnauthorizedException('Usuário não encontrado ou inativo'),
      );
    });
  });

  describe('refresh', () => {
    const mockUser = {
      id: '123',
      name: 'Test User',
      email: 'test@example.com',
      phone: '11999999999',
      investorProfile: 'CONSERVATIVE',
      isActive: true,
    };

    it('should generate new token for valid user', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('new-mock-token');

      const result = await service.refresh('123', 'test@example.com');

      expect(result).toHaveProperty('accessToken', 'new-mock-token');
      expect(result).toHaveProperty('tokenType', 'Bearer');
      expect(result).toHaveProperty('expiresIn');
    });

    it('should throw UnauthorizedException if user is invalid', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.refresh('999', 'test@example.com')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
