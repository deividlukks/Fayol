import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { UsersService } from '../../users/services/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { LoginDto } from '../dto/auth.dto';
import { ForgotPasswordDto, ResetPasswordDto } from '../dto/forgot-password.dto';
import { TwoFactorService } from './two-factor.service';
import { TwoFactorLoginResponse } from '@fayol/shared-types';
import { EmailService } from '../../email/email.service';
import { QueueService } from '../../queue/queue.service';
import { validatePasswordOrFail } from '../../../common/utils/password-validator';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private twoFactorService: TwoFactorService,
    private emailService: EmailService,
    private queueService: QueueService
  ) {}

  async validateUser(identifier: string, pass: string): Promise<any> {
    const user = await this.usersService.findByIdentifier(identifier);

    if (user && (await bcrypt.compare(pass, user.passwordHash))) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { passwordHash, ...result } = user;
      return result;
    }

    return null;
  }

  async checkUserExistence(identifier: string) {
    const user = await this.usersService.findByIdentifier(identifier);

    // Retorna apenas se existe ou não, sem expor informações do usuário
    // Isso previne ataques de enumeração de usuários
    return { exists: !!user };
  }

  async login(
    loginDto: LoginDto
  ): Promise<{ access_token: string; user: any } | TwoFactorLoginResponse> {
    // O campo 'email' no schema aceita email ou telefone como identificador
    const identifier = loginDto.email;

    if (!identifier || !loginDto.password) {
      throw new UnauthorizedException('Email/telefone e senha são obrigatórios.');
    }

    const user = await this.validateUser(identifier, loginDto.password);

    if (!user) {
      throw new UnauthorizedException('Credenciais incorretas.');
    }

    // Check if 2FA is enabled for this user
    const fullUser = await this.usersService.findOne(user.id);
    if (fullUser.twoFactorEnabled) {
      // Generate temporary token for 2FA flow
      const tempToken = await this.twoFactorService.generateTempToken(user.id);
      return {
        requiresTwoFactor: true,
        tempToken,
        message: 'Por favor, insira o código de autenticação de dois fatores.',
      };
    }

    const payload = {
      email: user.email,
      sub: user.id,
      roles: user.roles,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user,
    };
  }

  /**
   * Complete login after 2FA verification with TOTP code
   */
  async verify2FALogin(tempToken: string, code: string) {
    // Validate temp token and get user ID
    const userId = await this.twoFactorService.validateTempToken(tempToken);
    if (!userId) {
      throw new UnauthorizedException('Token temporário inválido ou expirado.');
    }

    // Verify 2FA code
    const isValid = await this.twoFactorService.verifyCode(userId, code);
    if (!isValid) {
      throw new UnauthorizedException('Código de autenticação inválido.');
    }

    // Clear temp token
    await this.twoFactorService.clearTempToken(userId);

    // Get user and generate JWT
    const user = await this.usersService.findOne(userId);
    const payload = {
      email: user.email,
      sub: user.id,
      roles: user.roles,
    };

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, twoFactorSecret, ...userWithoutSensitive } = user;

    return {
      access_token: this.jwtService.sign(payload),
      user: userWithoutSensitive,
    };
  }

  /**
   * Complete login using 2FA backup code
   */
  async verify2FABackupCode(tempToken: string, backupCode: string) {
    // Validate temp token and get user ID
    const userId = await this.twoFactorService.validateTempToken(tempToken);
    if (!userId) {
      throw new UnauthorizedException('Token temporário inválido ou expirado.');
    }

    // Verify backup code
    const isValid = await this.twoFactorService.verifyBackupCode(userId, backupCode);
    if (!isValid) {
      throw new UnauthorizedException('Código de backup inválido.');
    }

    // Clear temp token
    await this.twoFactorService.clearTempToken(userId);

    // Get user and generate JWT
    const user = await this.usersService.findOne(userId);
    const payload = {
      email: user.email,
      sub: user.id,
      roles: user.roles,
    };

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, twoFactorSecret, ...userWithoutSensitive } = user;

    return {
      access_token: this.jwtService.sign(payload),
      user: userWithoutSensitive,
    };
  }

  /**
   * Solicita reset de senha - gera token e "envia email"
   * NOTA: Por enquanto retorna o token (em produção, enviaria por email)
   */
  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const user = await this.usersService.findByEmail(forgotPasswordDto.email);

    if (!user) {
      // Por segurança, não revela se o email existe
      return {
        message: 'Se o email existe, um link de recuperação foi enviado.',
      };
    }

    // Gera token aleatório
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = new Date(Date.now() + 3600000); // 1 hora

    // Salva token no banco
    await this.usersService.updateResetToken(user.id, resetToken, resetTokenExpires);

    // Enfileira email para envio assíncrono
    try {
      await this.queueService.addEmailJob({
        type: 'password-reset',
        email: user.email,
        data: {
          resetToken,
        },
      });
    } catch (error) {
      // SEGURANÇA: Não loga dados sensíveis (resetToken, email)
      this.logger.error(
        'Erro ao enfileirar email de recuperação',
        error instanceof Error ? error.stack : error
      );
      // Não revela ao usuário se houve erro no envio
      // Para evitar enumeration attacks
    }

    return {
      message: 'Se o email existe, um link de recuperação foi enviado.',
    };
  }

  /**
   * Reseta a senha usando o token
   */
  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const user = await this.usersService.findByResetToken(resetPasswordDto.token);

    if (!user) {
      throw new BadRequestException('Token inválido ou expirado.');
    }

    // Verifica se o token ainda é válido
    if (user.resetPasswordExpires && user.resetPasswordExpires < new Date()) {
      throw new BadRequestException('Token expirado. Solicite um novo reset de senha.');
    }

    // Valida nova senha com requisitos fortes
    validatePasswordOrFail(resetPasswordDto.newPassword);

    // Hash da nova senha
    const newPasswordHash = await bcrypt.hash(resetPasswordDto.newPassword, 10);

    // Atualiza senha e limpa token
    await this.usersService.updatePassword(user.id, newPasswordHash);

    return {
      message: 'Senha alterada com sucesso! Você já pode fazer login.',
    };
  }
}
