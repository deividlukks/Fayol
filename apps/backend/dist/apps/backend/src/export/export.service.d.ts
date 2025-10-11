import { PrismaService } from '../prisma/prisma.service';
export declare class ExportService {
    private prisma;
    constructor(prisma: PrismaService);
    exportToCsv(userId: string, startDate?: string, endDate?: string): Promise<{
        filename: string;
        content: string;
        mimeType: string;
    }>;
    exportFullBackup(userId: string): Promise<{
        filename: string;
        content: string;
        mimeType: string;
    }>;
}
