import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(): Promise<{
        id: string;
        email: string;
        phone: string;
        name: string;
        createdAt: Date;
        investorProfile: string;
    }[]>;
    findOne(id: string): Promise<{
        id: string;
        email: string;
        phone: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        investorProfile: string;
    }>;
    update(id: string, updateUserDto: UpdateUserDto): Promise<{
        id: string;
        email: string;
        phone: string;
        name: string;
        updatedAt: Date;
        investorProfile: string;
    }>;
    remove(id: string): Promise<{
        message: string;
    }>;
}
