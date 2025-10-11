export declare class TransactionDto {
    id: string;
    description: string;
    amount: number;
    date: string;
    category?: string;
    subcategory?: string;
}
export declare class AnalyzeSpendingDto {
    transactions: TransactionDto[];
}
export interface SpendingSummary {
    totalIncome: number;
    totalExpenses: number;
    balance: number;
    savingsRate: number;
    transactionCount: number;
    averageTransaction: number;
}
export interface CategoryBreakdown {
    totals: Record<string, number>;
    averages: Record<string, number>;
    percentages: Record<string, number>;
    counts: Record<string, number>;
}
export interface SpendingPattern {
    category: string;
    pattern: string;
    description: string;
}
export interface TrendAnalysis {
    direction: 'increasing' | 'decreasing' | 'stable';
    percentageChange: number;
    description: string;
}
export interface SpendingAnalysisResponse {
    summary: SpendingSummary;
    categoryBreakdown: CategoryBreakdown;
    insights: string[];
    patterns: SpendingPattern[];
    trends: TrendAnalysis;
    healthScore: number;
}
