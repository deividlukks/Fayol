import { Injectable, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { UsersService } from '../../users/services/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { LoginDto } from '../dto/auth.dto';
import { ForgotPasswordDto, ResetPasswordDto } from '../dto/forgot-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService
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

    if (!user) {
      return { exists: false };
    }

    return {
      exists: true,
      name: user.name,
      email: user.email,
    };
  }

  async login(loginDto: LoginDto) {
    const identifier = (loginDto as any).identifier || loginDto.email;

    const user = await this.validateUser(identifier, loginDto.password);

    if (!user) {
      throw new UnauthorizedException('Credenciais incorretas.');
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

    // Salva token no banco (requer migração)
    await this.usersService.updateResetToken(user.id, resetToken, resetTokenExpires);

    // TODO: Enviar email com o link contendo o token
    // Por enquanto, retorna o token para testes
    console.log(`[DEV] Reset token para ${user.email}: ${resetToken}`);

    return {
      message: 'Se o email existe, um link de recuperação foi enviado.',
      // Apenas para desenvolvimento - REMOVER EM PRODUÇÃO
      devToken: resetToken,
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

    // Valida nova senha
    if (resetPasswordDto.newPassword.length < 6) {
      throw new BadRequestException('A senha deve ter pelo menos 6 caracteres.');
    }

    // Hash da nova senha
    const newPasswordHash = await bcrypt.hash(resetPasswordDto.newPassword, 10);

    // Atualiza senha e limpa token
    await this.usersService.updatePassword(user.id, newPasswordHash);

    return {
      message: 'Senha alterada com sucesso! Você já pode fazer login.',
    };
  }
}
