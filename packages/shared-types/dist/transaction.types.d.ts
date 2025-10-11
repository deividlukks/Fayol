export declare enum TransactionType {
    INCOME = "INCOME",
    EXPENSE = "EXPENSE"
}
export declare enum RecurrenceType {
    NONE = "NONE",
    DAILY = "DAILY",
    WEEKLY = "WEEKLY",
    MONTHLY = "MONTHLY",
    YEARLY = "YEARLY"
}
export interface Transaction {
    id: string;
    userId: string;
    accountId: string;
    categoryId: string;
    type: TransactionType;
    amount: number;
    description: string;
    date: Date;
    isRecurring: boolean;
    recurrenceType?: RecurrenceType;
    recurrenceEndDate?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export interface CreateTransactionInput {
    accountId: string;
    categoryId: string;
    type: TransactionType;
    amount: number;
    description: string;
    date: Date | string;
    isRecurring?: boolean;
    recurrenceType?: RecurrenceType;
    recurrenceEndDate?: Date | string;
}
export interface UpdateTransactionInput {
    accountId?: string;
    categoryId?: string;
    type?: TransactionType;
    amount?: number;
    description?: string;
    date?: Date | string;
    isRecurring?: boolean;
    recurrenceType?: RecurrenceType;
    recurrenceEndDate?: Date | string;
}
export interface TransactionFilters {
    type?: TransactionType;
    accountId?: string;
    categoryId?: string;
    startDate?: Date | string;
    endDate?: Date | string;
    minAmount?: number;
    maxAmount?: number;
    search?: string;
}
export interface TransactionSummary {
    totalIncome: number;
    totalExpense: number;
    balance: number;
    transactionCount: number;
}
