import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { UsersService } from '../services/users.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '@fayol/database-models';
import { AuditInterceptor, Auditable } from '../../audit/audit.interceptor';
import { SoftDeleteService } from '../../../common/services/soft-delete.service';
import { PrismaService } from '../../../prisma/prisma.service';

@ApiTags('Admin')
@ApiBearerAuth('JWT-auth')
@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
export class AdminUsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly softDeleteService: SoftDeleteService,
    private readonly prisma: PrismaService
  ) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.SUPORTE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Lista todos os usuários (Admin)',
    description: 'Lista todos os usuários do sistema com paginação e filtros',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'pageSize', required: false, type: Number, example: 50 })
  @ApiQuery({ name: 'role', required: false, enum: UserRole })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'search', required: false, description: 'Busca por nome ou email' })
  @ApiQuery({
    name: 'includeDeleted',
    required: false,
    type: Boolean,
    description: 'Incluir usuários deletados',
  })
  @ApiResponse({ status: 200, description: 'Lista de usuários retornada com sucesso' })
  @ApiResponse({ status: 403, description: 'Sem permissão para acessar este endpoint' })
  async findAll(
    @Query('page') page = 1,
    @Query('pageSize') pageSize = 50,
    @Query('role') role?: UserRole,
    @Query('isActive') isActive?: boolean,
    @Query('search') search?: string,
    @Query('includeDeleted') includeDeleted = false
  ) {
    const skip = (page - 1) * pageSize;

    const where: any = {};

    if (role) {
      where.roles = { has: role };
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (!includeDeleted) {
      where.deletedAt = null;
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: pageSize,
        select: {
          id: true,
          name: true,
          email: true,
          roles: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          deletedAt: true,
          investorProfile: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.SUPORTE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Busca usuário por ID (Admin)' })
  @ApiParam({ name: 'id', description: 'ID do usuário' })
  @ApiResponse({ status: 200, description: 'Usuário encontrado' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findOne(id); // Usa findOne que existe

    // Remove senha do retorno
    const { passwordHash, ...userWithoutPassword } = user;

    return userWithoutPassword;
  }

  @Patch(':id/roles')
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @Auditable('User', 'UPDATE')
  @ApiOperation({
    summary: 'Atualiza roles de um usuário (Super Admin)',
    description: 'Apenas SUPER_ADMIN pode alterar roles de usuários',
  })
  @ApiParam({ name: 'id', description: 'ID do usuário' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        roles: {
          type: 'array',
          items: { enum: Object.values(UserRole) },
          example: [UserRole.USER, UserRole.ADMIN],
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Roles atualizadas com sucesso' })
  @ApiResponse({ status: 403, description: 'Apenas SUPER_ADMIN pode alterar roles' })
  async updateRoles(@Param('id') id: string, @Body('roles') roles: UserRole[]) {
    const user = await this.prisma.user.update({
      where: { id },
      data: { roles },
    });

    const { passwordHash, ...userWithoutPassword } = user;

    return userWithoutPassword;
  }

  @Patch(':id/activate')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @Auditable('User', 'UPDATE')
  @ApiOperation({ summary: 'Ativa um usuário (Admin)' })
  @ApiParam({ name: 'id', description: 'ID do usuário' })
  @ApiResponse({ status: 200, description: 'Usuário ativado com sucesso' })
  async activate(@Param('id') id: string) {
    const user = await this.prisma.user.update({
      where: { id },
      data: { isActive: true },
    });

    const { passwordHash, ...userWithoutPassword } = user;

    return userWithoutPassword;
  }

  @Patch(':id/deactivate')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @Auditable('User', 'UPDATE')
  @ApiOperation({ summary: 'Desativa um usuário (Admin)' })
  @ApiParam({ name: 'id', description: 'ID do usuário' })
  @ApiResponse({ status: 200, description: 'Usuário desativado com sucesso' })
  async deactivate(@Param('id') id: string) {
    const user = await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    const { passwordHash, ...userWithoutPassword } = user;

    return userWithoutPassword;
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @Auditable('User', 'DELETE')
  @ApiOperation({
    summary: 'Deleta um usuário (soft delete) (Super Admin)',
    description: 'Realiza soft delete do usuário. Apenas SUPER_ADMIN pode deletar usuários.',
  })
  @ApiParam({ name: 'id', description: 'ID do usuário' })
  @ApiResponse({ status: 200, description: 'Usuário deletado com sucesso' })
  @ApiResponse({ status: 403, description: 'Apenas SUPER_ADMIN pode deletar usuários' })
  async remove(@Param('id') id: string) {
    const user = await this.softDeleteService.softDelete('user', id);

    return {
      message: 'Usuário deletado com sucesso',
      userId: user.id,
      deletedAt: user.deletedAt,
    };
  }

  @Patch(':id/restore')
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @Auditable('User', 'RESTORE')
  @ApiOperation({
    summary: 'Restaura um usuário deletado (Super Admin)',
    description: 'Restaura um usuário que foi soft deleted',
  })
  @ApiParam({ name: 'id', description: 'ID do usuário' })
  @ApiResponse({ status: 200, description: 'Usuário restaurado com sucesso' })
  async restore(@Param('id') id: string) {
    const user = await this.softDeleteService.restore('user', id);

    const { passwordHash, ...userWithoutPassword } = user;

    return {
      message: 'Usuário restaurado com sucesso',
      user: userWithoutPassword,
    };
  }

  @Get('stats/overview')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Estatísticas gerais de usuários (Admin)',
    description: 'Retorna estatísticas agregadas sobre os usuários do sistema',
  })
  @ApiResponse({ status: 200, description: 'Estatísticas retornadas com sucesso' })
  async stats() {
    const [totalUsers, activeUsers, deletedUsers, usersLast30Days] = await Promise.all([
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.user.count({ where: { isActive: true, deletedAt: null } }),
      this.prisma.user.count({ where: { deletedAt: { not: null } } }),
      this.prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
          deletedAt: null,
        },
      }),
    ]);

    return {
      totalUsers,
      activeUsers,
      inactiveUsers: totalUsers - activeUsers,
      deletedUsers,
      usersLast30Days,
      growthRate: totalUsers > 0 ? ((usersLast30Days / totalUsers) * 100).toFixed(2) : '0.00',
    };
  }
}
