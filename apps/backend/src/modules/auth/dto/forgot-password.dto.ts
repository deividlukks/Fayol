import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({
    example: 'usuario@exemplo.com',
    description: 'Email do usuário para recuperação de senha',
  })
  @IsEmail({}, { message: 'Email inválido' })
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({
    example: 'abc123token',
    description: 'Token de recuperação enviado por email',
  })
  token: string;

  @ApiProperty({
    example: 'NovaSenha@123',
    description: 'Nova senha (mínimo 6 caracteres)',
    minLength: 6,
  })
  newPassword: string;
}
