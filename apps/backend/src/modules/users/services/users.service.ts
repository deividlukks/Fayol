import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { User } from '@fayol/database-models';
import * as bcrypt from 'bcryptjs'; // <--- Alterado aqui
import { RegisterDto } from '../../auth/dto/auth.dto';
import { UpdateUserDto } from '../dto/users.dto';
import { validatePasswordOrFail } from '../../../common/utils/password-validator';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(data: RegisterDto): Promise<User> {
    const existingUser = await this.prisma.user.findFirst({
      where: {
        email: { equals: data.email, mode: 'insensitive' },
      },
    });

    if (existingUser) {
      throw new ConflictException('Usuário já cadastrado com este e-mail.');
    }

    // Valida senha com requisitos fortes
    validatePasswordOrFail(data.password);

    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(data.password, salt);

    // Normaliza o telefone removendo caracteres especiais
    const phoneNumber = data.phone ? data.phone.replace(/\D/g, '') : undefined;

    return this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
        phoneNumber,
        roles: ['USER'],
      },
    });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
    });
  }

  async findByIdentifier(identifier: string): Promise<User | null> {
    const cleanPhone = identifier.replace(/\D/g, '');
    const isPotentialPhone = cleanPhone.length >= 10;

    return this.prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: identifier, mode: 'insensitive' } },
          ...(isPotentialPhone ? [{ phoneNumber: cleanPhone }] : []),
        ],
      },
    });
  }

  async update(id: string, data: UpdateUserDto): Promise<User> {
    await this.findOne(id);

    return this.prisma.user.update({
      where: { id },
      data: {
        ...data,
        investorProfile: data.investorProfile || undefined,
      },
    });
  }

  // ==========================================
  // MÉTODOS PARA RESET DE SENHA
  // ==========================================

  async findByResetToken(token: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { resetPasswordToken: token },
    });
  }

  async updateResetToken(userId: string, token: string, expires: Date): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        resetPasswordToken: token,
        resetPasswordExpires: expires,
      },
    });
  }

  async updatePassword(userId: string, newPasswordHash: string): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: newPasswordHash,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });
  }

  /**
   * Altera a senha do usuário após validar a senha atual
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    // Busca usuário
    const user = await this.findOne(userId);

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    // Verifica senha atual
    const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);

    if (!isPasswordValid) {
      throw new BadRequestException('Senha atual incorreta.');
    }

    // Valida nova senha com requisitos fortes
    validatePasswordOrFail(newPassword);

    // Verifica se a nova senha é diferente da atual
    const isSamePassword = await bcrypt.compare(newPassword, user.passwordHash);

    if (isSamePassword) {
      throw new BadRequestException('A nova senha deve ser diferente da senha atual.');
    }

    // Hash da nova senha
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Atualiza senha
    await this.updatePassword(userId, newPasswordHash);
  }

  // ==========================================
  // MÉTODOS PARA PUSH NOTIFICATIONS
  // ==========================================

  /**
   * Registra ou atualiza um push token para o usuário
   * Se o token já existir, não duplica
   */
  async registerPushToken(userId: string, token: string): Promise<User> {
    const user = await this.findOne(userId);

    // Verifica se o token já existe
    if (user.pushTokens.includes(token)) {
      return user; // Já existe, não precisa atualizar
    }

    // Adiciona o novo token ao array
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        pushTokens: {
          push: token,
        },
      },
    });
  }

  /**
   * Remove um push token específico do usuário
   */
  async removePushToken(userId: string, token: string): Promise<User> {
    const user = await this.findOne(userId);

    // Remove o token do array
    const updatedTokens = user.pushTokens.filter((t) => t !== token);

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        pushTokens: updatedTokens,
      },
    });
  }

  /**
   * Remove todos os push tokens do usuário
   * Útil quando o usuário faz logout de todos os dispositivos
   */
  async removeAllPushTokens(userId: string): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        pushTokens: [],
      },
    });
  }

  /**
   * Obtém todos os push tokens ativos do usuário
   */
  async getPushTokens(userId: string): Promise<string[]> {
    const user = await this.findOne(userId);
    return user.pushTokens;
  }
}
