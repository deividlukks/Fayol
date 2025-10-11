import { z } from 'zod';
export declare const accountTypeEnum: z.ZodEnum<["checking", "savings", "investment", "credit"]>;
export type AccountType = z.infer<typeof accountTypeEnum>;
export declare const createAccountSchema: z.ZodObject<{
    name: z.ZodString;
    type: z.ZodEnum<["checking", "savings", "investment", "credit"]>;
    balance: z.ZodDefault<z.ZodNumber>;
    institution: z.ZodOptional<z.ZodString>;
    accountNumber: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: "checking" | "savings" | "investment" | "credit";
    name: string;
    balance: number;
    institution?: string | undefined;
    accountNumber?: string | undefined;
    description?: string | undefined;
}, {
    type: "checking" | "savings" | "investment" | "credit";
    name: string;
    balance?: number | undefined;
    institution?: string | undefined;
    accountNumber?: string | undefined;
    description?: string | undefined;
}>;
export type CreateAccountDto = z.infer<typeof createAccountSchema>;
export declare const updateAccountSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    type: z.ZodOptional<z.ZodEnum<["checking", "savings", "investment", "credit"]>>;
    balance: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    institution: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    accountNumber: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    type?: "checking" | "savings" | "investment" | "credit" | undefined;
    name?: string | undefined;
    balance?: number | undefined;
    institution?: string | undefined;
    accountNumber?: string | undefined;
    description?: string | undefined;
}, {
    type?: "checking" | "savings" | "investment" | "credit" | undefined;
    name?: string | undefined;
    balance?: number | undefined;
    institution?: string | undefined;
    accountNumber?: string | undefined;
    description?: string | undefined;
}>;
export type UpdateAccountDto = z.infer<typeof updateAccountSchema>;
export declare const transferSchema: z.ZodObject<{
    fromAccountId: z.ZodString;
    toAccountId: z.ZodString;
    amount: z.ZodNumber;
    description: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    fromAccountId: string;
    toAccountId: string;
    amount: number;
    description?: string | undefined;
}, {
    fromAccountId: string;
    toAccountId: string;
    amount: number;
    description?: string | undefined;
}>;
export type TransferDto = z.infer<typeof transferSchema>;
//# sourceMappingURL=account.schema.d.ts.map