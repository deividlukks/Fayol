import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsDateString,
  IsUUID,
} from 'class-validator';

export class CreateTransactionDto {
  @ApiProperty({ example: 'uuid-da-conta' })
  @IsNotEmpty()
  @IsUUID()
  accountId: string;

  @ApiProperty({ enum: ['income', 'expense'] })
  @IsNotEmpty()
  @IsEnum(['income', 'expense'])
  movementType: string;

  @ApiProperty({ enum: ['income', 'expense', 'investment', 'transfer'] })
  @IsNotEmpty()
  @IsEnum(['income', 'expense', 'investment', 'transfer'])
  launchType: string;

  @ApiProperty({ example: 'uuid-da-categoria' })
  @IsNotEmpty()
  @IsUUID()
  categoryId: string;

  @ApiProperty({ example: 'uuid-da-subcategoria', required: false })
  @IsOptional()
  @IsUUID()
  subcategoryId?: string;

  @ApiProperty({ example: 100.5 })
  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @ApiProperty({ example: 'Compra no supermercado', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: '2024-01-15T10:00:00Z', required: false })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiProperty({ example: '2024-01-15T10:00:00Z', required: false })
  @IsOptional()
  @IsDateString()
  receiptDate?: string;

  @ApiProperty({ example: '2024-01-15T10:00:00Z', required: false })
  @IsOptional()
  @IsDateString()
  effectiveDate?: string;

  @ApiProperty({ default: false })
  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;

  @ApiProperty({ enum: ['daily', 'weekly', 'monthly', 'yearly'], required: false })
  @IsOptional()
  @IsEnum(['daily', 'weekly', 'monthly', 'yearly'])
  recurrencePeriod?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  transferId?: string;
}
