import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto } from '../dto/categories.dto';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, data: CreateCategoryDto) {
    return this.prisma.category.create({
      data: {
        name: data.name,
        type: data.type,
        icon: data.icon,
        color: data.color,
        isSystemDefault: false,

        // CORREÇÃO: Usamos 'connect' para o relacionamento Pai, assim como fazemos para User.
        // Isso resolve o conflito de tipos do Prisma.
        parent: data.parentId ? { connect: { id: data.parentId } } : undefined,

        user: {
          connect: { id: userId },
        },
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.category.findMany({
      where: {
        OR: [{ userId }, { isSystemDefault: true }],
        // Retorna apenas categorias "Pai" (sem parentId) na raiz,
        // mas inclui os filhos na propriedade children.
        parentId: null,
      },
      include: {
        children: {
          orderBy: { name: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string, userId: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: { children: true },
    });

    if (!category) {
      throw new NotFoundException('Categoria não encontrada.');
    }

    if (!category.isSystemDefault && category.userId !== userId) {
      throw new ForbiddenException('Acesso negado a esta categoria.');
    }

    return category;
  }

  async update(id: string, userId: string, data: UpdateCategoryDto) {
    const category = await this.findOne(id, userId);

    if (category.isSystemDefault) {
      throw new ForbiddenException('Não é possível editar categorias padrão do sistema.');
    }

    return this.prisma.category.update({
      where: { id },
      data,
    });
  }

  async remove(id: string, userId: string) {
    const category = await this.findOne(id, userId);

    if (category.isSystemDefault) {
      throw new ForbiddenException('Não é possível excluir categorias padrão do sistema.');
    }

    return this.prisma.category.delete({
      where: { id },
    });
  }
}
