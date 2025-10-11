"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoriesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let CategoriesService = class CategoriesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(userId, createCategoryDto) {
        if (createCategoryDto.parentId) {
            const parentCategory = await this.prisma.category.findUnique({
                where: { id: createCategoryDto.parentId },
            });
            if (!parentCategory) {
                throw new common_1.NotFoundException('Categoria pai não encontrada');
            }
            if (!parentCategory.isSystem && parentCategory.userId !== userId) {
                throw new common_1.ForbiddenException('Você não pode criar subcategorias nesta categoria');
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
    async findAll(userId) {
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
    async findAllTree(userId) {
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
                                children: true,
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
    async findCategoryWithChildren(categoryId, userId) {
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
            throw new common_1.NotFoundException('Categoria não encontrada');
        }
        if (!category.isSystem && category.userId !== userId) {
            throw new common_1.ForbiddenException('Acesso negado');
        }
        return category;
    }
    async getCategoryPath(categoryId, userId) {
        const category = await this.prisma.category.findUnique({
            where: { id: categoryId },
            include: {
                parent: true,
            },
        });
        if (!category) {
            throw new common_1.NotFoundException('Categoria não encontrada');
        }
        if (!category.isSystem && category.userId !== userId) {
            throw new common_1.ForbiddenException('Acesso negado');
        }
        const path = [category];
        if (category.parent) {
            const parentPath = await this.getCategoryPath(category.parent.id, userId);
            path.unshift(...parentPath);
        }
        return path;
    }
    async findOne(id, userId) {
        const category = await this.prisma.category.findUnique({
            where: { id },
            include: {
                parent: true,
                children: true,
                subcategories: true,
            },
        });
        if (!category) {
            throw new common_1.NotFoundException('Categoria não encontrada');
        }
        if (!category.isSystem && category.userId !== userId) {
            throw new common_1.ForbiddenException('Acesso negado');
        }
        return category;
    }
    async update(id, userId, updateCategoryDto) {
        const category = await this.prisma.category.findUnique({ where: { id } });
        if (!category) {
            throw new common_1.NotFoundException('Categoria não encontrada');
        }
        if (category.isSystem) {
            throw new common_1.ForbiddenException('Não é possível editar categorias do sistema');
        }
        if (category.userId !== userId) {
            throw new common_1.ForbiddenException('Acesso negado');
        }
        if (updateCategoryDto.parentId) {
            if (updateCategoryDto.parentId === id) {
                throw new common_1.ForbiddenException('Uma categoria não pode ser pai de si mesma');
            }
            const isDescendant = await this.isDescendantOf(updateCategoryDto.parentId, id);
            if (isDescendant) {
                throw new common_1.ForbiddenException('Não é possível criar referência circular na hierarquia');
            }
            const parentCategory = await this.prisma.category.findUnique({
                where: { id: updateCategoryDto.parentId },
            });
            if (!parentCategory) {
                throw new common_1.NotFoundException('Categoria pai não encontrada');
            }
            if (!parentCategory.isSystem && parentCategory.userId !== userId) {
                throw new common_1.ForbiddenException('Você não pode mover categoria para esta categoria pai');
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
    async isDescendantOf(categoryId, possibleAncestorId) {
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
    async remove(id, userId) {
        const category = await this.prisma.category.findUnique({ where: { id } });
        if (!category) {
            throw new common_1.NotFoundException('Categoria não encontrada');
        }
        if (category.isSystem) {
            throw new common_1.ForbiddenException('Não é possível remover categorias do sistema');
        }
        if (category.userId !== userId) {
            throw new common_1.ForbiddenException('Acesso negado');
        }
        await this.prisma.category.delete({ where: { id } });
        return { message: 'Categoria removida com sucesso' };
    }
    async createSubcategory(userId, createSubcategoryDto) {
        const category = await this.prisma.category.findUnique({
            where: { id: createSubcategoryDto.categoryId },
        });
        if (!category) {
            throw new common_1.NotFoundException('Categoria não encontrada');
        }
        if (!category.isSystem && category.userId !== userId) {
            throw new common_1.ForbiddenException('Você não pode adicionar subcategorias a esta categoria');
        }
        return this.prisma.subcategory.create({
            data: {
                ...createSubcategoryDto,
                userId: category.isSystem ? userId : null,
                isSystem: false,
            },
        });
    }
    async findSubcategories(categoryId, userId) {
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
    async updateSubcategory(id, userId, updateData) {
        const subcategory = await this.prisma.subcategory.findUnique({ where: { id } });
        if (!subcategory) {
            throw new common_1.NotFoundException('Subcategoria não encontrada');
        }
        if (subcategory.isSystem) {
            throw new common_1.ForbiddenException('Não é possível editar subcategorias do sistema');
        }
        if (subcategory.userId !== userId) {
            throw new common_1.ForbiddenException('Acesso negado');
        }
        return this.prisma.subcategory.update({
            where: { id },
            data: updateData,
        });
    }
    async removeSubcategory(id, userId) {
        const subcategory = await this.prisma.subcategory.findUnique({ where: { id } });
        if (!subcategory) {
            throw new common_1.NotFoundException('Subcategoria não encontrada');
        }
        if (subcategory.isSystem) {
            throw new common_1.ForbiddenException('Não é possível remover subcategorias do sistema');
        }
        if (subcategory.userId !== userId) {
            throw new common_1.ForbiddenException('Acesso negado');
        }
        await this.prisma.subcategory.delete({ where: { id } });
        return { message: 'Subcategoria removida com sucesso' };
    }
};
exports.CategoriesService = CategoriesService;
exports.CategoriesService = CategoriesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CategoriesService);
//# sourceMappingURL=categories.service.js.map