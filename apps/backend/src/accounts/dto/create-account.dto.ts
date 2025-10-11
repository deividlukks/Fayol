import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsEnum, IsNumber, IsOptional } from 'class-validator';

export class CreateAccountDto {
  @ApiProperty({ example: 'Banco Itaú' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ enum: ['checking', 'savings', 'wallet', 'credit_card'] })
  @IsNotEmpty()
  @IsEnum(['checking', 'savings', 'wallet', 'credit_card'])
  type: string;

  @ApiProperty({ example: 1000.0, required: false })
  @IsOptional()
  @IsNumber()
  initialBalance?: number;

  @ApiProperty({ example: 'BRL', default: 'BRL' })
  @IsOptional()
  @IsString()
  currency?: string;
}
