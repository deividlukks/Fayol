import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { CheckAdminIdDto } from './dto/check-admin-id.dto';
import { VerifyAdminPasswordDto } from './dto/verify-admin-password.dto';
import { AdminFayolIdUtil } from './utils/admin-fayol-id.util';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  /**
   * ETAPA 1: Verifica se o Admin Fayol ID existe e está ativo
   */
  async checkAdminId(checkAdminIdDto: CheckAdminIdDto) {
    const { fayolId } = checkAdminIdDto;

    // Identifica o tipo de Fayol ID
    const idResult = AdminFayolIdUtil.identify(fayolId);

    if (!idResult.isValid) {
      throw new BadRequestException('Fayol ID inválido. Use email, telefone ou CPF válido.');
    }

    // Gera condição WHERE para Prisma
    const whereCondition = AdminFayolIdUtil.generateAdminPrismaWhere(fayolId);

    if (!whereCondition) {
      throw new BadRequestException('Não foi possível processar o Fayol ID fornecido.');
    }

    // Busca admin
    const admin = await this.prisma.admin.findFirst({
      where: whereCondition,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        cpf: true,
        role: true,
        isActive: true,
      },
    });

    if (!admin) {
      throw new UnauthorizedException('Admin Fayol ID não encontrado');
    }

    if (!admin.isActive) {
      throw new UnauthorizedException(
        'Conta administrativa inativa. Entre em contato com o super admin.',
      );
    }

    // Retorna dados básicos para a UI (sem informações sensíveis)
    return {
      exists: true,
      idType: idResult.type,
      admin: {
        name: admin.name,
        role: admin.role,
        // Mascara os dados para segurança
        email: this.maskEmail(admin.email),
        phone: admin.phone ? this.maskPhone(admin.phone) : null,
        cpf: admin.cpf ? this.maskCpf(admin.cpf) : null,
      },
      // Token temporário para vincular as duas etapas (válido por 5 minutos)
      stepToken: this.generateStepToken(fayolId),
    };
  }

  /**
   * ETAPA 2: Verifica a senha e completa o login administrativo
   */
  async verifyAdminPassword(verifyPasswordDto: VerifyAdminPasswordDto) {
    const { fayolId, password } = verifyPasswordDto;

    // Identifica o tipo de Fayol ID
    const idResult = AdminFayolIdUtil.identify(fayolId);

    if (!idResult.isValid) {
      throw new BadRequestException('Fayol ID inválido');
    }

    // Gera condição WHERE para Prisma
    const whereCondition = AdminFayolIdUtil.generateAdminPrismaWhere(fayolId);

    // Busca admin com senha
    const admin = await this.prisma.admin.findFirst({
      where: whereCondition,
    });

    if (!admin || !admin.isActive) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // Verifica senha
    const isPasswordValid = await bcrypt.compare(password, admin.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Senha incorreta');
    }

    // Registra login no audit log
    await this.createAuditLog(admin.id, 'LOGIN', 'Admin', admin.id);

    // Gerar token JWT com role de admin
    const token = await this.generateToken(admin.id, admin.email, admin.role);

    return {
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        phone: admin.phone,
        cpf: admin.cpf,
        role: admin.role,
      },
      ...token,
    };
  }

  /**
   * Valida se o admin ainda está ativo
   */
  async validateAdmin(adminId: string) {
    const admin = await this.prisma.admin.findUnique({
      where: { id: adminId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        cpf: true,
        role: true,
        isActive: true,
      },
    });

    if (!admin || !admin.isActive) {
      throw new UnauthorizedException('Admin não encontrado ou inativo');
    }

    return admin;
  }

  /**
   * Logout do admin (registra no audit log)
   */
  async logout(adminId: string) {
    await this.createAuditLog(adminId, 'LOGOUT', 'Admin', adminId);

    return {
      message: 'Logout realizado com sucesso',
    };
  }

  /**
   * Mascara email para exibição segura
   */
  private maskEmail(email: string): string {
    const [username, domain] = email.split('@');
    const maskedUsername = username.charAt(0) + '***';
    return `${maskedUsername}@${domain}`;
  }

  /**
   * Mascara telefone para exibição segura
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
   */
  private maskCpf(cpf: string): string {
    return `***.${cpf.substring(3, 6)}.${cpf.substring(6, 9)}-**`;
  }

  /**
   * Gera token temporário para vincular etapa 1 e 2
   */
  private generateStepToken(fayolId: string): string {
    const payload = {
      fayolId,
      type: 'admin_step',
      exp: Math.floor(Date.now() / 1000) + 300, // 5 minutos
    };
    return this.jwtService.sign(payload);
  }

  /**
   * Gera token JWT para admin com role
   */
  private async generateToken(adminId: string, email: string, role: string) {
    const payload = {
      sub: adminId,
      email,
      role,
      type: 'admin',
    };

    return {
      accessToken: this.jwtService.sign(payload),
      tokenType: 'Bearer',
      expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    };
  }

  /**
   * Cria registro de auditoria
   */
  private async createAuditLog(
    adminId: string,
    action: string,
    entity: string,
    entityId: string,
    oldValue?: any,
    newValue?: any,
  ) {
    try {
      await this.prisma.auditLog.create({
        data: {
          adminId,
          action,
          entity,
          entityId,
          oldValue: oldValue || null,
          newValue: newValue || null,
        },
      });
    } catch (error) {
      // Log de erro silencioso - não deve bloquear a operação principal
      console.error('Erro ao criar audit log:', error);
    }
  }
}
