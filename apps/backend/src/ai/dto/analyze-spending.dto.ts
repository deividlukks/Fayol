import { ApiProperty } from '@nestjs/swagger';

export class TransactionDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  date: Date;

  @ApiProperty()
  description: string;

  @ApiProperty()
  amount: number;

  @ApiProperty({ enum: ['income', 'expense'] })
  movementType: 'income' | 'expense';

  @ApiProperty({ required: false })
  category?: string;

  @ApiProperty({ required: false })
  subcategory?: string;
}

export class SpendingSummary {
  @ApiProperty({ description: 'Rendimento total no período.' })
  totalIncome: number;

  @ApiProperty({ description: 'Despesa total no período.' })
  totalExpenses: number;

  @ApiProperty({ description: 'Balanço (rendimento - despesas).' })
  balance: number;

  @ApiProperty({ description: 'Taxa de poupança percentual.' })
  savingsRate: string;

  @ApiProperty({ description: 'Número total de transações.' })
  transactionCount: number;

  @ApiProperty({ description: 'Valor médio das transações de despesa.' }) // ✅ CORREÇÃO: Adicionado o novo campo.
  averageTransaction: number;
}

export class CategorySpending {
  @ApiProperty({ description: 'Nome da categoria.' })
  category: string;

  @ApiProperty({ description: 'Valor total gasto na categoria.' })
  total: number;

  @ApiProperty({ description: 'Percentagem do total de despesas.' })
  percentage: number;
}

export class SpendingHistory {
  @ApiProperty({ description: 'Data da transação (formato AAAA-MM-DD).' })
  date: string;

  @ApiProperty({ description: 'Valor da transação.' })
  amount: number;

  @ApiProperty({ description: 'Tipo de transação (income/expense).', enum: ['income', 'expense']})
  type: 'income' | 'expense';
}

export class SpendingAnalysis {
  @ApiProperty({ description: 'ID do utilizador.' })
  userId: string;

  @ApiProperty({ description: 'Data e hora em que a análise foi gerada.' })
  generatedAt: Date;

  @ApiProperty({ type: SpendingSummary })
  summary: SpendingSummary;

  @ApiProperty({ type: [CategorySpending] })
  categorySpending: CategorySpending[];

  @ApiProperty({ type: [SpendingHistory] })
  spendingHistory: SpendingHistory[];
}

export class Anomaly {
    @ApiProperty()
    transactionId: string;
    @ApiProperty()
    reason: string;
    @ApiProperty()
    severity: 'low' | 'medium' | 'high';
}

export class Recommendation {
    @ApiProperty()
    recommendationId: string;
    @ApiProperty()
    title: string;
    @ApiProperty()
    description: string;
    @ApiProperty()
    priority: 'low' | 'medium' | 'high';
}

export class SpendingPrediction {
    @ApiProperty()
    date: string;
    @ApiProperty()
    predictedExpenses: number;
    @ApiProperty()
    predictedIncome: number;
}

export class FuturePrediction {
    @ApiProperty()
    userId: string;
    @ApiProperty()
    days: number;
    @ApiProperty({type: [SpendingPrediction]})
    predictions: SpendingPrediction[];
    @ApiProperty()
    totalPredictedExpenses: number;
    @ApiProperty()
    totalPredictedIncome: number;
}


export class CategorySuggestion {
    @ApiProperty()
    suggestedCategory: string;

    @ApiProperty()
    confidence: number;
}
