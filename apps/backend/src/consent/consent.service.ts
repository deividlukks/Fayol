import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  ConsentType,
  ConsentStatus,
  CreateConsentDto,
  UpdateConsentDto,
  UserConsent,
  ConsentSummary,
} from '@fayol/shared-types';
import { ComplianceNotificationsService } from '../common/services/compliance-notifications.service';

@Injectable()
export class ConsentService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: ComplianceNotificationsService
  ) {}

  /**
   * Cria ou atualiza um consentimento do usuário
   */
  async grantConsent(
    userId: string,
    dto: CreateConsentDto,
    ipAddress?: string,
    userAgent?: string
  ): Promise<UserConsent> {
    // Verifica se já existe um consentimento do mesmo tipo
    const existing = await this.prisma.userConsent.findFirst({
      where: {
        userId,
        type: dto.type as any,
        status: ConsentStatus.GRANTED as any,
      },
    });

    // Se já existe e está ativo, retorna o existente
    if (existing && dto.status === ConsentStatus.GRANTED) {
      return existing as unknown as UserConsent;
    }

    // Se está negando ou retirando, atualiza o existente
    if (existing && dto.status !== ConsentStatus.GRANTED) {
      return this.updateConsent(existing.id, {
        status: dto.status,
        withdrawnAt: new Date(),
      }) as Promise<UserConsent>;
    }

    // Cria novo consentimento
    const consent = await this.prisma.userConsent.create({
      data: {
        userId,
        type: dto.type as any,
        status: dto.status as any,
        purpose: dto.purpose,
        legalBasis: dto.legalBasis,
        version: dto.version || '1.0',
        ipAddress,
        userAgent,
        expiresAt: dto.expiresAt,
        grantedAt: new Date(),
      },
    });

    return consent as unknown as UserConsent;
  }

  /**
   * Retira um consentimento (LGPD right)
   */
  async withdrawConsent(userId: string, type: ConsentType): Promise<UserConsent> {
    const consent = await this.prisma.userConsent.findFirst({
      where: {
        userId,
        type: type as any,
        status: ConsentStatus.GRANTED as any,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            email: true,
          },
        },
      },
    });

    if (!consent) {
      throw new NotFoundException(`Consent of type ${type} not found`);
    }

    const updatedConsent = (await this.updateConsent(consent.id, {
      status: ConsentStatus.WITHDRAWN,
      withdrawnAt: new Date(),
    })) as UserConsent;

    // Notifica o usuário sobre a retirada do consentimento
    // Cast manual para evitar erro de TS pois 'user' existe no retorno do findFirst acima
    const userEmail = (consent as any).user?.email;
    if (userEmail) {
      await this.notificationsService.notifyConsentWithdrawn(userId, userEmail, type);
    }

    return updatedConsent;
  }

  /**
   * Busca todos os consentimentos de um usuário
   */
  async getUserConsents(userId: string): Promise<UserConsent[]> {
    const consents = await this.prisma.userConsent.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return consents as unknown as UserConsent[];
  }

  /**
   * Busca um resumo dos consentimentos do usuário (status atual de cada tipo)
   */
  async getConsentSummary(userId: string): Promise<ConsentSummary> {
    const consents = await this.prisma.userConsent.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    // Agrupa por tipo, pegando o mais recente de cada
    const consentMap = new Map<string, any>();

    for (const consent of consents) {
      if (!consentMap.has(consent.type)) {
        consentMap.set(consent.type, {
          type: consent.type as ConsentType,
          status: consent.status as ConsentStatus,
          grantedAt: consent.grantedAt,
          withdrawnAt: consent.withdrawnAt,
        });
      }
    }

    return {
      userId,
      consents: Array.from(consentMap.values()),
    };
  }

  /**
   * Verifica se o usuário tem um consentimento ativo
   */
  async hasConsent(userId: string, type: ConsentType): Promise<boolean> {
    const consent = await this.prisma.userConsent.findFirst({
      where: {
        userId,
        type: type as any,
        status: ConsentStatus.GRANTED as any,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    });

    return !!consent;
  }

  /**
   * Atualiza um consentimento existente
   */
  private async updateConsent(id: string, dto: UpdateConsentDto): Promise<Partial<UserConsent>> {
    const updated = await this.prisma.userConsent.update({
      where: { id },
      data: {
        status: dto.status as any,
        withdrawnAt: dto.withdrawnAt,
      },
    });

    return updated as unknown as Partial<UserConsent>;
  }

  /**
   * Remove consentimentos expirados (cron job)
   */
  async expireOldConsents(): Promise<number> {
    const result = await this.prisma.userConsent.updateMany({
      where: {
        expiresAt: { lt: new Date() },
        status: ConsentStatus.GRANTED as any,
      },
      data: {
        status: ConsentStatus.EXPIRED as any,
      },
    });

    return result.count;
  }

  /**
   * Aceita todos os consentimentos obrigatórios (onboarding)
   */
  async acceptMandatoryConsents(
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<UserConsent[]> {
    const mandatoryTypes = [ConsentType.TERMS_OF_SERVICE, ConsentType.PRIVACY_POLICY];

    const consents: UserConsent[] = [];

    for (const type of mandatoryTypes) {
      const consent = await this.grantConsent(
        userId,
        {
          type,
          status: ConsentStatus.GRANTED,
          legalBasis: 'Execution of contract',
          purpose: 'Required for service usage',
        },
        ipAddress,
        userAgent
      );
      consents.push(consent);
    }

    return consents;
  }
}
