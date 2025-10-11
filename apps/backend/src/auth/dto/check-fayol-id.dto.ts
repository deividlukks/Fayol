import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CheckFayolIdDto {
  @ApiProperty({
    description: 'Fayol ID - pode ser email, telefone ou CPF',
    example: 'joao@example.com ou 11999999999 ou 12345678900',
  })
  @IsNotEmpty({ message: 'Fayol ID é obrigatório' })
  @IsString()
  fayolId: string;
}
