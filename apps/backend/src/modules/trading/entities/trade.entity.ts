import { Trade, TradeType } from '@fayol/database-models';
import { ApiProperty } from '@nestjs/swagger';
import { Decimal } from '@prisma/client/runtime/library';

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

  @ApiProperty({ example: 100 })
  quantity: Decimal;

  @ApiProperty({ example: 35.50 })
  price: Decimal;

  @ApiProperty({ example: 5.00 })
  fees: Decimal;

  @ApiProperty({ example: 3555.00 })
  totalAmount: Decimal;

  @ApiProperty()
  date: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}