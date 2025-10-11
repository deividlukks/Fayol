import { PrismaClient } from '@prisma/client';
export declare function cleanDatabase(prisma: PrismaClient): Promise<void>;
export declare function wait(ms: number): Promise<void>;
export declare function generateTestEmail(): string;
export declare function generateTestPhone(): string;
export declare function createTestUserData(overrides?: Partial<{
    name: string;
    email: string;
    phone: string;
    password: string;
}>): {
    name: string;
    email: string;
    phone: string;
    password: string;
};
export declare function createTestAccountData(overrides?: Partial<{
    name: string;
    type: string;
    initialBalance: number;
}>): {
    name: string;
    type: string;
    initialBalance: number;
};
export declare function createTestCategoryData(overrides?: Partial<{
    name: string;
    type: string;
}>): {
    name: string;
    type: string;
};
export declare function createTestTransactionData(accountId: string, categoryId: string, overrides?: Partial<{
    movementType: string;
    launchType: string;
    amount: number;
    description: string;
    dueDate: Date;
    isRecurring: boolean;
}>): {
    accountId: string;
    categoryId: string;
    movementType: string;
    launchType: string;
    amount: number;
    description: string;
    dueDate: Date;
    isRecurring: boolean;
};
