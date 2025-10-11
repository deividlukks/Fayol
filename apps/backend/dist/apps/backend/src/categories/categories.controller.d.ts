import { CategoriesService } from './categories.service';
export declare class CategoriesController {
    private readonly categoriesService;
    constructor(categoriesService: CategoriesService);
    create(user: any, createCategoryDto: any): Promise<{
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
    findAll(user: any): Promise<({
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
    findAllTree(user: any): Promise<({
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
    findOne(id: string, user: any): Promise<{
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
    findWithChildren(id: string, user: any): Promise<{
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
    getCategoryPath(id: string, user: any): Promise<any[]>;
    update(id: string, user: any, updateCategoryDto: any): Promise<{
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
    remove(id: string, user: any): Promise<{
        message: string;
    }>;
    createSubcategory(user: any, createSubcategoryDto: any): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isSystem: boolean;
        userId: string | null;
        categoryId: string;
    }>;
    findSubcategories(id: string, user: any): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isSystem: boolean;
        userId: string | null;
        categoryId: string;
    }[]>;
    updateSubcategory(id: string, user: any, updateData: any): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isSystem: boolean;
        userId: string | null;
        categoryId: string;
    }>;
    removeSubcategory(id: string, user: any): Promise<{
        message: string;
    }>;
}
