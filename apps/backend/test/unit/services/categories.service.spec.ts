import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesService } from '../../../src/modules/categories/services/categories.service';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { LaunchType } from '@fayol/shared-types';
import { mockPrismaFactory, createMockCategory } from '../../utils/test-helpers';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let prisma: ReturnType<typeof mockPrismaFactory>;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
  };

  const mockUser2 = {
    id: 'user-456',
    email: 'other@example.com',
    name: 'Other User',
  };

  beforeEach(async () => {
    // Create mocks
    prisma = mockPrismaFactory();

    // Create testing module
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ==================== CREATE METHOD ====================

  describe('create', () => {
    const createCategoryDto = {
      name: 'Alimentação',
      type: LaunchType.EXPENSE,
      icon: '🍔',
      color: '#FF5733',
      parentId: null as string | null,
    };

    it('should create a category successfully', async () => {
      const mockCategory = createMockCategory({
        ...createCategoryDto,
        userId: mockUser.id,
        isSystemDefault: false,
      });

      prisma.category.create.mockResolvedValue(mockCategory as any);

      const result = await service.create(mockUser.id, createCategoryDto);

      expect(prisma.category.create).toHaveBeenCalledWith({
        data: {
          name: createCategoryDto.name,
          type: createCategoryDto.type,
          icon: createCategoryDto.icon,
          color: createCategoryDto.color,
          isSystemDefault: false,
          parent: undefined,
          user: {
            connect: { id: mockUser.id },
          },
        },
      });
      expect(result).toEqual(mockCategory);
    });

    it('should create category with parentId (subcategory)', async () => {
      const parentId = 'parent-category-123';
      const subcategoryDto = {
        ...createCategoryDto,
        name: 'Restaurantes',
        parentId,
      };

      const mockCategory = createMockCategory({
        ...subcategoryDto,
        userId: mockUser.id,
      });

      prisma.category.create.mockResolvedValue(mockCategory as any);

      const result = await service.create(mockUser.id, subcategoryDto);

      expect(prisma.category.create).toHaveBeenCalledWith({
        data: {
          name: subcategoryDto.name,
          type: subcategoryDto.type,
          icon: subcategoryDto.icon,
          color: subcategoryDto.color,
          isSystemDefault: false,
          parent: { connect: { id: parentId } },
          user: {
            connect: { id: mockUser.id },
          },
        },
      });
      expect(result).toEqual(mockCategory);
    });

    it('should create expense category', async () => {
      const expenseDto = {
        ...createCategoryDto,
        type: LaunchType.EXPENSE,
      };

      const mockCategory = createMockCategory({
        ...expenseDto,
        userId: mockUser.id,
      });

      prisma.category.create.mockResolvedValue(mockCategory as any);

      const result = await service.create(mockUser.id, expenseDto);

      expect(result.type).toBe(LaunchType.EXPENSE);
    });

    it('should create income category', async () => {
      const incomeDto = {
        ...createCategoryDto,
        type: LaunchType.INCOME,
        name: 'Salário',
      };

      const mockCategory = createMockCategory({
        ...incomeDto,
        userId: mockUser.id,
      });

      prisma.category.create.mockResolvedValue(mockCategory as any);

      const result = await service.create(mockUser.id, incomeDto);

      expect(result.type).toBe(LaunchType.INCOME);
    });

    it('should create category without icon', () => {
      const dtoWithoutIcon = {
        name: 'Categoria',
        type: LaunchType.EXPENSE,
        color: '#000000',
        parentId: null,
      };

      const mockCategory = createMockCategory({
        ...dtoWithoutIcon,
        userId: mockUser.id,
        icon: undefined,
      });

      prisma.category.create.mockResolvedValue(mockCategory as any);

      service.create(mockUser.id, dtoWithoutIcon);

      expect(prisma.category.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          icon: undefined,
        }),
      });
    });

    it('should create category without color', async () => {
      const dtoWithoutColor = {
        name: 'Categoria',
        type: LaunchType.EXPENSE,
        icon: '💰',
        parentId: null,
      };

      const mockCategory = createMockCategory({
        ...dtoWithoutColor,
        userId: mockUser.id,
        color: undefined,
      });

      prisma.category.create.mockResolvedValue(mockCategory as any);

      await service.create(mockUser.id, dtoWithoutColor);

      expect(prisma.category.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          color: undefined,
        }),
      });
    });

    it('should always set isSystemDefault to false for user-created categories', async () => {
      const mockCategory = createMockCategory({
        ...createCategoryDto,
        userId: mockUser.id,
        isSystemDefault: false,
      });

      prisma.category.create.mockResolvedValue(mockCategory as any);

      await service.create(mockUser.id, createCategoryDto);

      expect(prisma.category.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          isSystemDefault: false,
        }),
      });
    });
  });

  // ==================== FINDALL METHOD ====================

  describe('findAll', () => {
    it('should return all root categories for user', async () => {
      const mockCategories = [
        createMockCategory({
          id: 'cat-1',
          userId: mockUser.id,
          name: 'Alimentação',
          parentId: null,
          isSystemDefault: false,
          children: [],
        }),
        createMockCategory({
          id: 'cat-2',
          userId: mockUser.id,
          name: 'Transporte',
          parentId: null,
          isSystemDefault: false,
          children: [],
        }),
      ];

      prisma.category.findMany.mockResolvedValue(mockCategories as any);

      const result = await service.findAll(mockUser.id);

      expect(prisma.category.findMany).toHaveBeenCalledWith({
        where: {
          OR: [{ userId: mockUser.id }, { isSystemDefault: true }],
          parentId: null,
        },
        include: {
          children: {
            orderBy: { name: 'asc' },
          },
        },
        orderBy: { name: 'asc' },
      });
      expect(result).toEqual(mockCategories);
      expect(result).toHaveLength(2);
    });

    it('should return only root categories (parentId: null)', async () => {
      const mockCategories = [
        createMockCategory({
          id: 'cat-1',
          parentId: null,
          userId: mockUser.id,
        }),
      ];

      prisma.category.findMany.mockResolvedValue(mockCategories as any);

      await service.findAll(mockUser.id);

      expect(prisma.category.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            parentId: null,
          }),
        })
      );
    });

    it('should include system default categories', async () => {
      const mockCategories = [
        createMockCategory({
          id: 'sys-cat-1',
          userId: null,
          name: 'Sistema - Alimentação',
          isSystemDefault: true,
          parentId: null,
        }),
        createMockCategory({
          id: 'user-cat-1',
          userId: mockUser.id,
          name: 'Minha Categoria',
          isSystemDefault: false,
          parentId: null,
        }),
      ];

      prisma.category.findMany.mockResolvedValue(mockCategories as any);

      const result = await service.findAll(mockUser.id);

      expect(result).toHaveLength(2);
      expect(result.some((cat: any) => cat.isSystemDefault)).toBe(true);
    });

    it('should include children in each root category', async () => {
      const mockCategories = [
        createMockCategory({
          id: 'cat-1',
          userId: mockUser.id,
          name: 'Alimentação',
          parentId: null,
          children: [
            createMockCategory({
              id: 'subcat-1',
              userId: mockUser.id,
              name: 'Restaurantes',
              parentId: 'cat-1',
            }),
            createMockCategory({
              id: 'subcat-2',
              userId: mockUser.id,
              name: 'Supermercado',
              parentId: 'cat-1',
            }),
          ],
        }),
      ];

      prisma.category.findMany.mockResolvedValue(mockCategories as any);

      const result = await service.findAll(mockUser.id);

      expect(result[0].children).toBeDefined();
      expect(result[0].children).toHaveLength(2);
    });

    it('should order categories by name ascending', async () => {
      const mockCategories = [
        createMockCategory({ name: 'A', parentId: null }),
        createMockCategory({ name: 'B', parentId: null }),
      ];

      prisma.category.findMany.mockResolvedValue(mockCategories as any);

      await service.findAll(mockUser.id);

      expect(prisma.category.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { name: 'asc' },
        })
      );
    });

    it('should order children by name ascending', async () => {
      await service.findAll(mockUser.id);

      expect(prisma.category.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: {
            children: {
              orderBy: { name: 'asc' },
            },
          },
        })
      );
    });

    it('should return empty array if user has no categories', async () => {
      prisma.category.findMany.mockResolvedValue([]);

      const result = await service.findAll(mockUser.id);

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should not return categories from other users (unless system default)', async () => {
      const mockCategories = [
        createMockCategory({
          userId: mockUser.id,
          isSystemDefault: false,
        }),
        createMockCategory({
          userId: null,
          isSystemDefault: true,
        }),
      ];

      prisma.category.findMany.mockResolvedValue(mockCategories as any);

      await service.findAll(mockUser.id);

      expect(prisma.category.findMany).toHaveBeenCalledWith({
        where: {
          OR: [{ userId: mockUser.id }, { isSystemDefault: true }],
          parentId: null,
        },
        include: {
          children: {
            orderBy: { name: 'asc' },
          },
        },
        orderBy: { name: 'asc' },
      });
    });

    it('should include categories of different types (INCOME, EXPENSE, TRANSFER)', async () => {
      const mockCategories = [
        createMockCategory({
          type: LaunchType.EXPENSE,
          parentId: null,
        }),
        createMockCategory({
          type: LaunchType.INCOME,
          parentId: null,
        }),
        createMockCategory({
          type: LaunchType.TRANSFER,
          parentId: null,
        }),
      ];

      prisma.category.findMany.mockResolvedValue(mockCategories as any);

      const result = await service.findAll(mockUser.id);

      expect(result).toHaveLength(3);
    });
  });

  // ==================== FINDONE METHOD ====================

  describe('findOne', () => {
    const categoryId = 'category-123';

    it('should return category when found and user is owner', async () => {
      const mockCategory = createMockCategory({
        id: categoryId,
        userId: mockUser.id,
        isSystemDefault: false,
        children: [],
      });

      prisma.category.findUnique.mockResolvedValue(mockCategory as any);

      const result = await service.findOne(categoryId, mockUser.id);

      expect(prisma.category.findUnique).toHaveBeenCalledWith({
        where: { id: categoryId },
        include: { children: true },
      });
      expect(result).toEqual(mockCategory);
    });

    it('should include children in response', async () => {
      const mockCategory = createMockCategory({
        id: categoryId,
        userId: mockUser.id,
        children: [
          createMockCategory({
            id: 'child-1',
            parentId: categoryId,
          }),
        ],
      });

      prisma.category.findUnique.mockResolvedValue(mockCategory as any);

      const result = await service.findOne(categoryId, mockUser.id);

      expect(result.children).toBeDefined();
      expect(result.children).toHaveLength(1);
    });

    it('should throw NotFoundException when category does not exist', async () => {
      prisma.category.findUnique.mockResolvedValue(null);

      await expect(service.findOne(categoryId, mockUser.id)).rejects.toThrow(
        NotFoundException
      );

      await expect(service.findOne(categoryId, mockUser.id)).rejects.toThrow(
        'Categoria não encontrada.'
      );
    });

    it('should throw ForbiddenException when user is not owner and category is not system default', async () => {
      const mockCategory = createMockCategory({
        id: categoryId,
        userId: mockUser2.id, // Different user
        isSystemDefault: false,
      });

      prisma.category.findUnique.mockResolvedValue(mockCategory as any);

      await expect(service.findOne(categoryId, mockUser.id)).rejects.toThrow(
        ForbiddenException
      );

      await expect(service.findOne(categoryId, mockUser.id)).rejects.toThrow(
        'Acesso negado a esta categoria.'
      );
    });

    it('should allow access to system default categories regardless of userId', async () => {
      const mockCategory = createMockCategory({
        id: categoryId,
        userId: null,
        isSystemDefault: true,
      });

      prisma.category.findUnique.mockResolvedValue(mockCategory as any);

      const result = await service.findOne(categoryId, mockUser.id);

      expect(result).toEqual(mockCategory);
      // Should not throw ForbiddenException
    });

    it('should allow user to access their own category', async () => {
      const mockCategory = createMockCategory({
        id: categoryId,
        userId: mockUser.id,
        isSystemDefault: false,
      });

      prisma.category.findUnique.mockResolvedValue(mockCategory as any);

      const result = await service.findOne(categoryId, mockUser.id);

      expect(result).toEqual(mockCategory);
    });

    it('should return category with all fields', async () => {
      const mockCategory = createMockCategory({
        id: categoryId,
        userId: mockUser.id,
        name: 'Alimentação',
        type: LaunchType.EXPENSE,
        icon: '🍔',
        color: '#FF5733',
        parentId: null,
        isSystemDefault: false,
        children: [],
      });

      prisma.category.findUnique.mockResolvedValue(mockCategory as any);

      const result = await service.findOne(categoryId, mockUser.id);

      expect(result.id).toBe(categoryId);
      expect(result.userId).toBe(mockUser.id);
      expect(result.name).toBe('Alimentação');
      expect(result.type).toBe(LaunchType.EXPENSE);
      expect(result.icon).toBe('🍔');
      expect(result.color).toBe('#FF5733');
    });

    it('should handle category without children', async () => {
      const mockCategory = createMockCategory({
        id: categoryId,
        userId: mockUser.id,
        children: [],
      });

      prisma.category.findUnique.mockResolvedValue(mockCategory as any);

      const result = await service.findOne(categoryId, mockUser.id);

      expect(result.children).toEqual([]);
    });
  });

  // ==================== UPDATE METHOD ====================

  describe('update', () => {
    const categoryId = 'category-123';
    const updateDto = {
      name: 'Alimentação Atualizada',
      icon: '🍕',
      color: '#00FF00',
    };

    it('should update category successfully when user is owner', async () => {
      const mockCategory = createMockCategory({
        id: categoryId,
        userId: mockUser.id,
        isSystemDefault: false,
      });

      const updatedCategory = createMockCategory({
        ...mockCategory,
        ...updateDto,
      });

      prisma.category.findUnique.mockResolvedValue(mockCategory as any);
      prisma.category.update.mockResolvedValue(updatedCategory as any);

      const result = await service.update(categoryId, mockUser.id, updateDto);

      expect(prisma.category.update).toHaveBeenCalledWith({
        where: { id: categoryId },
        data: updateDto,
      });
      expect(result.name).toBe(updateDto.name);
      expect(result.icon).toBe(updateDto.icon);
    });

    it('should call findOne to verify ownership before updating', async () => {
      const mockCategory = createMockCategory({
        id: categoryId,
        userId: mockUser.id,
        isSystemDefault: false,
      });

      prisma.category.findUnique.mockResolvedValue(mockCategory as any);
      prisma.category.update.mockResolvedValue(mockCategory as any);

      await service.update(categoryId, mockUser.id, updateDto);

      expect(prisma.category.findUnique).toHaveBeenCalledWith({
        where: { id: categoryId },
        include: { children: true },
      });
    });

    it('should throw ForbiddenException when trying to update system default category', async () => {
      const mockCategory = createMockCategory({
        id: categoryId,
        userId: null,
        isSystemDefault: true,
      });

      prisma.category.findUnique.mockResolvedValue(mockCategory as any);

      await expect(service.update(categoryId, mockUser.id, updateDto)).rejects.toThrow(
        ForbiddenException
      );

      await expect(service.update(categoryId, mockUser.id, updateDto)).rejects.toThrow(
        'Não é possível editar categorias padrão do sistema.'
      );

      expect(prisma.category.update).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException when user is not owner', async () => {
      const mockCategory = createMockCategory({
        id: categoryId,
        userId: mockUser2.id, // Different user
        isSystemDefault: false,
      });

      prisma.category.findUnique.mockResolvedValue(mockCategory as any);

      await expect(service.update(categoryId, mockUser.id, updateDto)).rejects.toThrow(
        ForbiddenException
      );

      expect(prisma.category.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when category does not exist', async () => {
      prisma.category.findUnique.mockResolvedValue(null);

      await expect(service.update(categoryId, mockUser.id, updateDto)).rejects.toThrow(
        NotFoundException
      );

      expect(prisma.category.update).not.toHaveBeenCalled();
    });

    it('should allow updating only name', async () => {
      const mockCategory = createMockCategory({
        id: categoryId,
        userId: mockUser.id,
        isSystemDefault: false,
      });

      const partialUpdateDto = { name: 'Novo Nome' };

      prisma.category.findUnique.mockResolvedValue(mockCategory as any);
      prisma.category.update.mockResolvedValue({
        ...mockCategory,
        name: 'Novo Nome',
      } as any);

      const result = await service.update(categoryId, mockUser.id, partialUpdateDto);

      expect(prisma.category.update).toHaveBeenCalledWith({
        where: { id: categoryId },
        data: partialUpdateDto,
      });
      expect(result.name).toBe('Novo Nome');
    });

    it('should allow updating only icon', async () => {
      const mockCategory = createMockCategory({
        id: categoryId,
        userId: mockUser.id,
        isSystemDefault: false,
      });

      const partialUpdateDto = { icon: '🎯' };

      prisma.category.findUnique.mockResolvedValue(mockCategory as any);
      prisma.category.update.mockResolvedValue({
        ...mockCategory,
        ...partialUpdateDto,
      } as any);

      await service.update(categoryId, mockUser.id, partialUpdateDto);

      expect(prisma.category.update).toHaveBeenCalledWith({
        where: { id: categoryId },
        data: partialUpdateDto,
      });
    });

    it('should allow updating only color', async () => {
      const mockCategory = createMockCategory({
        id: categoryId,
        userId: mockUser.id,
        isSystemDefault: false,
      });

      const partialUpdateDto = { color: '#FF00FF' };

      prisma.category.findUnique.mockResolvedValue(mockCategory as any);
      prisma.category.update.mockResolvedValue({
        ...mockCategory,
        ...partialUpdateDto,
      } as any);

      await service.update(categoryId, mockUser.id, partialUpdateDto);

      expect(prisma.category.update).toHaveBeenCalledWith({
        where: { id: categoryId },
        data: partialUpdateDto,
      });
    });

    it('should allow updating multiple fields at once', async () => {
      const mockCategory = createMockCategory({
        id: categoryId,
        userId: mockUser.id,
        isSystemDefault: false,
      });

      const multiFieldUpdate = {
        name: 'Multi Update',
        icon: '✨',
        color: '#ABCDEF',
      };

      prisma.category.findUnique.mockResolvedValue(mockCategory as any);
      prisma.category.update.mockResolvedValue({
        ...mockCategory,
        ...multiFieldUpdate,
      } as any);

      const result = await service.update(categoryId, mockUser.id, multiFieldUpdate);

      expect(result.name).toBe(multiFieldUpdate.name);
      expect(result.icon).toBe(multiFieldUpdate.icon);
      expect(result.color).toBe(multiFieldUpdate.color);
    });

    it('should preserve fields that are not being updated', async () => {
      const mockCategory = createMockCategory({
        id: categoryId,
        userId: mockUser.id,
        name: 'Original Name',
        type: LaunchType.EXPENSE,
        icon: '💰',
        color: '#000000',
        isSystemDefault: false,
      });

      const partialUpdate = { name: 'New Name' };

      prisma.category.findUnique.mockResolvedValue(mockCategory as any);
      prisma.category.update.mockResolvedValue({
        ...mockCategory,
        name: 'New Name',
      } as any);

      const result = await service.update(categoryId, mockUser.id, partialUpdate);

      // Type should remain unchanged
      expect(result.type).toBe(LaunchType.EXPENSE);
    });
  });

  // ==================== REMOVE METHOD ====================

  describe('remove', () => {
    const categoryId = 'category-123';

    it('should delete category successfully when user is owner', async () => {
      const mockCategory = createMockCategory({
        id: categoryId,
        userId: mockUser.id,
        isSystemDefault: false,
      });

      prisma.category.findUnique.mockResolvedValue(mockCategory as any);
      prisma.category.delete.mockResolvedValue(mockCategory as any);

      const result = await service.remove(categoryId, mockUser.id);

      expect(prisma.category.delete).toHaveBeenCalledWith({
        where: { id: categoryId },
      });
      expect(result).toEqual(mockCategory);
    });

    it('should call findOne to verify ownership before deleting', async () => {
      const mockCategory = createMockCategory({
        id: categoryId,
        userId: mockUser.id,
        isSystemDefault: false,
      });

      prisma.category.findUnique.mockResolvedValue(mockCategory as any);
      prisma.category.delete.mockResolvedValue(mockCategory as any);

      await service.remove(categoryId, mockUser.id);

      expect(prisma.category.findUnique).toHaveBeenCalledWith({
        where: { id: categoryId },
        include: { children: true },
      });
    });

    it('should throw ForbiddenException when trying to delete system default category', async () => {
      const mockCategory = createMockCategory({
        id: categoryId,
        userId: null,
        isSystemDefault: true,
      });

      prisma.category.findUnique.mockResolvedValue(mockCategory as any);

      await expect(service.remove(categoryId, mockUser.id)).rejects.toThrow(
        ForbiddenException
      );

      await expect(service.remove(categoryId, mockUser.id)).rejects.toThrow(
        'Não é possível excluir categorias padrão do sistema.'
      );

      expect(prisma.category.delete).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException when user is not owner', async () => {
      const mockCategory = createMockCategory({
        id: categoryId,
        userId: mockUser2.id, // Different user
        isSystemDefault: false,
      });

      prisma.category.findUnique.mockResolvedValue(mockCategory as any);

      await expect(service.remove(categoryId, mockUser.id)).rejects.toThrow(
        ForbiddenException
      );

      expect(prisma.category.delete).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when category does not exist', async () => {
      prisma.category.findUnique.mockResolvedValue(null);

      await expect(service.remove(categoryId, mockUser.id)).rejects.toThrow(
        NotFoundException
      );

      expect(prisma.category.delete).not.toHaveBeenCalled();
    });

    it('should successfully delete expense category', async () => {
      const mockCategory = createMockCategory({
        id: categoryId,
        userId: mockUser.id,
        type: LaunchType.EXPENSE,
        isSystemDefault: false,
      });

      prisma.category.findUnique.mockResolvedValue(mockCategory as any);
      prisma.category.delete.mockResolvedValue(mockCategory as any);

      const result = await service.remove(categoryId, mockUser.id);

      expect(result.type).toBe(LaunchType.EXPENSE);
    });

    it('should successfully delete income category', async () => {
      const mockCategory = createMockCategory({
        id: categoryId,
        userId: mockUser.id,
        type: LaunchType.INCOME,
        isSystemDefault: false,
      });

      prisma.category.findUnique.mockResolvedValue(mockCategory as any);
      prisma.category.delete.mockResolvedValue(mockCategory as any);

      const result = await service.remove(categoryId, mockUser.id);

      expect(result.type).toBe(LaunchType.INCOME);
    });

    it('should successfully delete parent category', async () => {
      const mockCategory = createMockCategory({
        id: categoryId,
        userId: mockUser.id,
        parentId: null,
        isSystemDefault: false,
        children: [],
      });

      prisma.category.findUnique.mockResolvedValue(mockCategory as any);
      prisma.category.delete.mockResolvedValue(mockCategory as any);

      await service.remove(categoryId, mockUser.id);

      expect(prisma.category.delete).toHaveBeenCalled();
    });

    it('should successfully delete subcategory', async () => {
      const mockCategory = createMockCategory({
        id: categoryId,
        userId: mockUser.id,
        parentId: 'parent-123',
        isSystemDefault: false,
      });

      prisma.category.findUnique.mockResolvedValue(mockCategory as any);
      prisma.category.delete.mockResolvedValue(mockCategory as any);

      await service.remove(categoryId, mockUser.id);

      expect(prisma.category.delete).toHaveBeenCalled();
    });

    it('should return deleted category data', async () => {
      const mockCategory = createMockCategory({
        id: categoryId,
        userId: mockUser.id,
        name: 'Categoria Deletada',
        isSystemDefault: false,
      });

      prisma.category.findUnique.mockResolvedValue(mockCategory as any);
      prisma.category.delete.mockResolvedValue(mockCategory as any);

      const result = await service.remove(categoryId, mockUser.id);

      expect(result.id).toBe(categoryId);
      expect(result.name).toBe('Categoria Deletada');
    });
  });
});
