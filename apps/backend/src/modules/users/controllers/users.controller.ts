import { Controller, Get, Post, Body, Patch, Param, UseGuards } from '@nestjs/common';
import { UsersService } from '../services/users.service';
import { UpdateUserDto } from '../dto/users.dto';
import { RegisterDto } from '../../auth/dto/auth.dto';
import { UpdateOnboardingDto } from '../dto/onboarding.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { User } from '@fayol/database-models';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

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
}
