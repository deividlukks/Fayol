"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const ai_service_1 = require("./ai.service");
const analyze_spending_dto_1 = require("./dto/analyze-spending.dto");
const detect_anomalies_dto_1 = require("./dto/detect-anomalies.dto");
const get_recommendations_dto_1 = require("./dto/get-recommendations.dto");
const predict_future_dto_1 = require("./dto/predict-future.dto");
const suggest_category_dto_1 = require("./dto/suggest-category.dto");
let AiController = class AiController {
    constructor(aiService) {
        this.aiService = aiService;
    }
    suggestCategory(dto) {
        return this.aiService.suggestCategory(dto.description);
    }
    async analyzeSpending(dto) {
        const transactions = dto.transactions.map((t) => ({
            id: t.id,
            description: t.description,
            amount: t.amount,
            movementType: (t.amount < 0 ? 'expense' : 'income'),
            date: new Date(t.date),
            category: t.category ? { name: t.category, id: '' } : undefined,
        }));
        const result = await this.aiService.analyzeSpending(transactions);
        const transactionCount = dto.transactions.length;
        const totalAmount = dto.transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
        const averageTransaction = transactionCount > 0 ? totalAmount / transactionCount : 0;
        const categoryCounts = {};
        dto.transactions.forEach((t) => {
            const cat = t.category || 'Outros';
            categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
        });
        const insights = result.insights.map((i) => i.message);
        const patterns = result.patterns.map((p) => ({
            category: p.category,
            pattern: p.trend,
            description: `${p.category}: ${p.trend === 'increasing' ? 'crescente' : p.trend === 'decreasing' ? 'decrescente' : 'estável'}`,
        }));
        const trends = {
            direction: typeof result.trends.overall === 'string'
                ? result.trends.overall
                : 'stable',
            percentageChange: typeof result.trends.percentageChange === 'string'
                ? parseFloat(result.trends.percentageChange)
                : 0,
            description: 'Análise de tendências dos gastos',
        };
        return {
            summary: {
                totalIncome: result.summary.totalIncome,
                totalExpenses: result.summary.totalExpenses,
                balance: result.summary.balance,
                savingsRate: parseFloat(result.summary.savingsRate),
                transactionCount,
                averageTransaction,
            },
            categoryBreakdown: {
                ...result.categoryBreakdown,
                counts: categoryCounts,
            },
            insights,
            patterns,
            trends,
            healthScore: result.healthScore,
        };
    }
    async predictFuture(dto) {
        const transactions = dto.transactions.map((t) => ({
            id: t.id,
            description: t.description,
            amount: t.amount,
            movementType: (t.amount < 0 ? 'expense' : 'income'),
            date: new Date(t.date),
            category: t.category ? { name: t.category, id: '' } : undefined,
        }));
        const predictions = await this.aiService.predictFinancialFuture(transactions, dto.monthsAhead || 3);
        const income = transactions.filter((t) => t.amount > 0);
        const expenses = transactions.filter((t) => t.amount < 0);
        const monthsSet = new Set(transactions.map((t) => `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, '0')}`));
        const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);
        const totalExpenses = Math.abs(expenses.reduce((sum, t) => sum + t.amount, 0));
        const monthsAnalyzed = monthsSet.size;
        const avgConfidence = predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length;
        let reliability;
        if (avgConfidence > 0.7)
            reliability = 'high';
        else if (avgConfidence > 0.5)
            reliability = 'medium';
        else
            reliability = 'low';
        const notes = [
            `Previsões baseadas em ${monthsAnalyzed} ${monthsAnalyzed === 1 ? 'mês' : 'meses'} de histórico`,
        ];
        if (monthsAnalyzed < 3) {
            notes.push('⚠️ Histórico limitado pode reduzir precisão das previsões');
        }
        return {
            predictions,
            baselineData: {
                averageMonthlyIncome: monthsAnalyzed > 0 ? totalIncome / monthsAnalyzed : 0,
                averageMonthlyExpenses: monthsAnalyzed > 0 ? totalExpenses / monthsAnalyzed : 0,
                monthsAnalyzed,
            },
            reliability,
            notes,
        };
    }
    async detectAnomalies(dto) {
        const transactions = dto.transactions.map((t) => ({
            id: t.id,
            description: t.description,
            amount: t.amount,
            movementType: (t.amount < 0 ? 'expense' : 'income'),
            date: new Date(t.date),
            category: t.category ? { name: t.category, id: '' } : undefined,
        }));
        const serviceAnomalies = await this.aiService.detectAnomalies(transactions);
        const transactionMap = new Map(dto.transactions.map(t => [t.id, t]));
        const anomalies = [];
        transactions.forEach((transaction) => {
            const originalTransaction = transactionMap.get(transaction.id);
            if (!originalTransaction)
                return;
            const serviceAnomaly = serviceAnomalies.find((a) => a.isAnomaly && Math.abs(a.actualValue - Math.abs(transaction.amount)) < 0.01);
            if (serviceAnomaly && serviceAnomaly.isAnomaly) {
                const category = transaction.category?.name || 'Sem categoria';
                anomalies.push({
                    transactionId: transaction.id,
                    description: transaction.description,
                    amount: transaction.amount,
                    date: originalTransaction.date,
                    category,
                    isAnomaly: true,
                    reason: serviceAnomaly.reason,
                    severity: serviceAnomaly.severity,
                    deviation: Math.abs((Math.abs(transaction.amount) - serviceAnomaly.expectedRange.min) /
                        (serviceAnomaly.expectedRange.max - serviceAnomaly.expectedRange.min)),
                    expectedRange: serviceAnomaly.expectedRange,
                });
            }
        });
        const categoryMap = new Map();
        transactions.forEach((t) => {
            const categoryName = t.category?.name || 'Sem categoria';
            const amount = Math.abs(t.amount);
            if (!categoryMap.has(categoryName)) {
                categoryMap.set(categoryName, []);
            }
            categoryMap.get(categoryName).push(amount);
        });
        const categoryStatistics = {};
        categoryMap.forEach((amounts, category) => {
            const mean = amounts.reduce((sum, a) => sum + a, 0) / amounts.length;
            const variance = amounts.reduce((sum, a) => sum + Math.pow(a - mean, 2), 0) / amounts.length;
            const stdDev = Math.sqrt(variance);
            categoryStatistics[category] = {
                mean: Math.round(mean * 100) / 100,
                stdDev: Math.round(stdDev * 100) / 100,
                count: amounts.length,
            };
        });
        const anomalyCount = anomalies.filter((a) => a.isAnomaly).length;
        return {
            anomalies,
            totalTransactions: transactions.length,
            anomalyCount,
            anomalyPercentage: transactions.length > 0
                ? Math.round((anomalyCount / transactions.length) * 10000) / 100
                : 0,
            categoryStatistics,
        };
    }
    async getRecommendations(dto) {
        const transactions = dto.transactions.map((t) => ({
            id: t.id,
            description: t.description,
            amount: t.amount,
            movementType: (t.amount < 0 ? 'expense' : 'income'),
            date: new Date(t.date),
            category: t.category ? { name: t.category, id: '' } : undefined,
        }));
        const userGoals = dto.userGoals
            ? {
                savingsGoal: dto.userGoals.savingsGoal,
                categoryBudgets: dto.userGoals.categoryBudgets,
                targetSavingsRate: dto.userGoals.targetSavingsRate,
            }
            : undefined;
        const rawRecommendations = await this.aiService.generateRecommendations(transactions, userGoals);
        const recommendations = rawRecommendations.map((rec) => {
            let type = 'general';
            let priority = 'medium';
            if (rec.includes('poupança') || rec.includes('economizar')) {
                type = 'savings';
            }
            else if (rec.includes('categoria') || rec.includes('gastos com')) {
                type = 'category';
            }
            else if (rec.includes('saúde financeira')) {
                type = 'health';
            }
            else if (rec.includes('meta')) {
                type = 'goal';
            }
            if (rec.includes('🔴') || rec.includes('⚠️')) {
                priority = 'high';
            }
            else if (rec.includes('✅') || rec.includes('💡')) {
                priority = 'low';
            }
            return {
                type,
                priority,
                title: rec.split(':')[0] || rec.substring(0, 50),
                description: rec,
            };
        });
        const income = transactions.filter((t) => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
        const expenses = Math.abs(transactions.filter((t) => t.amount < 0).reduce((sum, t) => sum + t.amount, 0));
        const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;
        const analysis = await this.aiService.analyzeSpending(transactions);
        const healthScore = analysis.healthScore;
        let status;
        if (healthScore >= 80)
            status = 'excellent';
        else if (healthScore >= 60)
            status = 'good';
        else if (healthScore >= 40)
            status = 'fair';
        else
            status = 'poor';
        const priorityActions = recommendations
            .filter((r) => r.priority === 'high')
            .slice(0, 3)
            .map((r) => `🎯 ${r.title}`);
        const longTermAdvice = [
            'Construa um fundo de emergência equivalente a 6 meses de despesas',
            'Diversifique suas categorias de investimento',
            'Revise seu orçamento trimestralmente',
            'Considere aumentar sua renda com fontes alternativas',
        ];
        return {
            recommendations,
            currentFinancialHealth: {
                score: healthScore,
                savingsRate: Math.round(savingsRate * 100) / 100,
                status,
            },
            priorityActions,
            longTermAdvice,
        };
    }
};
exports.AiController = AiController;
__decorate([
    (0, common_1.Post)('suggest-category'),
    (0, swagger_1.ApiOperation)({
        summary: 'Sugerir categoria baseada na descrição',
        description: 'Utiliza IA para categorizar automaticamente uma transação com base em sua descrição',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Categoria sugerida com sucesso',
        schema: {
            example: {
                category: 'Alimentação',
                subcategory: 'Supermercado',
                confidence: 0.95,
            },
        },
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [suggest_category_dto_1.SuggestCategoryDto]),
    __metadata("design:returntype", Object)
], AiController.prototype, "suggestCategory", null);
__decorate([
    (0, common_1.Post)('analyze-spending'),
    (0, swagger_1.ApiOperation)({
        summary: 'Análise completa de gastos',
        description: 'Analisa padrões de gastos, tendências e saúde financeira baseado no histórico de transações',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Análise concluída com sucesso',
        schema: {
            example: {
                summary: {
                    totalIncome: 5000,
                    totalExpenses: 3500,
                    balance: 1500,
                    savingsRate: 30,
                    transactionCount: 45,
                    averageTransaction: 111.11,
                },
                categoryBreakdown: {
                    totals: { Alimentação: 800, Transporte: 500 },
                    averages: { Alimentação: 80, Transporte: 50 },
                    percentages: { Alimentação: 22.86, Transporte: 14.29 },
                    counts: { Alimentação: 10, Transporte: 10 },
                },
                insights: ['✅ Sua taxa de poupança está em 30%, acima da média recomendada!'],
                patterns: [
                    {
                        category: 'Alimentação',
                        pattern: 'increasing',
                        description: 'Gastos com Alimentação aumentaram 15% no último mês',
                    },
                ],
                trends: {
                    direction: 'stable',
                    percentageChange: 2.5,
                    description: 'Seus gastos estão estáveis com pequenas variações',
                },
                healthScore: 75,
            },
        },
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [analyze_spending_dto_1.AnalyzeSpendingDto]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "analyzeSpending", null);
__decorate([
    (0, common_1.Post)('predict-future'),
    (0, swagger_1.ApiOperation)({
        summary: 'Previsão financeira futura',
        description: 'Gera previsões de receitas, despesas e saldo para os próximos meses baseado em tendências históricas',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Previsões geradas com sucesso',
        schema: {
            example: {
                predictions: [
                    {
                        month: '2025-11',
                        predictedIncome: 5200,
                        predictedExpenses: 3600,
                        predictedBalance: 1600,
                        confidence: 0.85,
                        breakdown: {
                            Alimentação: 850,
                            Transporte: 520,
                            Moradia: 1500,
                        },
                    },
                ],
                baselineData: {
                    averageMonthlyIncome: 5000,
                    averageMonthlyExpenses: 3500,
                    monthsAnalyzed: 6,
                },
                reliability: 'high',
                notes: [
                    'Previsões baseadas em 6 meses de histórico',
                    'Tendência de crescimento de 4% detectada',
                ],
            },
        },
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [predict_future_dto_1.PredictFutureDto]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "predictFuture", null);
__decorate([
    (0, common_1.Post)('detect-anomalies'),
    (0, swagger_1.ApiOperation)({
        summary: 'Detecção de anomalias',
        description: 'Identifica transações anômalas que fogem do padrão de gastos usando análise estatística',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Anomalias detectadas com sucesso',
        schema: {
            example: {
                anomalies: [
                    {
                        transactionId: '123e4567-e89b-12d3-a456-426614174000',
                        description: 'Compra de eletrônico',
                        amount: -2500,
                        date: '2025-10-05T14:30:00Z',
                        category: 'Compras',
                        isAnomaly: true,
                        reason: 'Gasto em Compras está 3.2 desvios padrão acima da média',
                        severity: 'high',
                        deviation: 3.2,
                        expectedRange: { min: 100, max: 800 },
                    },
                ],
                totalTransactions: 45,
                anomalyCount: 3,
                anomalyPercentage: 6.67,
                categoryStatistics: {
                    Alimentação: { mean: 80, stdDev: 15, count: 10 },
                    Transporte: { mean: 50, stdDev: 10, count: 10 },
                },
            },
        },
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [detect_anomalies_dto_1.DetectAnomaliesDto]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "detectAnomalies", null);
__decorate([
    (0, common_1.Post)('recommendations'),
    (0, swagger_1.ApiOperation)({
        summary: 'Recomendações personalizadas',
        description: 'Gera recomendações financeiras personalizadas baseadas em padrões de gastos e metas do usuário',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Recomendações geradas com sucesso',
        schema: {
            example: {
                recommendations: [
                    {
                        type: 'savings',
                        priority: 'high',
                        title: 'Aumente sua taxa de poupança',
                        description: 'Sua taxa de poupança está em 15%. Tente aumentar para pelo menos 20% do seu salário.',
                        impact: {
                            potentialSavings: 250,
                            timeframe: 'mensal',
                        },
                    },
                    {
                        type: 'category',
                        priority: 'medium',
                        title: 'Reduza gastos com Alimentação',
                        description: 'Gastos com Alimentação representam 28% do seu orçamento. Considere cozinhar mais em casa.',
                        impact: {
                            potentialSavings: 200,
                            timeframe: 'mensal',
                        },
                    },
                ],
                currentFinancialHealth: {
                    score: 68,
                    savingsRate: 15,
                    status: 'fair',
                },
                priorityActions: [
                    '🎯 Estabeleça uma meta de poupança mensal',
                    '📊 Revise seus gastos com Alimentação',
                ],
                longTermAdvice: [
                    'Construa um fundo de emergência equivalente a 6 meses de despesas',
                    'Diversifique suas categorias de investimento',
                ],
            },
        },
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [get_recommendations_dto_1.GetRecommendationsDto]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "getRecommendations", null);
exports.AiController = AiController = __decorate([
    (0, swagger_1.ApiTags)('ai'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('ai'),
    __metadata("design:paramtypes", [ai_service_1.AiService])
], AiController);
//# sourceMappingURL=ai.controller.js.map