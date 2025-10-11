import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  Matches,
  IsEnum,
  IsOptional,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'João Silva' })
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'joao@example.com' })
  @IsNotEmpty({ message: 'Email é obrigatório' })
  @IsEmail({}, { message: 'Email inválido' })
  email: string;

  @ApiProperty({ example: '11999999999' })
  @IsNotEmpty({ message: 'Telefone é obrigatório' })
  @IsString()
  @Matches(/^[0-9]{10,11}$/, { message: 'Telefone deve conter 10 ou 11 dígitos' })
  phone: string;

  @ApiProperty({ example: '12345678900', required: false })
  @IsOptional()
  @IsString()
  @Matches(/^[0-9]{11}$/, { message: 'CPF deve conter 11 dígitos' })
  cpf?: string;

  @ApiProperty({ example: 'Senha@123' })
  @IsNotEmpty({ message: 'Senha é obrigatória' })
  @MinLength(8, { message: 'Senha deve ter no mínimo 8 caracteres' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Senha deve conter pelo menos uma letra maiúscula, uma minúscula e um número',
  })
  password: string;

  @ApiProperty({ enum: ['conservative', 'moderate', 'aggressive'], default: 'moderate' })
  @IsEnum(['conservative', 'moderate', 'aggressive'], {
    message: 'Perfil de investidor inválido',
  })
  investorProfile?: string = 'moderate';
}
