import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { CheckFayolIdDto } from './dto/check-fayol-id.dto';
import { VerifyPasswordDto } from './dto/verify-password.dto';
import { FayolIdUtil, FayolIdType } from './utils/fayol-id.util';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, phone, cpf, password, ...rest } = registerDto;

    // Verificar se email, phone ou CPF já existe
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email }, { phone }, ...(cpf ? [{ cpf }] : [])],
      },
    });

    if (existingUser) {
      if (existingUser.email === email) {
        throw new ConflictException('Email já cadastrado');
      }
      if (existingUser.phone === phone) {
        throw new ConflictException('Telefone já cadastrado');
      }
      if (cpf && existingUser.cpf === cpf) {
        throw new ConflictException('CPF já cadastrado');
      }
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Criar usuário
    const user = await this.prisma.user.create({
      data: {
        email,
        phone,
        cpf,
        password: hashedPassword,
        ...rest,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        cpf: true,
        investorProfile: true,
        createdAt: true,
      },
    });

    // Gerar token
    const token = await this.generateToken(user.id, user.email);

    return {
      user,
      ...token,
    };
  }

  /**
   * Login tradicional (compatibilidade - será descontinuado)
   * @deprecated Use checkFayolId + verifyPassword para login em duas etapas
   */
  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Buscar usuário
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // Verificar senha
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // Gerar token
    const token = await this.generateToken(user.id, user.email);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        cpf: user.cpf,
        investorProfile: user.investorProfile,
      },
      ...token,
    };
  }

  /**
   * ETAPA 1: Verifica se o Fayol ID existe e está ativo
   * Retorna informações básicas do usuário para a UI
   */
  async checkFayolId(checkFayolIdDto: CheckFayolIdDto) {
    const { fayolId } = checkFayolIdDto;

    // Identifica o tipo de Fayol ID
    const idResult = FayolIdUtil.identify(fayolId);

    if (!idResult.isValid) {
      throw new BadRequestException('Fayol ID inválido. Use email, telefone ou CPF válido.');
    }

    // Gera condição WHERE para Prisma
    const whereCondition = FayolIdUtil.generatePrismaWhere(fayolId);

    if (!whereCondition) {
      throw new BadRequestException('Não foi possível processar o Fayol ID fornecido.');
    }

    // Busca usuário
    const user = await this.prisma.user.findFirst({
      where: whereCondition,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        cpf: true,
        isActive: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Fayol ID não encontrado');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Conta inativa. Entre em contato com o suporte.');
    }

    // Retorna dados básicos para a UI (sem informações sensíveis)
    return {
      exists: true,
      idType: idResult.type,
      user: {
        name: user.name,
        // Mascara os dados para segurança
        email: this.maskEmail(user.email),
        phone: this.maskPhone(user.phone),
        cpf: user.cpf ? this.maskCpf(user.cpf) : null,
      },
      // Token temporário para vincular as duas etapas (válido por 5 minutos)
      stepToken: this.generateStepToken(fayolId),
    };
  }

  /**
   * ETAPA 2: Verifica a senha e completa o login
   */
  async verifyPassword(verifyPasswordDto: VerifyPasswordDto) {
    const { fayolId, password } = verifyPasswordDto;

    // Identifica o tipo de Fayol ID
    const idResult = FayolIdUtil.identify(fayolId);

    if (!idResult.isValid) {
      throw new BadRequestException('Fayol ID inválido');
    }

    // Gera condição WHERE para Prisma
    const whereCondition = FayolIdUtil.generatePrismaWhere(fayolId);

    // Busca usuário com senha
    const user = await this.prisma.user.findFirst({
      where: whereCondition,
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // Verifica senha
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Senha incorreta');
    }

    // Gerar token JWT
    const token = await this.generateToken(user.id, user.email);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        cpf: user.cpf,
        investorProfile: user.investorProfile,
      },
      ...token,
    };
  }

  /**
   * Mascara email para exibição segura
   * joao@example.com -> j***@example.com
   */
  private maskEmail(email: string): string {
    const [username, domain] = email.split('@');
    const maskedUsername = username.charAt(0) + '***';
    return `${maskedUsername}@${domain}`;
  }

  /**
   * Mascara telefone para exibição segura
   * 11999999999 -> (11) *****-9999
   */
  private maskPhone(phone: string): string {
    if (phone.length === 11) {
      return `(${phone.substring(0, 2)}) *****-${phone.substring(7)}`;
    }
    if (phone.length === 10) {
      return `(${phone.substring(0, 2)}) ****-${phone.substring(6)}`;
    }
    return '***';
  }

  /**
   * Mascara CPF para exibição segura
   * 12345678900 -> ***.456.789-**
   */
  private maskCpf(cpf: string): string {
    return `***.${cpf.substring(3, 6)}.${cpf.substring(6, 9)}-**`;
  }

  /**
   * Gera token temporário para vincular etapa 1 e 2
   * (Simples implementação - em produção use Redis ou similar)
   */
  private generateStepToken(fayolId: string): string {
    const payload = {
      fayolId,
      type: 'step',
      exp: Math.floor(Date.now() / 1000) + 300, // 5 minutos
    };
    return this.jwtService.sign(payload);
  }

  async validateUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        investorProfile: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Usuário não encontrado ou inativo');
    }

    return user;
  }

  async refresh(userId: string, email: string) {
    // Validar se o usuário ainda existe e está ativo
    await this.validateUser(userId);

    // Gerar novo token
    return this.generateToken(userId, email);
  }

  private async generateToken(userId: string, email: string) {
    const payload = { sub: userId, email };

    return {
      accessToken: this.jwtService.sign(payload),
      tokenType: 'Bearer',
      expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    };
  }

  // ============================================
  // 2FA (Two-Factor Authentication) Methods
  // ============================================

  /**
   * Gera um novo secret TOTP e retorna o QR Code para o usuário configurar no app autenticador
   */
  async generateTwoFactorSecret(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, twoFactorEnabled: true },
    });

    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    if (user.twoFactorEnabled) {
      throw new BadRequestException(
        '2FA já está ativado. Desative primeiro para gerar um novo código.',
      );
    }

    // Gerar secret
    const secret = speakeasy.generateSecret({
      name: `Fayol (${user.email})`,
      issuer: 'Fayol',
      length: 32,
    });

    // Gerar QR Code
    const qrCodeDataUrl = await QRCode.toDataURL(secret.otpauth_url);

    // Salvar secret temporariamente (ainda não ativado)
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: secret.base32 },
    });

    return {
      secret: secret.base32,
      qrCode: qrCodeDataUrl,
      otpauthUrl: secret.otpauth_url,
      message:
        'Escaneie o QR Code no seu aplicativo autenticador (Google Authenticator, Authy, etc) e confirme com um código para ativar o 2FA.',
    };
  }

  /**
   * Verifica o código TOTP e ativa o 2FA
   */
  async enableTwoFactor(userId: string, token: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, twoFactorSecret: true, twoFactorEnabled: true },
    });

    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    if (user.twoFactorEnabled) {
      throw new BadRequestException('2FA já está ativado');
    }

    if (!user.twoFactorSecret) {
      throw new BadRequestException('Secret 2FA não encontrado. Gere um novo secret primeiro.');
    }

    // Verificar token
    const isValid = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 2, // Aceita tokens dentro de uma janela de ±2 períodos (30s cada)
    });

    if (!isValid) {
      throw new BadRequestException('Código 2FA inválido');
    }

    // Ativar 2FA
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true },
    });

    return {
      message: '2FA ativado com sucesso!',
      twoFactorEnabled: true,
    };
  }

  /**
   * Desativa o 2FA (requer código TOTP válido)
   */
  async disableTwoFactor(userId: string, token: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, twoFactorSecret: true, twoFactorEnabled: true },
    });

    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    if (!user.twoFactorEnabled) {
      throw new BadRequestException('2FA não está ativado');
    }

    if (!user.twoFactorSecret) {
      throw new BadRequestException('Secret 2FA não encontrado');
    }

    // Verificar token
    const isValid = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 2,
    });

    if (!isValid) {
      throw new BadRequestException('Código 2FA inválido');
    }

    // Desativar 2FA e remover secret
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
      },
    });

    return {
      message: '2FA desativado com sucesso',
      twoFactorEnabled: false,
    };
  }

  /**
   * Verifica se o usuário tem 2FA ativado
   */
  async getTwoFactorStatus(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorEnabled: true },
    });

    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    return {
      twoFactorEnabled: user.twoFactorEnabled,
    };
  }

  /**
   * Verifica o código TOTP durante o login
   * Deve ser chamado após a verificação de senha bem-sucedida
   */
  async verifyTwoFactorToken(userId: string, token: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorSecret: true, twoFactorEnabled: true },
    });

    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      return false;
    }

    return speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 2,
    });
  }

  /**
   * Login com verificação 2FA incluída
   */
  async loginWithTwoFactor(fayolId: string, password: string, twoFactorToken?: string) {
    // Identifica o tipo de Fayol ID
    const idResult = FayolIdUtil.identify(fayolId);

    if (!idResult.isValid) {
      throw new BadRequestException('Fayol ID inválido');
    }

    // Gera condição WHERE para Prisma
    const whereCondition = FayolIdUtil.generatePrismaWhere(fayolId);

    // Busca usuário
    const user = await this.prisma.user.findFirst({
      where: whereCondition,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        cpf: true,
        password: true,
        investorProfile: true,
        isActive: true,
        twoFactorEnabled: true,
        twoFactorSecret: true,
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // Verifica senha
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Senha incorreta');
    }

    // Se 2FA está ativado, verificar token
    if (user.twoFactorEnabled) {
      if (!twoFactorToken) {
        // Retorna que o 2FA é necessário
        return {
          requiresTwoFactor: true,
          message:
            'Código 2FA necessário. Por favor, insira o código do seu aplicativo autenticador.',
        };
      }

      // Verificar token 2FA
      const isTokenValid = await this.verifyTwoFactorToken(user.id, twoFactorToken);

      if (!isTokenValid) {
        throw new UnauthorizedException('Código 2FA inválido');
      }
    }

    // Gerar token JWT
    const token = await this.generateToken(user.id, user.email);

    return {
      requiresTwoFactor: false,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        cpf: user.cpf,
        investorProfile: user.investorProfile,
      },
      ...token,
    };
  }
}
