import { UpdateRecurringTransactionDto as UpdateRecurringTransactionDtoType } from '@fayol/validation-schemas';
declare const UpdateRecurringTransactionDto_base: import("nestjs-zod").ZodDto<import("zod").ZodObject<{
    accountId: import("zod").ZodOptional<import("zod").ZodString>;
    categoryId: import("zod").ZodOptional<import("zod").ZodString>;
    type: import("zod").ZodOptional<import("zod").ZodEnum<["INCOME", "EXPENSE", "TRANSFER"]>>;
    amount: import("zod").ZodOptional<import("zod").ZodNumber>;
    description: import("zod").ZodOptional<import("zod").ZodString>;
    frequency: import("zod").ZodOptional<import("zod").ZodEnum<["DAILY", "WEEKLY", "BIWEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"]>>;
    startDate: import("zod").ZodOptional<import("zod").ZodDate>;
    endDate: import("zod").ZodOptional<import("zod").ZodOptional<import("zod").ZodDate>>;
    isActive: import("zod").ZodOptional<import("zod").ZodDefault<import("zod").ZodBoolean>>;
    notes: import("zod").ZodOptional<import("zod").ZodOptional<import("zod").ZodString>>;
}, "strip", import("zod").ZodTypeAny, {
    isActive?: boolean;
    type?: "INCOME" | "EXPENSE" | "TRANSFER";
    categoryId?: string;
    description?: string;
    frequency?: "DAILY" | "WEEKLY" | "BIWEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY";
    accountId?: string;
    amount?: number;
    startDate?: Date;
    endDate?: Date;
    notes?: string;
}, {
    isActive?: boolean;
    type?: "INCOME" | "EXPENSE" | "TRANSFER";
    categoryId?: string;
    description?: string;
    frequency?: "DAILY" | "WEEKLY" | "BIWEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY";
    accountId?: string;
    amount?: number;
    startDate?: Date;
    endDate?: Date;
    notes?: string;
}>> & {
    io: "input";
};
export declare class UpdateRecurringTransactionDto extends UpdateRecurringTransactionDto_base implements UpdateRecurringTransactionDtoType {
}
export {};
