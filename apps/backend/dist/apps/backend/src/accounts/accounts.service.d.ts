import { PrismaService } from '../prisma/prisma.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
export declare class AccountsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(userId: string, createAccountDto: CreateAccountDto): Promise<{
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
    findAll(userId: string): Promise<{
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
    findOne(id: string, userId: string): Promise<{
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
    update(id: string, userId: string, updateAccountDto: UpdateAccountDto): Promise<{
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
    remove(id: string, userId: string): Promise<{
        message: string;
    }>;
}
