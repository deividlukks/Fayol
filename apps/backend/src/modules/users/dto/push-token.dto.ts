import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';

/**
 * DTO para registrar/atualizar Push Token
 */
export class RegisterPushTokenDto {
  @ApiProperty({
    description: 'Expo Push Token',
    example: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]',
  })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({
    description: 'Tipo de dispositivo',
    example: 'ios',
    enum: ['ios', 'android'],
    required: false,
  })
  @IsOptional()
  @IsEnum(['ios', 'android'])
  deviceType?: 'ios' | 'android';

  @ApiProperty({
    description: 'Nome do dispositivo (opcional)',
    example: 'iPhone 14 Pro',
    required: false,
  })
  @IsOptional()
  @IsString()
  deviceName?: string;
}

/**
 * DTO para remover Push Token
 */
export class RemovePushTokenDto {
  @ApiProperty({
    description: 'Expo Push Token a ser removido',
    example: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]',
  })
  @IsString()
  @IsNotEmpty()
  token: string;
}
