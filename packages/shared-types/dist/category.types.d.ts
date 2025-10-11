import { TransactionType } from './transaction.types';
export interface Category {
    id: string;
    userId: string;
    name: string;
    type: TransactionType;
    color?: string;
    icon?: string;
    isDefault: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface CreateCategoryInput {
    name: string;
    type: TransactionType;
    color?: string;
    icon?: string;
}
export interface UpdateCategoryInput {
    name?: string;
    color?: string;
    icon?: string;
}
export interface CategorySummary {
    id: string;
    name: string;
    type: TransactionType;
    totalAmount: number;
    transactionCount: number;
    color?: string;
    icon?: string;
}
