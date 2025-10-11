import { ExportService } from './export.service';
export declare class ExportController {
    private readonly exportService;
    constructor(exportService: ExportService);
    exportCsv(user: any, startDate?: string, endDate?: string): Promise<{
        filename: string;
        content: string;
        mimeType: string;
        message: string;
    }>;
    exportFullBackup(user: any): Promise<{
        filename: string;
        content: string;
        mimeType: string;
        message: string;
    }>;
}
