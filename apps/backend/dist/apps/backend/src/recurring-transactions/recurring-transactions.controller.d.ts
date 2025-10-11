import { RecurringTransactionsService } from './recurring-transactions.service';
import { CreateRecurringTransactionDto } from './dto/create-recurring-transaction.dto';
import { UpdateRecurringTransactionDto } from './dto/update-recurring-transaction.dto';
export declare class RecurringTransactionsController {
    private readonly recurringTransactionsService;
    constructor(recurringTransactionsService: RecurringTransactionsService);
    create(req: any, dto: CreateRecurringTransactionDto): Promise<{
        category: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            type: string;
            icon: string | null;
            color: string | null;
            isSystem: boolean;
            userId: string | null;
            parentId: string | null;
        };
        account: {
            id: string;
            name: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            type: string;
            userId: string;
            initialBalance: import("@prisma/client/runtime/library").Decimal;
            currency: string;
        };
    } & {
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        type: string;
        userId: string;
        categoryId: string;
        description: string;
        frequency: string;
        accountId: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        startDate: Date;
        endDate: Date | null;
        notes: string | null;
        nextDate: Date;
    }>;
    findAll(req: any): Promise<({
        category: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            type: string;
            icon: string | null;
            color: string | null;
            isSystem: boolean;
            userId: string | null;
            parentId: string | null;
        };
        account: {
            id: string;
            name: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            type: string;
            userId: string;
            initialBalance: import("@prisma/client/runtime/library").Decimal;
            currency: string;
        };
    } & {
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        type: string;
        userId: string;
        categoryId: string;
        description: string;
        frequency: string;
        accountId: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        startDate: Date;
        endDate: Date | null;
        notes: string | null;
        nextDate: Date;
    })[]>;
    findOne(req: any, id: string): Promise<{
        category: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            type: string;
            icon: string | null;
            color: string | null;
            isSystem: boolean;
            userId: string | null;
            parentId: string | null;
        };
        account: {
            id: string;
            name: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            type: string;
            userId: string;
            initialBalance: import("@prisma/client/runtime/library").Decimal;
            currency: string;
        };
    } & {
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        type: string;
        userId: string;
        categoryId: string;
        description: string;
        frequency: string;
        accountId: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        startDate: Date;
        endDate: Date | null;
        notes: string | null;
        nextDate: Date;
    }>;
    update(req: any, id: string, dto: UpdateRecurringTransactionDto): Promise<{
        category: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            type: string;
            icon: string | null;
            color: string | null;
            isSystem: boolean;
            userId: string | null;
            parentId: string | null;
        };
        account: {
            id: string;
            name: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            type: string;
            userId: string;
            initialBalance: import("@prisma/client/runtime/library").Decimal;
            currency: string;
        };
    } & {
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        type: string;
        userId: string;
        categoryId: string;
        description: string;
        frequency: string;
        accountId: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        startDate: Date;
        endDate: Date | null;
        notes: string | null;
        nextDate: Date;
    }>;
    remove(req: any, id: string): Promise<{
        message: string;
    }>;
    pause(req: any, id: string): Promise<{
        category: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            type: string;
            icon: string | null;
            color: string | null;
            isSystem: boolean;
            userId: string | null;
            parentId: string | null;
        };
        account: {
            id: string;
            name: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            type: string;
            userId: string;
            initialBalance: import("@prisma/client/runtime/library").Decimal;
            currency: string;
        };
    } & {
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        type: string;
        userId: string;
        categoryId: string;
        description: string;
        frequency: string;
        accountId: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        startDate: Date;
        endDate: Date | null;
        notes: string | null;
        nextDate: Date;
    }>;
    resume(req: any, id: string): Promise<{
        category: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            type: string;
            icon: string | null;
            color: string | null;
            isSystem: boolean;
            userId: string | null;
            parentId: string | null;
        };
        account: {
            id: string;
            name: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            type: string;
            userId: string;
            initialBalance: import("@prisma/client/runtime/library").Decimal;
            currency: string;
        };
    } & {
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        type: string;
        userId: string;
        categoryId: string;
        description: string;
        frequency: string;
        accountId: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        startDate: Date;
        endDate: Date | null;
        notes: string | null;
        nextDate: Date;
    }>;
}
