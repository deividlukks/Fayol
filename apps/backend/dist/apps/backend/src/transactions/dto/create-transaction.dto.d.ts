export declare class CreateTransactionDto {
    accountId: string;
    movementType: string;
    launchType: string;
    categoryId: string;
    subcategoryId?: string;
    amount: number;
    description?: string;
    dueDate?: string;
    receiptDate?: string;
    effectiveDate?: string;
    isRecurring?: boolean;
    recurrencePeriod?: string;
    transferId?: string;
}
