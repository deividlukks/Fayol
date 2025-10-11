import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateSubcategoryDto } from './create-subcategory.dto';

export class UpdateSubcategoryDto extends PartialType(
  OmitType(CreateSubcategoryDto, ['categoryId'] as const),
) {}
