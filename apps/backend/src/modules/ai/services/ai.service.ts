import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '../../../prisma/prisma.service';
import { firstValueFrom } from 'rxjs';
import { InsightResponse, TransactionInput } from '../dto/ai.dto';
import { subMonths } from 'date-fns';
import { LaunchType } from '@fayol/shared-types';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly aiServiceUrl: string;

  constructor(
    private prisma: PrismaService,
    private httpService: HttpService
  ) {
    // Lógica Híbrida para Desenvolvimento:
    // 1. Se AI_SERVICE_URL estiver definido no .env, usa ele.
    // 2. Se não, assume que se estiver rodando localmente (fora do container backend), a IA está em localhost:8000
    //    (mapeada pelo Docker Compose).
    // 3. Se estiver dentro da rede do Docker, os nomes de serviço (python-ai) funcionam.

    const envUrl = process.env.AI_SERVICE_URL;

    if (envUrl) {
      this.aiServiceUrl = envUrl;
    } else {
      // Fallback inteligente para desenvolvimento local
      this.aiServiceUrl = 'http://localhost:8000';
    }

    this.logger.log(`🤖 AI Service configurado para: ${this.aiServiceUrl}`);
  }

  // --- CATEGORIZAÇÃO ---
  async predictCategory(userId: string, description: string) {
    let suggestedName: string | null = null;

    try {
      const { data } = await firstValueFrom(
        this.httpService.post(`${this.aiServiceUrl}/categorize`, {
          description,
        })
      );

      suggestedName = data.category;
    } catch (error: any) {
      // Logs menos verbosos em desenvolvimento para não poluir o terminal se a IA estiver offline
      const errorMessage = error.message || 'Erro desconhecido';
      this.logger.warn(`IA indisponível para categorização: ${errorMessage}`);
    }

    if (!suggestedName) {
      return { found: false, message: 'Não consegui identificar uma categoria.' };
    }

    const category = await this.prisma.category.findFirst({
      where: {
        name: { contains: suggestedName, mode: 'insensitive' },
        OR: [{ isSystemDefault: true }, { userId }],
      },
    });

    if (category) {
      return {
        found: true,
        category: {
          id: category.id,
          name: category.name,
          icon: category.icon,
          color: category.color,
          type: category.type,
        },
      };
    }

    return {
      found: false,
      suggestedName,
      message: `Sugiro a categoria "${suggestedName}", mas ela ainda não está cadastrada.`,
    };
  }

  // --- INSIGHTS ---
  async generateInsights(userId: string): Promise<InsightResponse[]> {
    try {
      const startDate = subMonths(new Date(), 3);

      const transactions = await this.prisma.transaction.findMany({
        where: {
          userId,
          date: { gte: startDate },
          isPaid: true,
        },
        include: { category: true },
        orderBy: { date: 'asc' },
      });

      if (transactions.length === 0) return [];

      const payload: TransactionInput[] = transactions.map((t) => ({
        amount: Number(t.amount),
        date: t.date.toISOString(),
        category_name: t.category?.name || 'Outros',
        type: t.type,
      }));

      const { data } = await firstValueFrom(
        this.httpService.post<InsightResponse[]>(`${this.aiServiceUrl}/insights`, {
          transactions: payload,
        })
      );

      this.logger.log(`IA gerou ${data.length} insights para o usuário ${userId}`);
      return data;
    } catch (error: any) {
      const errorMessage = error.message || 'Erro desconhecido';
      this.logger.warn(`Falha ao gerar insights via IA: ${errorMessage}`);
      return [];
    }
  }
}
