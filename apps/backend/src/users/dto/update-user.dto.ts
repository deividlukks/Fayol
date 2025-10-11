import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum } from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ required: false, enum: ['conservative', 'moderate', 'aggressive'] })
  @IsOptional()
  @IsEnum(['conservative', 'moderate', 'aggressive'])
  investorProfile?: string;
}
