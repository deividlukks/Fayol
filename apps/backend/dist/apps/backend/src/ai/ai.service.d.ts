import { CategorySuggestion } from './dto/suggest-category.dto';
interface Transaction {
    id: string;
    description: string;
    amount: number;
    movementType: 'income' | 'expense';
    date: Date;
    category?: {
        name: string;
        id: string;
    };
}
interface SpendingPattern {
    category: string;
    averageAmount: number;
    frequency: number;
    trend: 'increasing' | 'decreasing' | 'stable';
    predictedNextMonth: number;
}
interface FinancialInsight {
    type: string;
    severity: 'info' | 'warning' | 'critical';
    category?: string;
    amount?: number;
    percentage?: number;
    message: string;
    recommendation?: string;
}
interface FinancialPrediction {
    month: string;
    predictedIncome: number;
    predictedExpenses: number;
    predictedBalance: number;
    confidence: number;
}
interface AnomalyDetection {
    isAnomaly: boolean;
    reason: string;
    expectedRange: {
        min: number;
        max: number;
    };
    actualValue: number;
    severity: 'low' | 'medium' | 'high';
}
export declare class AiService {
    private readonly logger;
    private readonly categorizationRules;
    suggestCategory(description: string, amount?: number, date?: Date): CategorySuggestion;
    private adjustConfidenceByAmount;
    analyzeSpending(transactions: Transaction[]): Promise<{
        summary: {
            totalIncome: number;
            totalExpenses: number;
            balance: number;
            savingsRate: string;
        };
        categoryBreakdown: {
            totals: Record<string, number>;
            averages: Record<string, number>;
            percentages: Record<string, number>;
        };
        insights: FinancialInsight[];
        patterns: SpendingPattern[];
        trends: {
            overall: string;
            monthly: {};
            percentageChange?: undefined;
        } | {
            overall: string;
            percentageChange: string;
            monthly: Record<string, {
                incomes: Transaction[];
                expenses: Transaction[];
            }>;
        };
        healthScore: number;
    }>;
    predictFinancialFuture(transactions: Transaction[], monthsAhead?: number): Promise<FinancialPrediction[]>;
    detectAnomalies(transactions: Transaction[]): Promise<AnomalyDetection[]>;
    generateRecommendations(transactions: Transaction[], userGoals?: {
        savingsGoal?: number;
        categoryBudgets?: Record<string, number>;
        targetSavingsRate?: number;
    }): Promise<string[]>;
    private groupByCategory;
    private calculateCategoryAverages;
    private calculatePercentages;
    private generateAdvancedInsights;
    private detectSpendingPatterns;
    private analyzeTrends;
    private calculateFinancialHealth;
    private groupTransactionsByCategory;
    private groupByMonth;
    private calculateMonthlyAverage;
    private calculateTrend;
    private calculateSimpleTrend;
    private calculatePredictionConfidence;
    private getNextMonthName;
    private calculateCategoryStatistics;
}
export {};
