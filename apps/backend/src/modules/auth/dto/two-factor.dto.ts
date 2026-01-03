import { IsString, IsNotEmpty, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class Setup2FADto {
  @ApiProperty({
    description: 'User password for verification',
    example: 'MySecurePassword123',
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class Verify2FASetupDto {
  @ApiProperty({
    description: '6-digit TOTP code from authenticator app',
    example: '123456',
    minLength: 6,
    maxLength: 6,
  })
  @IsString()
  @Length(6, 6)
  code: string;
}

export class Verify2FALoginDto {
  @ApiProperty({
    description: 'Temporary token from login step 1',
    example: 'abc123def456...',
  })
  @IsString()
  @IsNotEmpty()
  tempToken: string;

  @ApiProperty({
    description: '6-digit TOTP code',
    example: '123456',
    minLength: 6,
    maxLength: 6,
  })
  @IsString()
  @Length(6, 6)
  code: string;
}

export class Disable2FADto {
  @ApiProperty({
    description: 'User password for verification',
    example: 'MySecurePassword123',
  })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({
    description: 'Current 6-digit TOTP code',
    example: '123456',
    minLength: 6,
    maxLength: 6,
  })
  @IsString()
  @Length(6, 6)
  code: string;
}

export class RegenerateBackupCodesDto {
  @ApiProperty({
    description: 'User password for verification',
    example: 'MySecurePassword123',
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class Use2FABackupCodeDto {
  @ApiProperty({
    description: 'Temporary token from login step 1',
    example: 'abc123def456...',
  })
  @IsString()
  @IsNotEmpty()
  tempToken: string;

  @ApiProperty({
    description: 'One of the backup codes',
    example: 'A1B2C3D4E5',
  })
  @IsString()
  @IsNotEmpty()
  backupCode: string;
}
