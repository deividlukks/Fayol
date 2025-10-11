import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AiService } from './ai.service';
import {
  AnalyzeSpendingDto,
  SpendingAnalysisResponse,
  TrendAnalysis
} from './dto/analyze-spending.dto';
import {
  AnomaliesResponse,
  AnomalyDetection,
  DetectAnomaliesDto,
} from './dto/detect-anomalies.dto';
import {
  GetRecommendationsDto,
  Recommendation,
  RecommendationsResponse,
} from './dto/get-recommendations.dto';
import {
  PredictFutureDto,
  PredictionResponse
} from './dto/predict-future.dto';
import { CategorySuggestion, SuggestCategoryDto } from './dto/suggest-category.dto';

@ApiTags('ai')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('suggest-category')
  @ApiOperation({
    summary: 'Sugerir categoria baseada na descrição',
    description:
      'Utiliza IA para categorizar automaticamente uma transação com base em sua descrição',
  })
  @ApiResponse({
    status: 200,
    description: 'Categoria sugerida com sucesso',
    schema: {
      example: {
        category: 'Alimentação',
        subcategory: 'Supermercado',
        confidence: 0.95,
      },
    },
  })
  suggestCategory(@Body() dto: SuggestCategoryDto): CategorySuggestion {
    return this.aiService.suggestCategory(dto.description);
  }

  @Post('analyze-spending')
  @ApiOperation({
    summary: 'Análise completa de gastos',
    description:
      'Analisa padrões de gastos, tendências e saúde financeira baseado no histórico de transações',
  })
  @ApiResponse({
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
  })
  async analyzeSpending(@Body() dto: AnalyzeSpendingDto): Promise<SpendingAnalysisResponse> {
    // Converter DTOs para o formato esperado pelo service
    const transactions = dto.transactions.map((t) => ({
      id: t.id,
      description: t.description,
      amount: t.amount,
      movementType: (t.amount < 0 ? 'expense' : 'income') as 'income' | 'expense',
      date: new Date(t.date),
      category: t.category ? { name: t.category, id: '' } : undefined,
    }));

    const result = await this.aiService.analyzeSpending(transactions);

    // Converter resultado para o formato esperado
    const transactionCount = dto.transactions.length;
    const totalAmount = dto.transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const averageTransaction = transactionCount > 0 ? totalAmount / transactionCount : 0;

    // Calcular contagens por categoria
    const categoryCounts: Record<string, number> = {};
    dto.transactions.forEach((t) => {
      const cat = t.category || 'Outros';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });

    // Converter insights para array de strings
    const insights = result.insights.map((i) => i.message);

    // Converter padrões para o formato esperado
    const patterns = result.patterns.map((p) => ({
      category: p.category,
      pattern: p.trend,
      description: `${p.category}: ${p.trend === 'increasing' ? 'crescente' : p.trend === 'decreasing' ? 'decrescente' : 'estável'}`,
    }));

    // Converter tendências
    const trends: TrendAnalysis = {
      direction: typeof result.trends.overall === 'string'
        ? (result.trends.overall as 'increasing' | 'decreasing' | 'stable')
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

  @Post('predict-future')
  @ApiOperation({
    summary: 'Previsão financeira futura',
    description:
      'Gera previsões de receitas, despesas e saldo para os próximos meses baseado em tendências históricas',
  })
  @ApiResponse({
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
  })
  async predictFuture(@Body() dto: PredictFutureDto): Promise<PredictionResponse> {
    // Converter DTOs para o formato esperado pelo service
    const transactions = dto.transactions.map((t) => ({
      id: t.id,
      description: t.description,
      amount: t.amount,
      movementType: (t.amount < 0 ? 'expense' : 'income') as 'income' | 'expense',
      date: new Date(t.date),
      category: t.category ? { name: t.category, id: '' } : undefined,
    }));

    const predictions = await this.aiService.predictFinancialFuture(
      transactions,
      dto.monthsAhead || 3,
    );

    // Calcular dados de baseline
    const income = transactions.filter((t) => t.amount > 0);
    const expenses = transactions.filter((t) => t.amount < 0);

    const monthsSet = new Set(
      transactions.map(
        (t) => `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, '0')}`,
      ),
    );

    const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = Math.abs(expenses.reduce((sum, t) => sum + t.amount, 0));
    const monthsAnalyzed = monthsSet.size;

    const avgConfidence =
      predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length;
    let reliability: 'low' | 'medium' | 'high';
    if (avgConfidence > 0.7) reliability = 'high';
    else if (avgConfidence > 0.5) reliability = 'medium';
    else reliability = 'low';

    const notes: string[] = [
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

  @Post('detect-anomalies')
  @ApiOperation({
    summary: 'Detecção de anomalias',
    description:
      'Identifica transações anômalas que fogem do padrão de gastos usando análise estatística',
  })
  @ApiResponse({
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
  })
  async detectAnomalies(@Body() dto: DetectAnomaliesDto): Promise<AnomaliesResponse> {
    // Converter DTOs para o formato esperado pelo service
    const transactions = dto.transactions.map((t) => ({
      id: t.id,
      description: t.description,
      amount: t.amount,
      movementType: (t.amount < 0 ? 'expense' : 'income') as 'income' | 'expense',
      date: new Date(t.date),
      category: t.category ? { name: t.category, id: '' } : undefined,
    }));

    const serviceAnomalies = await this.aiService.detectAnomalies(transactions);

    // Criar map de transações para lookup rápido
    const transactionMap = new Map(dto.transactions.map(t => [t.id, t]));

    // Converter anomalias do service para o formato esperado
    const anomalies: AnomalyDetection[] = [];

    transactions.forEach((transaction) => {
      const originalTransaction = transactionMap.get(transaction.id);
      if (!originalTransaction) return;

      // Encontrar anomalia correspondente no resultado do service
      const serviceAnomaly = serviceAnomalies.find((a) =>
        a.isAnomaly && Math.abs(a.actualValue - Math.abs(transaction.amount)) < 0.01
      );

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
          deviation: Math.abs(
            (Math.abs(transaction.amount) - serviceAnomaly.expectedRange.min) /
              (serviceAnomaly.expectedRange.max - serviceAnomaly.expectedRange.min),
          ),
          expectedRange: serviceAnomaly.expectedRange,
        });
      }
    });

    // Calcular estatísticas por categoria para incluir na resposta
    const categoryMap = new Map<string, number[]>();

    transactions.forEach((t) => {
      const categoryName = t.category?.name || 'Sem categoria';
      const amount = Math.abs(t.amount);

      if (!categoryMap.has(categoryName)) {
        categoryMap.set(categoryName, []);
      }
      categoryMap.get(categoryName)!.push(amount);
    });

    const categoryStatistics: Record<string, { mean: number; stdDev: number; count: number }> = {};

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
      anomalyPercentage:
        transactions.length > 0
          ? Math.round((anomalyCount / transactions.length) * 10000) / 100
          : 0,
      categoryStatistics,
    };
  }

  @Post('recommendations')
  @ApiOperation({
    summary: 'Recomendações personalizadas',
    description:
      'Gera recomendações financeiras personalizadas baseadas em padrões de gastos e metas do usuário',
  })
  @ApiResponse({
    status: 200,
    description: 'Recomendações geradas com sucesso',
    schema: {
      example: {
        recommendations: [
          {
            type: 'savings',
            priority: 'high',
            title: 'Aumente sua taxa de poupança',
            description:
              'Sua taxa de poupança está em 15%. Tente aumentar para pelo menos 20% do seu salário.',
            impact: {
              potentialSavings: 250,
              timeframe: 'mensal',
            },
          },
          {
            type: 'category',
            priority: 'medium',
            title: 'Reduza gastos com Alimentação',
            description:
              'Gastos com Alimentação representam 28% do seu orçamento. Considere cozinhar mais em casa.',
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
  })
  async getRecommendations(@Body() dto: GetRecommendationsDto): Promise<RecommendationsResponse> {
    // Converter DTOs para o formato esperado pelo service
    const transactions = dto.transactions.map((t) => ({
      id: t.id,
      description: t.description,
      amount: t.amount,
      movementType: (t.amount < 0 ? 'expense' : 'income') as 'income' | 'expense',
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

    const rawRecommendations = await this.aiService.generateRecommendations(
      transactions,
      userGoals,
    );

    // Processar recomendações em formato estruturado
    const recommendations: Recommendation[] = rawRecommendations.map((rec) => {
      let type: Recommendation['type'] = 'general';
      let priority: Recommendation['priority'] = 'medium';

      if (rec.includes('poupança') || rec.includes('economizar')) {
        type = 'savings';
      } else if (rec.includes('categoria') || rec.includes('gastos com')) {
        type = 'category';
      } else if (rec.includes('saúde financeira')) {
        type = 'health';
      } else if (rec.includes('meta')) {
        type = 'goal';
      }

      if (rec.includes('🔴') || rec.includes('⚠️')) {
        priority = 'high';
      } else if (rec.includes('✅') || rec.includes('💡')) {
        priority = 'low';
      }

      return {
        type,
        priority,
        title: rec.split(':')[0] || rec.substring(0, 50),
        description: rec,
      };
    });

    // Calcular saúde financeira atual
    const income = transactions.filter((t) => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
    const expenses = Math.abs(
      transactions.filter((t) => t.amount < 0).reduce((sum, t) => sum + t.amount, 0),
    );
    const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;

    // Simular análise para obter health score
    const analysis = await this.aiService.analyzeSpending(transactions);
    const healthScore = analysis.healthScore;

    let status: 'excellent' | 'good' | 'fair' | 'poor';
    if (healthScore >= 80) status = 'excellent';
    else if (healthScore >= 60) status = 'good';
    else if (healthScore >= 40) status = 'fair';
    else status = 'poor';

    // Extrair ações prioritárias
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
}
