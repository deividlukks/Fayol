import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Delete,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UsersService } from '../services/users.service';
import { UserDeletionService } from '../services/user-deletion.service';
import { UpdateUserDto } from '../dto/users.dto';
import { RegisterDto } from '../../auth/dto/auth.dto';
import { UpdateOnboardingDto } from '../dto/onboarding.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { RegisterPushTokenDto, RemovePushTokenDto } from '../dto/push-token.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { User } from '@fayol/database-models';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly userDeletionService: UserDeletionService
  ) {}

  @Post()
  @ApiOperation({ summary: 'Cria um novo usuário (Rota de Admin/Dev)' })
  create(@Body() createUserDto: RegisterDto) {
    return this.usersService.create(createUserDto);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Busca um usuário pelo ID' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch('onboarding/step')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualiza o progresso do onboarding do usuário' })
  updateOnboarding(@CurrentUser() user: User, @Body() dto: UpdateOnboardingDto) {
    // CORREÇÃO: Removemos 'step' do objeto antes de passar para o service/prisma
    // O Prisma quebraria se recebesse um campo que não existe no banco
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { step, ...dataToUpdate } = dto;

    return this.usersService.update(user.id, {
      ...dataToUpdate,
      onboardingStep: dto.step, // Mapeamos para o nome correto da coluna
    } as any);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualiza dados do usuário' })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Altera a senha do usuário',
    description:
      'Permite que o usuário autenticado altere sua senha. Requer senha atual e nova senha forte.',
  })
  @ApiResponse({
    status: 200,
    description: 'Senha alterada com sucesso.',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Senha alterada com sucesso.' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Senha atual incorreta ou nova senha não atende aos requisitos.',
  })
  @ApiResponse({ status: 401, description: 'Não autenticado.' })
  async changePassword(@CurrentUser() user: User, @Body() changePasswordDto: ChangePasswordDto) {
    // Valida se as senhas coincidem
    if (changePasswordDto.newPassword !== changePasswordDto.confirmPassword) {
      throw new BadRequestException('Nova senha e confirmação não coincidem.');
    }

    await this.usersService.changePassword(
      user.id,
      changePasswordDto.currentPassword,
      changePasswordDto.newPassword
    );

    return {
      message: 'Senha alterada com sucesso.',
    };
  }

  @Get('deletion/can-delete')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verifica se o usuário pode ser deletado (LGPD)' })
  canDelete(@CurrentUser() user: User) {
    return this.userDeletionService.canDeleteUser(user.id);
  }

  @Post('deletion/schedule')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Agenda deleção da conta (LGPD - Right to Erasure)' })
  scheduleDeletion(@CurrentUser() user: User) {
    return this.userDeletionService.scheduleDeletion(user.id, 30);
  }

  @Post('deletion/cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancela deleção agendada da conta' })
  cancelDeletion(@CurrentUser() user: User) {
    return this.userDeletionService.cancelScheduledDeletion(user.id);
  }

  @Delete('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Deleta permanentemente a conta e todos os dados (LGPD - Right to Erasure)',
    description:
      'ATENÇÃO: Esta operação é irreversível! Todos os dados do usuário serão permanentemente deletados.',
  })
  deleteMyAccount(@CurrentUser() user: User, @Body('confirmEmail') confirmEmail: string) {
    return this.userDeletionService.deleteUserData(user.id, confirmEmail);
  }

  // ==========================================
  // PUSH NOTIFICATIONS ENDPOINTS
  // ==========================================

  @Post('push-token')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Registra um push token para notificações',
    description: 'Salva o Expo Push Token do dispositivo para envio de notificações push',
  })
  @ApiResponse({
    status: 200,
    description: 'Push token registrado com sucesso.',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Push token registrado com sucesso.' },
        tokensCount: { type: 'number', example: 2 },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Não autenticado.' })
  async registerPushToken(@CurrentUser() user: User, @Body() dto: RegisterPushTokenDto) {
    const updatedUser = await this.usersService.registerPushToken(user.id, dto.token);

    return {
      message: 'Push token registrado com sucesso.',
      tokensCount: updatedUser.pushTokens.length,
    };
  }

  @Delete('push-token')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Remove um push token específico',
    description: 'Remove o Expo Push Token de um dispositivo específico',
  })
  @ApiResponse({
    status: 200,
    description: 'Push token removido com sucesso.',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Push token removido com sucesso.' },
        tokensCount: { type: 'number', example: 1 },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Não autenticado.' })
  async removePushToken(@CurrentUser() user: User, @Body() dto: RemovePushTokenDto) {
    const updatedUser = await this.usersService.removePushToken(user.id, dto.token);

    return {
      message: 'Push token removido com sucesso.',
      tokensCount: updatedUser.pushTokens.length,
    };
  }

  @Delete('push-token/all')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Remove todos os push tokens',
    description:
      'Remove todos os Expo Push Tokens do usuário. Útil ao fazer logout de todos os dispositivos.',
  })
  @ApiResponse({
    status: 200,
    description: 'Todos os push tokens foram removidos.',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Todos os push tokens foram removidos.' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Não autenticado.' })
  async removeAllPushTokens(@CurrentUser() user: User) {
    await this.usersService.removeAllPushTokens(user.id);

    return {
      message: 'Todos os push tokens foram removidos.',
    };
  }

  @Get('push-token')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Lista todos os push tokens do usuário',
    description: 'Retorna todos os Expo Push Tokens registrados para o usuário',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de push tokens.',
    schema: {
      type: 'object',
      properties: {
        tokens: {
          type: 'array',
          items: { type: 'string' },
          example: [
            'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]',
            'ExponentPushToken[yyyyyyyyyyyyyyyyyyyyyy]',
          ],
        },
        count: { type: 'number', example: 2 },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Não autenticado.' })
  async getPushTokens(@CurrentUser() user: User) {
    const tokens = await this.usersService.getPushTokens(user.id);

    return {
      tokens,
      count: tokens.length,
    };
  }
}
