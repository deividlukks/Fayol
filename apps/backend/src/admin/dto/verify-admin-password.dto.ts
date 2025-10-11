import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyAdminPasswordDto {
  @ApiProperty({
    description: 'Admin Fayol ID validado na etapa anterior',
    example: 'admin@fayol.app',
  })
  @IsNotEmpty({ message: 'Fayol ID é obrigatório' })
  @IsString()
  fayolId: string;

  @ApiProperty({
    description: 'Senha do administrador',
    example: 'Admin@123',
  })
  @IsNotEmpty({ message: 'Senha é obrigatória' })
  @IsString()
  password: string;
}
