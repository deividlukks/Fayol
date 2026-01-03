import { IsEnum, IsNumber, IsString, IsDateString, IsOptional, IsUUID, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TradeType } from '@fayol/shared-types'; // Ou do @prisma/client via database-models

export class CreateTradeDto {
  @ApiProperty({ example: 'PETR4', description: 'Código do ativo' })
  @IsString()
  ticker: string;

  @ApiProperty({
    example: 'uuid-da-conta',
    description: 'ID da conta onde o ativo está custodiado',
  })
  @IsUUID()
  accountId: string;

  @ApiProperty({ enum: TradeType, example: 'BUY' })
  @IsEnum(TradeType)
  type: TradeType;

  @ApiProperty({ example: 100 })
  @IsNumber()
  @Min(0.00000001)
  quantity: number;

  @ApiProperty({ example: 35.5 })
  @IsNumber()
  @Min(0.01)
  price: number;

  @ApiProperty({ example: '2025-12-10' })
  @IsDateString()
  date: string;

  @ApiProperty({ required: false, example: 5.0 })
  @IsOptional()
  @IsNumber()
  fees?: number;
}
