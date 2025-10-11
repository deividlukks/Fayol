import { IsArray, IsOptional, ValidateNested, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { TransactionDto } from './analyze-spending.dto';

export class UserGoalsDto {
  @ApiProperty({
    description: 'Meta de poupança mensal',
    example: 1000,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  savingsGoal?: number;

  @ApiProperty({
    description: 'Meta de gastos máximos por categoria',
    example: { Alimentação: 500, Transporte: 300 },
    required: false,
  })
  @IsOptional()
  categoryBudgets?: Record<string, number>;

  @ApiProperty({
    description: 'Taxa de poupança desejada (%)',
    example: 20,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  targetSavingsRate?: number;
}

export class GetRecommendationsDto {
  @ApiProperty({
    description: 'Lista de transações para análise',
    type: [TransactionDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TransactionDto)
  transactions: TransactionDto[];

  @ApiProperty({
    description: 'Metas financeiras do usuário',
    type: UserGoalsDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => UserGoalsDto)
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
