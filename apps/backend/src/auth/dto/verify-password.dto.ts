import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyPasswordDto {
  @ApiProperty({
    description: 'Fayol ID validado na etapa anterior',
    example: 'joao@example.com',
  })
  @IsNotEmpty({ message: 'Fayol ID é obrigatório' })
  @IsString()
  fayolId: string;

  @ApiProperty({
    description: 'Senha do usuário',
    example: 'Senha@123',
  })
  @IsNotEmpty({ message: 'Senha é obrigatória' })
  @IsString()
  password: string;
}
