import { Injectable } from '@nestjs/common';
import { CategorizerService } from '@fayol/ai-services';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class AiService {
  private categorizer: CategorizerService;

  constructor(private prisma: PrismaService) {
    this.categorizer = new CategorizerService();
  }

  async predictCategory(userId: string, description: string) {
    // 1. Pede sugestão para a lib de IA
    const suggestedName = this.categorizer.predictCategory(description);

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

    // 3. Se não existe, retorna apenas o nome sugerido
    return {
      found: false,
      suggestedName,
      message: `Sugiro a categoria "${suggestedName}", mas ela ainda não está cadastrada.`,
    };
  }
}