"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const jwt_1 = require("@nestjs/jwt");
const common_1 = require("@nestjs/common");
const bcrypt = require("bcryptjs");
const auth_service_1 = require("./auth.service");
const prisma_service_1 = require("../prisma/prisma.service");
describe('AuthService', () => {
    let service;
    let prismaService;
    let jwtService;
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
        const module = await testing_1.Test.createTestingModule({
            providers: [
                auth_service_1.AuthService,
                {
                    provide: prisma_service_1.PrismaService,
                    useValue: mockPrismaService,
                },
                {
                    provide: jwt_1.JwtService,
                    useValue: mockJwtService,
                },
            ],
        }).compile();
        service = module.get(auth_service_1.AuthService);
        prismaService = module.get(prisma_service_1.PrismaService);
        jwtService = module.get(jwt_1.JwtService);
        jest.clearAllMocks();
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
    describe('register', () => {
        const registerDto = {
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
            await expect(service.register(registerDto)).rejects.toThrow(new common_1.ConflictException('Email já cadastrado'));
            expect(prismaService.user.create).not.toHaveBeenCalled();
        });
        it('should throw ConflictException if phone already exists', async () => {
            mockPrismaService.user.findFirst.mockResolvedValue({
                ...mockUser,
                email: 'other@example.com',
                phone: registerDto.phone,
            });
            await expect(service.register(registerDto)).rejects.toThrow(new common_1.ConflictException('Telefone já cadastrado'));
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
        const loginDto = {
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
            jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);
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
            await expect(service.login(loginDto)).rejects.toThrow(new common_1.UnauthorizedException('Credenciais inválidas'));
        });
        it('should throw UnauthorizedException if user is inactive', async () => {
            mockPrismaService.user.findUnique.mockResolvedValue({
                ...mockUser,
                isActive: false,
            });
            await expect(service.login(loginDto)).rejects.toThrow(new common_1.UnauthorizedException('Credenciais inválidas'));
        });
        it('should throw UnauthorizedException if password is invalid', async () => {
            jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);
            mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
            await expect(service.login(loginDto)).rejects.toThrow(new common_1.UnauthorizedException('Credenciais inválidas'));
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
            await expect(service.validateUser('999')).rejects.toThrow(new common_1.UnauthorizedException('Usuário não encontrado ou inativo'));
        });
        it('should throw UnauthorizedException if user is inactive', async () => {
            mockPrismaService.user.findUnique.mockResolvedValue({
                ...mockUser,
                isActive: false,
            });
            await expect(service.validateUser('123')).rejects.toThrow(new common_1.UnauthorizedException('Usuário não encontrado ou inativo'));
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
            await expect(service.refresh('999', 'test@example.com')).rejects.toThrow(common_1.UnauthorizedException);
        });
    });
});
//# sourceMappingURL=auth.service.spec.js.map