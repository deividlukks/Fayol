import { TransactionDto } from './analyze-spending.dto';
export declare class DetectAnomaliesDto {
    transactions: TransactionDto[];
}
export interface AnomalyDetection {
    transactionId: string;
    description: string;
    amount: number;
    date: string;
    category: string;
    isAnomaly: boolean;
    reason?: string;
    severity?: 'low' | 'medium' | 'high';
    deviation?: number;
    expectedRange?: {
        min: number;
        max: number;
    };
}
export interface AnomaliesResponse {
    anomalies: AnomalyDetection[];
    totalTransactions: number;
    anomalyCount: number;
    anomalyPercentage: number;
    categoryStatistics: Record<string, {
        mean: number;
        stdDev: number;
        count: number;
    }>;
}
