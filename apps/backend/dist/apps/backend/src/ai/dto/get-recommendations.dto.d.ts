import { TransactionDto } from './analyze-spending.dto';
export declare class UserGoalsDto {
    savingsGoal?: number;
    categoryBudgets?: Record<string, number>;
    targetSavingsRate?: number;
}
export declare class GetRecommendationsDto {
    transactions: TransactionDto[];
    userGoals?: UserGoalsDto;
}
export interface Recommendation {
    type: 'savings' | 'category' | 'health' | 'goal' | 'general';
    priority: 'low' | 'medium' | 'high';
    title: string;
    description: string;
    impact?: {
        potentialSavings?: number;
        timeframe?: string;
    };
}
export interface RecommendationsResponse {
    recommendations: Recommendation[];
    currentFinancialHealth: {
        score: number;
        savingsRate: number;
        status: 'excellent' | 'good' | 'fair' | 'poor';
    };
    priorityActions: string[];
    longTermAdvice: string[];
}
