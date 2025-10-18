import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsBoolean, IsDateString, Min, Max } from 'class-validator';

export class CreateBudgetDto {
  @ApiProperty({ example: 'Orçamento de Alimentação' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'cat-uuid-123' })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiProperty({ example: 1500.00 })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ example: 'monthly', enum: ['daily', 'weekly', 'monthly', 'yearly'] })
  @IsString()
  period: string;

  @ApiProperty({ example: '2025-01-01T00:00:00.000Z' })
  @IsDateString()
  startDate: string;

  @ApiPropertyOptional({ example: '2025-12-31T23:59:59.999Z' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ example: 80, description: 'Alertar quando atingir X% do limite' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  alertThreshold?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
