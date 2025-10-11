import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
export declare class AccountsController {
    private readonly accountsService;
    constructor(accountsService: AccountsService);
    create(user: any, createAccountDto: CreateAccountDto): Promise<{
        id: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        type: string;
        userId: string;
        initialBalance: import("@prisma/client/runtime/library").Decimal;
        currency: string;
    }>;
    findAll(user: any): Promise<{
        id: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        type: string;
        userId: string;
        initialBalance: import("@prisma/client/runtime/library").Decimal;
        currency: string;
    }[]>;
    findOne(id: string, user: any): Promise<{
        id: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        type: string;
        userId: string;
        initialBalance: import("@prisma/client/runtime/library").Decimal;
        currency: string;
    }>;
    update(id: string, user: any, updateAccountDto: UpdateAccountDto): Promise<{
        id: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        type: string;
        userId: string;
        initialBalance: import("@prisma/client/runtime/library").Decimal;
        currency: string;
    }>;
    remove(id: string, user: any): Promise<{
        message: string;
    }>;
}
