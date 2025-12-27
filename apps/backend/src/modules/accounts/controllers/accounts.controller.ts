import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { AccountsService } from '../services/accounts.service'; // Import Ajustado
import { CreateAccountDto, UpdateAccountDto } from '../dto/accounts.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { User } from '@fayol/database-models';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Accounts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Post()
  @ApiOperation({ summary: 'Cria uma nova conta bancária/carteira' })
  create(@CurrentUser() user: User, @Body() createAccountDto: CreateAccountDto) {
    return this.accountsService.create(user.id, createAccountDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista todas as contas ativas do usuário' })
  findAll(@CurrentUser() user: User) {
    return this.accountsService.findAll(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca detalhes de uma conta' })
  findOne(@CurrentUser() user: User, @Param('id') id: string) {
    return this.accountsService.findOne(id, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza dados da conta' })
  update(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() updateAccountDto: UpdateAccountDto
  ) {
    return this.accountsService.update(id, user.id, updateAccountDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Arquiva uma conta (Soft Delete)' })
  remove(@CurrentUser() user: User, @Param('id') id: string) {
    return this.accountsService.remove(id, user.id);
  }
}
