import { Controller, Get, Query, UseGuards, HttpStatus, HttpCode } from '@nestjs/common';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole, AuditAction } from '@fayol/database-models';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

@ApiTags('Audit')
@ApiBearerAuth()
@Controller('audit')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.SUPORTE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lista logs de auditoria com filtros' })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'entity', required: false })
  @ApiQuery({ name: 'entityId', required: false })
  @ApiQuery({ name: 'action', required: false, enum: AuditAction })
  @ApiQuery({ name: 'startDate', required: false, type: Date })
  @ApiQuery({ name: 'endDate', required: false, type: Date })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  async findAll(
    @Query('userId') userId?: string,
    @Query('entity') entity?: string,
    @Query('entityId') entityId?: string,
    @Query('action') action?: AuditAction,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page = 1,
    @Query('pageSize') pageSize = 50
  ) {
    const skip = (page - 1) * pageSize;

    return this.auditService.findAll({
      userId,
      entity,
      entityId,
      action,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      skip,
      take: pageSize,
    });
  }

  @Get('entity')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.SUPORTE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lista logs de uma entidade específica' })
  @ApiQuery({ name: 'entity', required: true })
  @ApiQuery({ name: 'entityId', required: true })
  async findByEntity(@Query('entity') entity: string, @Query('entityId') entityId: string) {
    return this.auditService.findByEntity(entity, entityId);
  }

  @Get('user')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.SUPORTE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lista logs de um usuário específico' })
  @ApiQuery({ name: 'userId', required: true })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  async findByUser(
    @Query('userId') userId: string,
    @Query('page') page = 1,
    @Query('pageSize') pageSize = 50
  ) {
    const skip = (page - 1) * pageSize;
    return this.auditService.findByUser(userId, skip, pageSize);
  }
}
