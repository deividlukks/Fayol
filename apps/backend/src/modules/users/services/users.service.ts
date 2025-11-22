import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { User } from '@fayol/database-models';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from '../../auth/dto/auth.dto'; // Ou create-user.dto se tiver separado
import { UpdateUserDto } from '../dto/users.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(data: RegisterDto): Promise<User> {
    const existingUser = await this.prisma.user.findFirst({
      where: { 
        OR: [
          { email: data.email },
          // Se o cadastro permitisse telefone, validaríamos aqui também
        ]
      },
    });

    if (existingUser) {
      throw new ConflictException('Usuário já cadastrado com este e-mail.');
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

  // NOVO: Método genérico para login via Bot (E-mail, Telefone, etc.)
  async findByIdentifier(identifier: string): Promise<User | null> {
    // Tenta limpar caracteres se parecer um telefone
    const cleanIdentifier = identifier.replace(/\D/g, ''); 
    
    return this.prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier }, // Busca exata por e-mail
          // Se tiver números suficientes, tenta buscar por telefone
          ...(cleanIdentifier.length >= 10 ? [{ phoneNumber: identifier }] : [])
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
}