import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { User } from '@fayol/database-models';
import * as bcrypt from 'bcryptjs'; // <--- Alterado aqui
import { RegisterDto } from '../../auth/dto/auth.dto';
import { UpdateUserDto } from '../dto/users.dto';

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

  async updateResetToken(
    userId: string,
    token: string,
    expires: Date,
  ): Promise<User> {
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
}
