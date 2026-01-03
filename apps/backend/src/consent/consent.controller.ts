import { Controller, Get, Post, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ConsentService } from './consent.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ConsentType, CreateConsentDto, UserConsent, ConsentSummary } from '@fayol/shared-types';
import { Request } from 'express';

@ApiTags('Consent Management (LGPD)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('consents')
export class ConsentController {
  constructor(private consentService: ConsentService) {}

  /**
   * Concede um consentimento
   */
  @Post()
  async grantConsent(@Req() req: Request, @Body() dto: CreateConsentDto): Promise<UserConsent> {
    const userId = (req.user as any).id;
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];

    return this.consentService.grantConsent(userId, dto, ipAddress, userAgent);
  }

  /**
   * Lista todos os consentimentos do usuário
   */
  @Get()
  async getUserConsents(@Req() req: Request): Promise<UserConsent[]> {
    const userId = (req.user as any).id;
    return this.consentService.getUserConsents(userId);
  }

  /**
   * Obtém resumo dos consentimentos (status atual de cada tipo)
   */
  @Get('summary')
  async getConsentSummary(@Req() req: Request): Promise<ConsentSummary> {
    const userId = (req.user as any).id;
    return this.consentService.getConsentSummary(userId);
  }

  /**
   * Retira um consentimento específico
   */
  @Delete(':type')
  async withdrawConsent(
    @Req() req: Request,
    @Param('type') type: ConsentType
  ): Promise<UserConsent> {
    const userId = (req.user as any).id;
    return this.consentService.withdrawConsent(userId, type);
  }

  /**
   * Aceita todos os consentimentos obrigatórios (usado no onboarding)
   */
  @Post('accept-mandatory')
  async acceptMandatoryConsents(@Req() req: Request): Promise<UserConsent[]> {
    const userId = (req.user as any).id;
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];

    return this.consentService.acceptMandatoryConsents(userId, ipAddress, userAgent);
  }
}
