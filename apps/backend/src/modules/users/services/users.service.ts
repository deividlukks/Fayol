import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { User } from '@fayol/database-models';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from '../../auth/dto/auth.dto'; // Importando DTO do Auth ou local se preferir
import { UpdateUserDto } from '../dto/users.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(data: RegisterDto): Promise<User> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new ConflictException('Este e-mail já está em uso.');
    }

    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(data.password, salt);

    return this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
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
    return this.prisma.user.findUnique({
      where: { email },
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
}