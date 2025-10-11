import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsDateString, IsUUID, IsNumber, Min } from 'class-validator';

export class FilterTransactionDto {
  @ApiProperty({ required: false, enum: ['income', 'expense'] })
  @IsOptional()
  @IsEnum(['income', 'expense'])
  movementType?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  accountId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ required: false, default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ required: false, default: 50 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number = 50;
}
