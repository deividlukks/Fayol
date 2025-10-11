import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getProfile(user: any): Promise<{
        id: string;
        email: string;
        phone: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        investorProfile: string;
    }>;
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
