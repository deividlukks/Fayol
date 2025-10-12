import { Body, Controller, Get, HttpException, HttpStatus, Logger, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from './ai.service';
import { SpendingAnalysis } from './dto/analyze-spending.dto';

@ApiTags('AI')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiController {
  private readonly logger = new Logger(AiController.name);

  constructor(
    private readonly aiService: AiService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('analyze-spending')
  @ApiOperation({ summary: 'Analisa os gastos do utilizador' })
  @ApiResponse({
    status: 200,
    description: 'Análise de gastos retornada com sucesso.',
    type: SpendingAnalysis,
  })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 500, description: 'Erro interno do servidor.' })
  async analyzeSpending(
    @CurrentUser() user: { sub: string },
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    if (!user || !user.sub) {
      throw new HttpException('Utilizador não autenticado', HttpStatus.UNAUTHORIZED);
    }
    const userId = user.sub;
    this.logger.log(`A iniciar a análise de gastos para o utilizador ${userId}`);

    try {
      const dateFilter: { gte?: Date; lte?: Date } = {};
      if (startDate) {
        dateFilter.gte = new Date(startDate);
      }
      if (endDate) {
        dateFilter.lte = new Date(endDate);
      }

      const rawTransactions = await this.prisma.transaction.findMany({
        where: {
          userId,
          ...(startDate || endDate ? { effectiveDate: dateFilter } : {}),
        },
        include: {
          category: true,
          subcategory: true,
        },
        orderBy: {
          effectiveDate: 'asc',
        },
      });

      if (rawTransactions.length === 0) {
        this.logger.warn(`Nenhuma transação encontrada para o utilizador ${userId} no período especificado.`);
        // Retorna uma análise vazia, mas válida
        return this.aiService.analyzeSpending(userId, []);
      }

      const transactions = rawTransactions.map((t) => {
        if (!t.movementType) {
            this.logger.warn(`Transação ${t.id} sem movementType. A ignorar.`);
            return null;
        }
        return {
            id: t.id,
            date: new Date(t.effectiveDate || t.createdAt),
            description: t.description || '',
            amount: Number(t.amount),
            movementType: t.movementType as 'income' | 'expense', // ✅ CORREÇÃO: Adicionado o mapeamento de `movementType`.
            category: t.category?.name,
            subcategory: t.subcategory?.name,
        };
      }).filter(t => t !== null);


      const analysis = this.aiService.analyzeSpending(userId, transactions);

      // Detetar anomalias de forma assíncrona (não bloquear a resposta)
      this.aiService.detectAnomalies(userId, transactions).catch(err => {
          this.logger.error(`Erro ao detetar anomalias em segundo plano: ${err.message}`, err.stack);
      });

      this.logger.log(`Análise de gastos concluída com sucesso para o utilizador ${userId}`);
      return analysis;
    } catch (error) {
      this.logger.error(
        `Falha ao analisar os gastos do utilizador ${userId}: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        'Ocorreu um erro ao processar a sua solicitação.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('suggest-category')
  @ApiOperation({ summary: 'Sugere categoria e subcategoria para uma transação' })
  @ApiResponse({
    status: 200,
    description: 'Categoria sugerida com sucesso.',
    schema: {
      type: 'object',
      properties: {
        category: { type: 'string', example: 'Alimentação' },
        subcategory: { type: 'string', example: 'Restaurantes' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 500, description: 'Erro interno do servidor.' })
  async suggestCategory(
    @CurrentUser() user: { sub: string },
    @Body('description') description: string,
  ) {
    if (!user || !user.sub) {
      throw new HttpException('Utilizador não autenticado', HttpStatus.UNAUTHORIZED);
    }

    if (!description || description.trim().length === 0) {
      throw new HttpException('Descrição é obrigatória', HttpStatus.BAD_REQUEST);
    }

    this.logger.log(`Sugerindo categoria para descrição: "${description}"`);

    try {
      const suggestion = await this.aiService.suggestCategory(description);
      this.logger.log(`Categoria sugerida: ${suggestion.category} / ${suggestion.subcategory}`);
      return suggestion;
    } catch (error) {
      this.logger.error(
        `Falha ao sugerir categoria para descrição "${description}": ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        'Ocorreu um erro ao processar a sua solicitação.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
