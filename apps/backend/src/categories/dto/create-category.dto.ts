import { IsString, IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({
    description: 'Nome da categoria',
    example: 'Alimentação',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Tipo da categoria',
    enum: ['income', 'expense', 'investment'],
    example: 'expense',
  })
  @IsEnum(['income', 'expense', 'investment'])
  type: string;

  @ApiPropertyOptional({
    description: 'Ícone da categoria',
    example: '🍔',
  })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({
    description: 'Cor da categoria (hex)',
    example: '#FF5722',
  })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({
    description: 'Se é uma categoria do sistema (padrão)',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isSystem?: boolean;
}
