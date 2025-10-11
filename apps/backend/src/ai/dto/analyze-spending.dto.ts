import { IsArray, IsOptional, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class TransactionDto {
  @ApiProperty({
    description: 'ID da transação',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Descrição da transação',
    example: 'Compra no supermercado Extra',
  })
  description: string;

  @ApiProperty({
    description: 'Valor da transação (positivo para receita, negativo para despesa)',
    example: -150.5,
  })
  amount: number;

  @ApiProperty({
    description: 'Data da transação (ISO 8601)',
    example: '2025-10-01T10:30:00Z',
  })
  date: string;

  @ApiProperty({
    description: 'Categoria da transação',
    example: 'Alimentação',
    required: false,
  })
  category?: string;

  @ApiProperty({
    description: 'Subcategoria da transação',
    example: 'Supermercado',
    required: false,
  })
  subcategory?: string;
}

export class AnalyzeSpendingDto {
  @ApiProperty({
    description: 'Lista de transações para análise',
    type: [TransactionDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TransactionDto)
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
