import { CreateRecurringTransactionDto as CreateRecurringTransactionDtoType } from '@fayol/validation-schemas';
declare const CreateRecurringTransactionDto_base: import("nestjs-zod").ZodDto<import("zod").ZodObject<{
    accountId: import("zod").ZodString;
    categoryId: import("zod").ZodString;
    type: import("zod").ZodEnum<["INCOME", "EXPENSE", "TRANSFER"]>;
    amount: import("zod").ZodNumber;
    description: import("zod").ZodString;
    frequency: import("zod").ZodEnum<["DAILY", "WEEKLY", "BIWEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"]>;
    startDate: import("zod").ZodDate;
    endDate: import("zod").ZodOptional<import("zod").ZodDate>;
    isActive: import("zod").ZodDefault<import("zod").ZodBoolean>;
    notes: import("zod").ZodOptional<import("zod").ZodString>;
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
export declare class CreateRecurringTransactionDto extends CreateRecurringTransactionDto_base implements CreateRecurringTransactionDtoType {
}
export {};
