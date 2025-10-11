import { IsArray, IsInt, Min, Max, IsOptional, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { TransactionDto } from './analyze-spending.dto';

export class PredictFutureDto {
  @ApiProperty({
    description: 'Lista de transações históricas para análise',
    type: [TransactionDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TransactionDto)
  transactions: TransactionDto[];

  @ApiProperty({
    description: 'Número de meses a prever (1-12)',
    example: 3,
    minimum: 1,
    maximum: 12,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
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
