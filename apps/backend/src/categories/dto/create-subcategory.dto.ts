import { IsString, IsUUID, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSubcategoryDto {
  @ApiProperty({
    description: 'ID da categoria pai',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  categoryId: string;

  @ApiProperty({
    description: 'Nome da subcategoria',
    example: 'Supermercado',
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'Se é uma subcategoria do sistema (padrão)',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isSystem?: boolean;
}
