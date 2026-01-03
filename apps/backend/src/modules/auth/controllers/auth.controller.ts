import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Get,
  Request,
  Response,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { UsersService } from '../../users/services/users.service';
import { LoginDto, RegisterDto } from '../dto/auth.dto';
import { ForgotPasswordDto, ResetPasswordDto } from '../dto/forgot-password.dto';
import {
  Setup2FADto,
  Verify2FASetupDto,
  Verify2FALoginDto,
  Disable2FADto,
  RegenerateBackupCodesDto,
  Use2FABackupCodeDto,
} from '../dto/two-factor.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { TwoFactorService } from '../services/two-factor.service';
import {
  validatePassword,
  getPasswordStrength,
  getPasswordSuggestions,
} from '../../../common/utils/password-validator';

@ApiTags('Auth')
@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
    private twoFactorService: TwoFactorService
  ) {}

  @Post('check')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verifica se um usuário existe e retorna metadados básicos' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { identifier: { type: 'string', example: 'user@email.com' } },
    },
  })
  @ApiResponse({ status: 200, description: 'Retorna { exists: boolean, name?: string }.' })
  async check(@Body('identifier') identifier: string) {
    return this.authService.checkUserExistence(identifier);
  }

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // Limite: 5 tentativas por minuto por IP
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Realiza login e configura cookie httpOnly com JWT' })
  @ApiResponse({ status: 200, description: 'Login realizado com sucesso.' })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas.' })
  @ApiResponse({ status: 429, description: 'Muitas tentativas. Tente novamente mais tarde.' })
  async login(@Body() loginDto: LoginDto, @Response({ passthrough: true }) res) {
    const result = await this.authService.login(loginDto);

    // Se retornou requiresTwoFactor, não configura cookie ainda
    if ('requiresTwoFactor' in result) {
      return result;
    }

    // Configura cookie httpOnly com o token JWT
    res.cookie('access_token', result.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // HTTPS apenas em produção
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 24 horas
      domain: process.env.COOKIE_DOMAIN || 'localhost', // .fayol.app em produção
      path: '/',
    });

    // Retorna apenas informações do usuário (não o token)
    return {
      user: result.user,
      message: 'Login realizado com sucesso.',
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Retorna informações do usuário autenticado via cookie' })
  @ApiResponse({ status: 200, description: 'Usuário autenticado.' })
  @ApiResponse({ status: 401, description: 'Não autenticado.' })
  async getMe(@Request() req) {
    const user = await this.usersService.findOne(req.user.userId);

    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado.');
    }

    // Remove senha do retorno
    const { passwordHash, twoFactorSecret, ...userWithoutSensitive } = user;

    return { user: userWithoutSensitive };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Realiza logout e limpa o cookie' })
  @ApiResponse({ status: 200, description: 'Logout realizado com sucesso.' })
  async logout(@Response({ passthrough: true }) res) {
    // Limpa o cookie
    res.clearCookie('access_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      domain: process.env.COOKIE_DOMAIN || 'localhost', // .fayol.app em produção
      path: '/',
    });

    return { message: 'Logout realizado com sucesso.' };
  }

  @Post('register')
  @Throttle({ default: { limit: 3, ttl: 3600000 } }) // Limite: 3 criações de conta por hora por IP (Anti-spam)
  @ApiOperation({ summary: 'Registra um novo usuário' })
  @ApiResponse({ status: 201, description: 'Usuário criado com sucesso.' })
  @ApiResponse({ status: 409, description: 'E-mail já cadastrado.' })
  async register(@Body() registerDto: RegisterDto) {
    return this.usersService.create(registerDto);
  }

  @Post('forgot-password')
  @Throttle({ 'forgot-password': { limit: 3, ttl: 900000 } }) // 3 tentativas a cada 15 minutos
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Solicita reset de senha - envia email com token' })
  @ApiResponse({ status: 200, description: 'Email de recuperação enviado (se o email existir).' })
  @ApiResponse({
    status: 429,
    description: 'Muitas tentativas. Aguarde 15 minutos antes de tentar novamente.',
  })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('reset-password')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 tentativas por minuto (protege contra brute force do token)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reseta a senha usando o token recebido por email' })
  @ApiResponse({ status: 200, description: 'Senha alterada com sucesso.' })
  @ApiResponse({ status: 400, description: 'Token inválido ou expirado.' })
  @ApiResponse({
    status: 429,
    description: 'Muitas tentativas. Aguarde antes de tentar novamente.',
  })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  // ==================== TWO-FACTOR AUTHENTICATION ENDPOINTS ====================

  @Post('2fa/setup')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Inicia configuração de 2FA - gera QR code e backup codes' })
  @ApiResponse({ status: 200, description: 'QR code e backup codes gerados com sucesso.' })
  @ApiResponse({ status: 401, description: 'Senha incorreta.' })
  @ApiResponse({ status: 400, description: '2FA já está ativado.' })
  async setup2FA(@Request() req, @Body() setup2FADto: Setup2FADto) {
    return this.twoFactorService.setup2FA(req.user.userId, setup2FADto.password);
  }

  @Post('2fa/verify-setup')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verifica código TOTP e ativa 2FA' })
  @ApiResponse({ status: 200, description: '2FA ativado com sucesso.' })
  @ApiResponse({ status: 400, description: 'Código inválido ou 2FA não configurado.' })
  async verifySetup(@Request() req, @Body() verify2FASetupDto: Verify2FASetupDto) {
    return this.twoFactorService.verifySetup(req.user.userId, verify2FASetupDto.code);
  }

  @Post('2fa/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verifica código TOTP durante login e completa autenticação' })
  @ApiResponse({ status: 200, description: 'Login completado com sucesso.' })
  @ApiResponse({ status: 401, description: 'Código inválido ou token temporário expirado.' })
  async verify2FALogin(@Body() verify2FALoginDto: Verify2FALoginDto) {
    return this.authService.verify2FALogin(verify2FALoginDto.tempToken, verify2FALoginDto.code);
  }

  @Post('2fa/verify-backup')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verifica backup code durante login e completa autenticação' })
  @ApiResponse({ status: 200, description: 'Login completado com sucesso usando backup code.' })
  @ApiResponse({ status: 401, description: 'Backup code inválido ou token temporário expirado.' })
  async verify2FABackupCode(@Body() use2FABackupCodeDto: Use2FABackupCodeDto) {
    return this.authService.verify2FABackupCode(
      use2FABackupCodeDto.tempToken,
      use2FABackupCodeDto.backupCode
    );
  }

  @Post('2fa/disable')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Desativa 2FA - requer senha e código TOTP' })
  @ApiResponse({ status: 200, description: '2FA desativado com sucesso.' })
  @ApiResponse({ status: 401, description: 'Senha ou código incorretos.' })
  @ApiResponse({ status: 400, description: '2FA não está ativado.' })
  async disable2FA(@Request() req, @Body() disable2FADto: Disable2FADto) {
    return this.twoFactorService.disable2FA(
      req.user.userId,
      disable2FADto.password,
      disable2FADto.code
    );
  }

  @Post('2fa/regenerate-backup-codes')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Regenera backup codes - requer senha' })
  @ApiResponse({ status: 200, description: 'Backup codes regenerados com sucesso.' })
  @ApiResponse({ status: 401, description: 'Senha incorreta.' })
  @ApiResponse({ status: 400, description: '2FA não está ativado.' })
  async regenerateBackupCodes(
    @Request() req,
    @Body() regenerateBackupCodesDto: RegenerateBackupCodesDto
  ) {
    return this.twoFactorService.regenerateBackupCodes(
      req.user.userId,
      regenerateBackupCodesDto.password
    );
  }

  @Get('2fa/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Retorna status do 2FA do usuário' })
  @ApiResponse({ status: 200, description: 'Status do 2FA retornado com sucesso.' })
  async get2FAStatus(@Request() req) {
    return this.twoFactorService.get2FAStatus(req.user.userId);
  }

  // ==================== PASSWORD VALIDATION ====================

  @Post('validate-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Valida força da senha',
    description:
      'Endpoint público para validar se uma senha atende aos requisitos de segurança. Útil para feedback em tempo real no frontend.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        password: { type: 'string', example: 'SenhaForte123!' },
      },
      required: ['password'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Resultado da validação da senha.',
    schema: {
      type: 'object',
      properties: {
        isValid: { type: 'boolean', example: true },
        strength: { type: 'number', example: 85, description: 'Força da senha de 0 a 100' },
        errors: {
          type: 'array',
          items: { type: 'string' },
          example: ['A senha deve conter pelo menos uma letra maiúscula.'],
        },
        suggestions: {
          type: 'array',
          items: { type: 'string' },
          example: ['Adicione letras maiúsculas.', 'Adicione números.'],
        },
        requirements: {
          type: 'object',
          properties: {
            minLength: { type: 'number', example: 8 },
            mustContain: {
              type: 'array',
              items: { type: 'string' },
              example: [
                'Pelo menos uma letra maiúscula (A-Z)',
                'Pelo menos uma letra minúscula (a-z)',
                'Pelo menos um número (0-9)',
                'Pelo menos um caractere especial (!@#$%^&*...)',
              ],
            },
          },
        },
      },
    },
  })
  validatePasswordStrength(@Body('password') password: string) {
    const validation = validatePassword(password);
    const strength = getPasswordStrength(password);
    const suggestions = getPasswordSuggestions(password);

    return {
      isValid: validation.isValid,
      strength,
      errors: validation.errors,
      suggestions,
      requirements: {
        minLength: 8,
        mustContain: [
          'Pelo menos uma letra maiúscula (A-Z)',
          'Pelo menos uma letra minúscula (a-z)',
          'Pelo menos um número (0-9)',
          'Pelo menos um caractere especial (!@#$%^&*...)',
        ],
      },
    };
  }
}
