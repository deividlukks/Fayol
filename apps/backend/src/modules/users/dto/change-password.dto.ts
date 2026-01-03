import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({
    description: 'Senha atual do usuário',
    example: 'SenhaAtual123!',
  })
  @IsString()
  @IsNotEmpty({ message: 'Senha atual é obrigatória.' })
  currentPassword: string;

  @ApiProperty({
    description:
      'Nova senha (mín. 8 caracteres, deve conter maiúscula, minúscula, número e caractere especial)',
    example: 'NovaSenha123!',
    minLength: 8,
  })
  @IsString()
  @IsNotEmpty({ message: 'Nova senha é obrigatória.' })
  newPassword: string;

  @ApiProperty({
    description: 'Confirmação da nova senha',
    example: 'NovaSenha123!',
  })
  @IsString()
  @IsNotEmpty({ message: 'Confirmação de senha é obrigatória.' })
  confirmPassword: string;
}
