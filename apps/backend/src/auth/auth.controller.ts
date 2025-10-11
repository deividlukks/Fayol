import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  Get,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { CheckFayolIdDto } from './dto/check-fayol-id.dto';
import { VerifyPasswordDto } from './dto/verify-password.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Registrar novo usuário' })
  @ApiResponse({ status: 201, description: 'Usuário criado com sucesso' })
  @ApiResponse({ status: 409, description: 'Email ou telefone já cadastrado' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Autenticar usuário (Legado)',
    description:
      'Método tradicional de login. Use /auth/check-id e /auth/verify-password para login em duas etapas.',
    deprecated: true,
  })
  @ApiResponse({ status: 200, description: 'Login realizado com sucesso' })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('check-id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verificar Fayol ID - Etapa 1 do login',
    description:
      'Verifica se o Fayol ID (email, telefone ou CPF) existe e retorna informações básicas do usuário.',
  })
  @ApiResponse({ status: 200, description: 'Fayol ID encontrado' })
  @ApiResponse({ status: 400, description: 'Fayol ID inválido' })
  @ApiResponse({ status: 401, description: 'Fayol ID não encontrado ou conta inativa' })
  async checkFayolId(@Body() checkFayolIdDto: CheckFayolIdDto) {
    return this.authService.checkFayolId(checkFayolIdDto);
  }

  @Post('verify-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verificar senha - Etapa 2 do login',
    description: 'Completa o processo de login verificando a senha do usuário.',
  })
  @ApiResponse({ status: 200, description: 'Login realizado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Senha incorreta' })
  async verifyPassword(@Body() verifyPasswordDto: VerifyPasswordDto) {
    return this.authService.verifyPassword(verifyPasswordDto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Renovar token de acesso' })
  @ApiResponse({ status: 200, description: 'Token renovado com sucesso' })
  @ApiResponse({ status: 401, description: 'Token inválido' })
  async refresh(@Request() req) {
    return this.authService.refresh(req.user.userId, req.user.email);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Encerrar sessão' })
  @ApiResponse({ status: 200, description: 'Logout realizado com sucesso' })
  async logout() {
    return {
      message: 'Logout realizado com sucesso',
    };
  }

  // ============================================
  // 2FA (Two-Factor Authentication) Endpoints
  // ============================================

  @Post('2fa/generate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Gerar secret 2FA e QR Code' })
  @ApiResponse({ status: 200, description: 'Secret e QR Code gerados' })
  @ApiResponse({ status: 400, description: '2FA já está ativado' })
  async generateTwoFactorSecret(@CurrentUser() user: any) {
    return this.authService.generateTwoFactorSecret(user.id);
  }

  @Post('2fa/enable')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ativar 2FA com verificação de código' })
  @ApiResponse({ status: 200, description: '2FA ativado com sucesso' })
  @ApiResponse({ status: 400, description: 'Código 2FA inválido ou 2FA já ativado' })
  async enableTwoFactor(@CurrentUser() user: any, @Body() body: { token: string }) {
    return this.authService.enableTwoFactor(user.id, body.token);
  }

  @Post('2fa/disable')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Desativar 2FA' })
  @ApiResponse({ status: 200, description: '2FA desativado com sucesso' })
  @ApiResponse({ status: 400, description: 'Código 2FA inválido ou 2FA não está ativado' })
  async disableTwoFactor(@CurrentUser() user: any, @Body() body: { token: string }) {
    return this.authService.disableTwoFactor(user.id, body.token);
  }

  @Get('2fa/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verificar status do 2FA' })
  @ApiResponse({ status: 200, description: 'Status do 2FA' })
  async getTwoFactorStatus(@CurrentUser() user: any) {
    return this.authService.getTwoFactorStatus(user.id);
  }

  @Post('login-2fa')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Login com suporte a 2FA',
    description:
      'Login que verifica se o usuário tem 2FA ativado e solicita o código quando necessário.',
  })
  @ApiResponse({ status: 200, description: 'Login realizado com sucesso ou código 2FA necessário' })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas ou código 2FA incorreto' })
  async loginWithTwoFactor(
    @Body() body: { fayolId: string; password: string; twoFactorToken?: string },
  ) {
    return this.authService.loginWithTwoFactor(body.fayolId, body.password, body.twoFactorToken);
  }
}
