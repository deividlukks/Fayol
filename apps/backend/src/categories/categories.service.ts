import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface CreateCategoryDto {
  name: string;
  type: string;
  parentId?: string;
  icon?: string;
  color?: string;
}

interface CreateSubcategoryDto {
  categoryId: string;
  name: string;
}

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createCategoryDto: CreateCategoryDto) {
    // Se tem parentId, verificar se a categoria pai existe e pertence ao usuário
    if (createCategoryDto.parentId) {
      const parentCategory = await this.prisma.category.findUnique({
        where: { id: createCategoryDto.parentId },
      });

      if (!parentCategory) {
        throw new NotFoundException('Categoria pai não encontrada');
      }

      if (!parentCategory.isSystem && parentCategory.userId !== userId) {
        throw new ForbiddenException('Você não pode criar subcategorias nesta categoria');
      }
    }

    return this.prisma.category.create({
      data: {
        ...createCategoryDto,
        userId,
        isSystem: false,
      },
      include: {
        parent: true,
        children: true,
      },
    });
  }

  async findAll(userId: string) {
    const categories = await this.prisma.category.findMany({
      where: {
        OR: [{ isSystem: true }, { userId }],
      },
      include: {
        parent: true,
        children: true,
        subcategories: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return categories;
  }

  /**
   * Retorna apenas as categorias raiz (sem pai) em formato de árvore hierárquica
   */
  async findAllTree(userId: string) {
    // Buscar apenas categorias raiz (sem parentId)
    const rootCategories = await this.prisma.category.findMany({
      where: {
        OR: [{ isSystem: true }, { userId }],
        parentId: null,
      },
      include: {
        children: {
          include: {
            children: {
              include: {
                children: true, // Até 4 níveis de profundidade
              },
            },
          },
        },
        subcategories: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return rootCategories;
  }

  /**
   * Retorna todos os filhos de uma categoria (recursivamente)
   */
  async findCategoryWithChildren(categoryId: string, userId: string) {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        parent: true,
        children: {
          include: {
            children: {
              include: {
                children: {
                  include: {
                    children: true,
                  },
                },
              },
            },
          },
        },
        subcategories: true,
      },
    });

    if (!category) {
      throw new NotFoundException('Categoria não encontrada');
    }

    if (!category.isSystem && category.userId !== userId) {
      throw new ForbiddenException('Acesso negado');
    }

    return category;
  }

  /**
   * Retorna o caminho completo da categoria até a raiz
   */
  async getCategoryPath(categoryId: string, userId: string): Promise<any[]> {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        parent: true,
      },
    });

    if (!category) {
      throw new NotFoundException('Categoria não encontrada');
    }

    if (!category.isSystem && category.userId !== userId) {
      throw new ForbiddenException('Acesso negado');
    }

    const path = [category];

    if (category.parent) {
      const parentPath = await this.getCategoryPath(category.parent.id, userId);
      path.unshift(...parentPath);
    }

    return path;
  }

  async findOne(id: string, userId: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        parent: true,
        children: true,
        subcategories: true,
      },
    });

    if (!category) {
      throw new NotFoundException('Categoria não encontrada');
    }

    // Categorias do sistema podem ser visualizadas por todos
    if (!category.isSystem && category.userId !== userId) {
      throw new ForbiddenException('Acesso negado');
    }

    return category;
  }

  async update(id: string, userId: string, updateCategoryDto: Partial<CreateCategoryDto>) {
    const category = await this.prisma.category.findUnique({ where: { id } });

    if (!category) {
      throw new NotFoundException('Categoria não encontrada');
    }

    if (category.isSystem) {
      throw new ForbiddenException('Não é possível editar categorias do sistema');
    }

    if (category.userId !== userId) {
      throw new ForbiddenException('Acesso negado');
    }

    // Se está alterando o parentId, validar para evitar ciclos
    if (updateCategoryDto.parentId) {
      // Não pode ser pai de si mesma
      if (updateCategoryDto.parentId === id) {
        throw new ForbiddenException('Uma categoria não pode ser pai de si mesma');
      }

      // Verificar se o novo pai não é um descendente desta categoria
      const isDescendant = await this.isDescendantOf(updateCategoryDto.parentId, id);
      if (isDescendant) {
        throw new ForbiddenException('Não é possível criar referência circular na hierarquia');
      }

      // Verificar se categoria pai existe
      const parentCategory = await this.prisma.category.findUnique({
        where: { id: updateCategoryDto.parentId },
      });

      if (!parentCategory) {
        throw new NotFoundException('Categoria pai não encontrada');
      }

      if (!parentCategory.isSystem && parentCategory.userId !== userId) {
        throw new ForbiddenException('Você não pode mover categoria para esta categoria pai');
      }
    }

    return this.prisma.category.update({
      where: { id },
      data: updateCategoryDto,
      include: {
        parent: true,
        children: true,
      },
    });
  }

  /**
   * Verifica se categoryId é descendente de possibleAncestorId
   */
  private async isDescendantOf(categoryId: string, possibleAncestorId: string): Promise<boolean> {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
      include: { parent: true },
    });

    if (!category || !category.parent) {
      return false;
    }

    if (category.parent.id === possibleAncestorId) {
      return true;
    }

    return this.isDescendantOf(category.parent.id, possibleAncestorId);
  }

  async remove(id: string, userId: string) {
    const category = await this.prisma.category.findUnique({ where: { id } });

    if (!category) {
      throw new NotFoundException('Categoria não encontrada');
    }

    if (category.isSystem) {
      throw new ForbiddenException('Não é possível remover categorias do sistema');
    }

    if (category.userId !== userId) {
      throw new ForbiddenException('Acesso negado');
    }

    await this.prisma.category.delete({ where: { id } });

    return { message: 'Categoria removida com sucesso' };
  }

  // Subcategorias
  async createSubcategory(userId: string, createSubcategoryDto: CreateSubcategoryDto) {
    const category = await this.prisma.category.findUnique({
      where: { id: createSubcategoryDto.categoryId },
    });

    if (!category) {
      throw new NotFoundException('Categoria não encontrada');
    }

    // Permitir criar subcategoria em categorias do sistema ou próprias
    if (!category.isSystem && category.userId !== userId) {
      throw new ForbiddenException('Você não pode adicionar subcategorias a esta categoria');
    }

    return this.prisma.subcategory.create({
      data: {
        ...createSubcategoryDto,
        userId: category.isSystem ? userId : null, // Se categoria sistema, marcar subcategoria como do usuário
        isSystem: false,
      },
    });
  }

  async findSubcategories(categoryId: string, userId: string) {
    return this.prisma.subcategory.findMany({
      where: {
        categoryId,
        OR: [{ isSystem: true }, { userId }],
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async updateSubcategory(id: string, userId: string, updateData: Partial<CreateSubcategoryDto>) {
    const subcategory = await this.prisma.subcategory.findUnique({ where: { id } });

    if (!subcategory) {
      throw new NotFoundException('Subcategoria não encontrada');
    }

    if (subcategory.isSystem) {
      throw new ForbiddenException('Não é possível editar subcategorias do sistema');
    }

    if (subcategory.userId !== userId) {
      throw new ForbiddenException('Acesso negado');
    }

    return this.prisma.subcategory.update({
      where: { id },
      data: updateData,
    });
  }

  async removeSubcategory(id: string, userId: string) {
    const subcategory = await this.prisma.subcategory.findUnique({ where: { id } });

    if (!subcategory) {
      throw new NotFoundException('Subcategoria não encontrada');
    }

    if (subcategory.isSystem) {
      throw new ForbiddenException('Não é possível remover subcategorias do sistema');
    }

    if (subcategory.userId !== userId) {
      throw new ForbiddenException('Acesso negado');
    }

    await this.prisma.subcategory.delete({ where: { id } });

    return { message: 'Subcategoria removida com sucesso' };
  }
}
