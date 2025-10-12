import { z } from 'zod';
export declare const frequencyEnum: z.ZodEnum<["DAILY", "WEEKLY", "BIWEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"]>;
export type Frequency = z.infer<typeof frequencyEnum>;
export declare const createRecurringTransactionSchema: z.ZodObject<{
    accountId: z.ZodString;
    categoryId: z.ZodString;
    type: z.ZodEnum<["INCOME", "EXPENSE", "TRANSFER"]>;
    amount: z.ZodNumber;
    description: z.ZodString;
    frequency: z.ZodEnum<["DAILY", "WEEKLY", "BIWEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"]>;
    startDate: z.ZodDate;
    endDate: z.ZodOptional<z.ZodDate>;
    isActive: z.ZodDefault<z.ZodBoolean>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    description?: string;
    frequency?: "DAILY" | "WEEKLY" | "BIWEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY";
    type?: "INCOME" | "EXPENSE" | "TRANSFER";
    isActive?: boolean;
    categoryId?: string;
    accountId?: string;
    amount?: number;
    startDate?: Date;
    endDate?: Date;
    notes?: string;
}, {
    description?: string;
    frequency?: "DAILY" | "WEEKLY" | "BIWEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY";
    type?: "INCOME" | "EXPENSE" | "TRANSFER";
    isActive?: boolean;
    categoryId?: string;
    accountId?: string;
    amount?: number;
    startDate?: Date;
    endDate?: Date;
    notes?: string;
}>;
export type CreateRecurringTransactionDto = z.infer<typeof createRecurringTransactionSchema>;
export declare const updateRecurringTransactionSchema: z.ZodObject<{
    accountId: z.ZodOptional<z.ZodString>;
    categoryId: z.ZodOptional<z.ZodString>;
    type: z.ZodOptional<z.ZodEnum<["INCOME", "EXPENSE", "TRANSFER"]>>;
    amount: z.ZodOptional<z.ZodNumber>;
    description: z.ZodOptional<z.ZodString>;
    frequency: z.ZodOptional<z.ZodEnum<["DAILY", "WEEKLY", "BIWEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"]>>;
    startDate: z.ZodOptional<z.ZodDate>;
    endDate: z.ZodOptional<z.ZodOptional<z.ZodDate>>;
    isActive: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
    notes: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    description?: string;
    frequency?: "DAILY" | "WEEKLY" | "BIWEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY";
    type?: "INCOME" | "EXPENSE" | "TRANSFER";
    isActive?: boolean;
    categoryId?: string;
    accountId?: string;
    amount?: number;
    startDate?: Date;
    endDate?: Date;
    notes?: string;
}, {
    description?: string;
    frequency?: "DAILY" | "WEEKLY" | "BIWEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY";
    type?: "INCOME" | "EXPENSE" | "TRANSFER";
    isActive?: boolean;
    categoryId?: string;
    accountId?: string;
    amount?: number;
    startDate?: Date;
    endDate?: Date;
    notes?: string;
}>;
export type UpdateRecurringTransactionDto = z.infer<typeof updateRecurringTransactionSchema>;
export declare const toggleRecurringTransactionSchema: z.ZodObject<{
    isActive: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    isActive?: boolean;
}, {
    isActive?: boolean;
}>;
export type ToggleRecurringTransactionDto = z.infer<typeof toggleRecurringTransactionSchema>;
