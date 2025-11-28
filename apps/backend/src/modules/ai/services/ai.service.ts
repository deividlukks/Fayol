import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '../../../prisma/prisma.service';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  // URL do serviço Python dentro da rede Docker
  // Se estiver rodando local sem docker, usar localhost:8000. Se for via docker-compose, usar http://python-ai:8000
  private readonly aiServiceUrl = process.env.AI_SERVICE_URL || 'http://python-ai:8000';

  constructor(
    private prisma: PrismaService,
    private httpService: HttpService,
  ) {}

  async predictCategory(userId: string, description: string) {
    let suggestedName: string | null = null;

    try {
      // 1. Chama o microserviço Python
      const { data } = await firstValueFrom(
        this.httpService.post(`${this.aiServiceUrl}/categorize`, {
          description,
        }),
      );
      
      suggestedName = data.category;
      this.logger.log(`IA sugeriu: ${suggestedName} para "${description}" (Confiança: ${data.confidence})`);

    } catch (error) {
      this.logger.error('Falha ao contatar serviço de IA, usando fallback local...', error);
      // Fallback silencioso se o serviço Python estiver offline
    }

    if (!suggestedName) {
      return { found: false, message: 'Não consegui identificar uma categoria.' };
    }

    // 2. Verifica se essa categoria já existe no banco (Sistema ou Usuário)
    const category = await this.prisma.category.findFirst({
      where: {
        name: { contains: suggestedName, mode: 'insensitive' },
        OR: [
          { isSystemDefault: true },
          { userId }
        ]
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
        },
      };
    }

    // 3. Se não existe no banco mas a IA sugeriu
    return {
      found: false,
      suggestedName,
      message: `Sugiro a categoria "${suggestedName}", mas ela ainda não está cadastrada.`,
    };
  }
}