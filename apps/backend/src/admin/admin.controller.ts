import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { CheckAdminIdDto } from './dto/check-admin-id.dto';
import { VerifyAdminPasswordDto } from './dto/verify-admin-password.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('admin-auth')
@Controller('admin/auth')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('check-id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verificar Admin Fayol ID - Etapa 1 do login admin',
    description:
      'Verifica se o Admin Fayol ID (email, telefone ou CPF) existe e retorna informações básicas.',
  })
  @ApiResponse({ status: 200, description: 'Admin Fayol ID encontrado' })
  @ApiResponse({ status: 400, description: 'Fayol ID inválido' })
  @ApiResponse({ status: 401, description: 'Admin não encontrado ou conta inativa' })
  async checkAdminId(@Body() checkAdminIdDto: CheckAdminIdDto) {
    return this.adminService.checkAdminId(checkAdminIdDto);
  }

  @Post('verify-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verificar senha admin - Etapa 2 do login admin',
    description: 'Completa o processo de login administrativo verificando a senha.',
  })
  @ApiResponse({ status: 200, description: 'Login admin realizado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Senha incorreta' })
  async verifyAdminPassword(@Body() verifyPasswordDto: VerifyAdminPasswordDto) {
    return this.adminService.verifyAdminPassword(verifyPasswordDto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout administrativo' })
  @ApiResponse({ status: 200, description: 'Logout realizado com sucesso' })
  async logout(@Request() req) {
    return this.adminService.logout(req.user.userId);
  }
}
