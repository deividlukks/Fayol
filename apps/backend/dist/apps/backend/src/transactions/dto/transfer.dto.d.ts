import { TransferDto as TransferDtoType } from '@fayol/validation-schemas';
declare const TransferDto_base: import("nestjs-zod").ZodDto<import("zod").ZodObject<{
    fromAccountId: import("zod").ZodString;
    toAccountId: import("zod").ZodString;
    amount: import("zod").ZodNumber;
    description: import("zod").ZodOptional<import("zod").ZodString>;
}, "strip", import("zod").ZodTypeAny, {
    description?: string;
    amount?: number;
    fromAccountId?: string;
    toAccountId?: string;
}, {
    description?: string;
    amount?: number;
    fromAccountId?: string;
    toAccountId?: string;
}>> & {
    io: "input";
};
export declare class TransferDto extends TransferDto_base implements TransferDtoType {
}
export {};
