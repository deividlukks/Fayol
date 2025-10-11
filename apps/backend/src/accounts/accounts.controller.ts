import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('accounts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Post()
  @ApiOperation({ summary: 'Criar nova conta' })
  create(@CurrentUser() user: any, @Body() createAccountDto: CreateAccountDto) {
    return this.accountsService.create(user.id, createAccountDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar contas do usuário' })
  findAll(@CurrentUser() user: any) {
    return this.accountsService.findAll(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar conta específica' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.accountsService.findOne(id, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar conta' })
  update(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() updateAccountDto: UpdateAccountDto,
  ) {
    return this.accountsService.update(id, user.id, updateAccountDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover conta' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.accountsService.remove(id, user.id);
  }
}
