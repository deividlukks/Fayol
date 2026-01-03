import { Trade, TradeType, Prisma } from '@fayol/database-models';
import { ApiProperty } from '@nestjs/swagger';

export class TradeEntity implements Trade {
  @ApiProperty({ example: 'uuid-1234' })
  id: string;

  @ApiProperty({ example: 'uuid-user-1' })
  userId: string;

  @ApiProperty({ example: 'uuid-account-1' })
  accountId: string;

  @ApiProperty({ example: 'uuid-inv-1', required: false, nullable: true })
  investmentId: string | null;

  @ApiProperty({ example: 'uuid-trans-1', required: false, nullable: true })
  transactionId: string | null;

  @ApiProperty({ example: 'PETR4' })
  ticker: string;

  @ApiProperty({ enum: TradeType, example: 'BUY' })
  type: TradeType;

  // CORREÇÃO: Usando Prisma.Decimal ao invés de importar 'Decimal' de caminho interno
  @ApiProperty({ example: 100 })
  quantity: Prisma.Decimal;

  @ApiProperty({ example: 35.5 })
  price: Prisma.Decimal;

  @ApiProperty({ example: 5.0 })
  fees: Prisma.Decimal;

  @ApiProperty({ example: 3555.0 })
  totalAmount: Prisma.Decimal;

  @ApiProperty()
  date: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ required: false, nullable: true })
  deletedAt: Date | null;
}
