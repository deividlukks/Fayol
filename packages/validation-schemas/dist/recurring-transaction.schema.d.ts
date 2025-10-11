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
    type: "INCOME" | "EXPENSE" | "TRANSFER";
    description: string;
    amount: number;
    accountId: string;
    categoryId: string;
    startDate: Date;
    frequency: "DAILY" | "WEEKLY" | "BIWEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY";
    isActive: boolean;
    notes?: string | undefined;
    endDate?: Date | undefined;
}, {
    type: "INCOME" | "EXPENSE" | "TRANSFER";
    description: string;
    amount: number;
    accountId: string;
    categoryId: string;
    startDate: Date;
    frequency: "DAILY" | "WEEKLY" | "BIWEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY";
    notes?: string | undefined;
    endDate?: Date | undefined;
    isActive?: boolean | undefined;
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
    type?: "INCOME" | "EXPENSE" | "TRANSFER" | undefined;
    description?: string | undefined;
    amount?: number | undefined;
    accountId?: string | undefined;
    categoryId?: string | undefined;
    notes?: string | undefined;
    startDate?: Date | undefined;
    endDate?: Date | undefined;
    frequency?: "DAILY" | "WEEKLY" | "BIWEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY" | undefined;
    isActive?: boolean | undefined;
}, {
    type?: "INCOME" | "EXPENSE" | "TRANSFER" | undefined;
    description?: string | undefined;
    amount?: number | undefined;
    accountId?: string | undefined;
    categoryId?: string | undefined;
    notes?: string | undefined;
    startDate?: Date | undefined;
    endDate?: Date | undefined;
    frequency?: "DAILY" | "WEEKLY" | "BIWEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY" | undefined;
    isActive?: boolean | undefined;
}>;
export type UpdateRecurringTransactionDto = z.infer<typeof updateRecurringTransactionSchema>;
export declare const toggleRecurringTransactionSchema: z.ZodObject<{
    isActive: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    isActive: boolean;
}, {
    isActive: boolean;
}>;
export type ToggleRecurringTransactionDto = z.infer<typeof toggleRecurringTransactionSchema>;
//# sourceMappingURL=recurring-transaction.schema.d.ts.map