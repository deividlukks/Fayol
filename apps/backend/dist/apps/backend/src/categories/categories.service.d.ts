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
export declare class CategoriesService {
    private prisma;
    constructor(prisma: PrismaService);
    create(userId: string, createCategoryDto: CreateCategoryDto): Promise<{
        parent: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            type: string;
            icon: string | null;
            color: string | null;
            isSystem: boolean;
            userId: string | null;
            parentId: string | null;
        };
        children: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            type: string;
            icon: string | null;
            color: string | null;
            isSystem: boolean;
            userId: string | null;
            parentId: string | null;
        }[];
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        type: string;
        icon: string | null;
        color: string | null;
        isSystem: boolean;
        userId: string | null;
        parentId: string | null;
    }>;
    findAll(userId: string): Promise<({
        subcategories: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            isSystem: boolean;
            userId: string | null;
            categoryId: string;
        }[];
        parent: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            type: string;
            icon: string | null;
            color: string | null;
            isSystem: boolean;
            userId: string | null;
            parentId: string | null;
        };
        children: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            type: string;
            icon: string | null;
            color: string | null;
            isSystem: boolean;
            userId: string | null;
            parentId: string | null;
        }[];
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        type: string;
        icon: string | null;
        color: string | null;
        isSystem: boolean;
        userId: string | null;
        parentId: string | null;
    })[]>;
    findAllTree(userId: string): Promise<({
        subcategories: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            isSystem: boolean;
            userId: string | null;
            categoryId: string;
        }[];
        children: ({
            children: ({
                children: {
                    id: string;
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                    type: string;
                    icon: string | null;
                    color: string | null;
                    isSystem: boolean;
                    userId: string | null;
                    parentId: string | null;
                }[];
            } & {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                type: string;
                icon: string | null;
                color: string | null;
                isSystem: boolean;
                userId: string | null;
                parentId: string | null;
            })[];
        } & {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            type: string;
            icon: string | null;
            color: string | null;
            isSystem: boolean;
            userId: string | null;
            parentId: string | null;
        })[];
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        type: string;
        icon: string | null;
        color: string | null;
        isSystem: boolean;
        userId: string | null;
        parentId: string | null;
    })[]>;
    findCategoryWithChildren(categoryId: string, userId: string): Promise<{
        subcategories: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            isSystem: boolean;
            userId: string | null;
            categoryId: string;
        }[];
        parent: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            type: string;
            icon: string | null;
            color: string | null;
            isSystem: boolean;
            userId: string | null;
            parentId: string | null;
        };
        children: ({
            children: ({
                children: ({
                    children: {
                        id: string;
                        name: string;
                        createdAt: Date;
                        updatedAt: Date;
                        type: string;
                        icon: string | null;
                        color: string | null;
                        isSystem: boolean;
                        userId: string | null;
                        parentId: string | null;
                    }[];
                } & {
                    id: string;
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                    type: string;
                    icon: string | null;
                    color: string | null;
                    isSystem: boolean;
                    userId: string | null;
                    parentId: string | null;
                })[];
            } & {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                type: string;
                icon: string | null;
                color: string | null;
                isSystem: boolean;
                userId: string | null;
                parentId: string | null;
            })[];
        } & {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            type: string;
            icon: string | null;
            color: string | null;
            isSystem: boolean;
            userId: string | null;
            parentId: string | null;
        })[];
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        type: string;
        icon: string | null;
        color: string | null;
        isSystem: boolean;
        userId: string | null;
        parentId: string | null;
    }>;
    getCategoryPath(categoryId: string, userId: string): Promise<any[]>;
    findOne(id: string, userId: string): Promise<{
        subcategories: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            isSystem: boolean;
            userId: string | null;
            categoryId: string;
        }[];
        parent: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            type: string;
            icon: string | null;
            color: string | null;
            isSystem: boolean;
            userId: string | null;
            parentId: string | null;
        };
        children: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            type: string;
            icon: string | null;
            color: string | null;
            isSystem: boolean;
            userId: string | null;
            parentId: string | null;
        }[];
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        type: string;
        icon: string | null;
        color: string | null;
        isSystem: boolean;
        userId: string | null;
        parentId: string | null;
    }>;
    update(id: string, userId: string, updateCategoryDto: Partial<CreateCategoryDto>): Promise<{
        parent: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            type: string;
            icon: string | null;
            color: string | null;
            isSystem: boolean;
            userId: string | null;
            parentId: string | null;
        };
        children: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            type: string;
            icon: string | null;
            color: string | null;
            isSystem: boolean;
            userId: string | null;
            parentId: string | null;
        }[];
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        type: string;
        icon: string | null;
        color: string | null;
        isSystem: boolean;
        userId: string | null;
        parentId: string | null;
    }>;
    private isDescendantOf;
    remove(id: string, userId: string): Promise<{
        message: string;
    }>;
    createSubcategory(userId: string, createSubcategoryDto: CreateSubcategoryDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isSystem: boolean;
        userId: string | null;
        categoryId: string;
    }>;
    findSubcategories(categoryId: string, userId: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isSystem: boolean;
        userId: string | null;
        categoryId: string;
    }[]>;
    updateSubcategory(id: string, userId: string, updateData: Partial<CreateSubcategoryDto>): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isSystem: boolean;
        userId: string | null;
        categoryId: string;
    }>;
    removeSubcategory(id: string, userId: string): Promise<{
        message: string;
    }>;
}
export {};
