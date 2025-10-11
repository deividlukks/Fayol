import { TransactionDto } from './analyze-spending.dto';
export declare class PredictFutureDto {
    transactions: TransactionDto[];
    monthsAhead?: number;
}
export interface FinancialPrediction {
    month: string;
    predictedIncome: number;
    predictedExpenses: number;
    predictedBalance: number;
    confidence: number;
    breakdown?: Record<string, number>;
}
export interface PredictionResponse {
    predictions: FinancialPrediction[];
    baselineData: {
        averageMonthlyIncome: number;
        averageMonthlyExpenses: number;
        monthsAnalyzed: number;
    };
    reliability: 'low' | 'medium' | 'high';
    notes: string[];
}
