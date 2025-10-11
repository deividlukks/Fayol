import { IsArray, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { TransactionDto } from './analyze-spending.dto';

export class DetectAnomaliesDto {
  @ApiProperty({
    description: 'Lista de transações para detecção de anomalias',
    type: [TransactionDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TransactionDto)
  transactions: TransactionDto[];
}

export interface AnomalyDetection {
  transactionId: string;
  description: string;
  amount: number;
  date: string;
  category: string;
  isAnomaly: boolean;
  reason?: string;
  severity?: 'low' | 'medium' | 'high';
  deviation?: number;
  expectedRange?: {
    min: number;
    max: number;
  };
}

export interface AnomaliesResponse {
  anomalies: AnomalyDetection[];
  totalTransactions: number;
  anomalyCount: number;
  anomalyPercentage: number;
  categoryStatistics: Record<
    string,
    {
      mean: number;
      stdDev: number;
      count: number;
    }
  >;
}
