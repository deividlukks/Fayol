import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SuggestCategoryDto {
  @ApiProperty({
    description: 'Descrição da transação para análise',
    example: 'Uber para o trabalho',
  })
  @IsString()
  @IsNotEmpty()
  description: string;
}

export interface CategorySuggestion {
  category: string;
  subcategory: string | null;
  confidence: number;
}
