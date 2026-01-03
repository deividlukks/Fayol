import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '../../../prisma/prisma.service';
import { ExportOptionsDto } from '../dto/export-options.dto';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { firstValueFrom } from 'rxjs';
import { LaunchType } from '@fayol/shared-types';

@Injectable()
export class ExportService {
  private readonly logger = new Logger(ExportService.name);
  private readonly reportServiceUrl = process.env.REPORTS_SERVICE_URL || 'http://bi-reports:8001';

  constructor(
    private prisma: PrismaService,
    private httpService: HttpService
  ) {}

  private getDateRange(dto: ExportOptionsDto) {
    const now = new Date();
    return {
      startDate: dto.startDate || startOfMonth(now),
      endDate: dto.endDate || endOfMonth(now),
    };
  }

  async generateReport(userId: string, dto: ExportOptionsDto): Promise<Buffer> {
    const { startDate, endDate } = this.getDateRange(dto);

    // 1. Buscar Usuário
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    // 2. Buscar Transações do Período
    const transactions = await this.prisma.transaction.findMany({
      where: {
        userId,
        date: { gte: startDate, lte: endDate },
        isPaid: true,
      },
      include: {
        category: true,
        account: true,
      },
      orderBy: { date: 'asc' },
    });

    // 3. Calcular Resumo
    const income = transactions
      .filter((t) => t.type === LaunchType.INCOME)
      .reduce((acc, t) => acc + Number(t.amount), 0);

    const expense = transactions
      .filter((t) => t.type === LaunchType.EXPENSE)
      .reduce((acc, t) => acc + Number(t.amount), 0);

    // 4. Montar Payload para o Microserviço Python
    const payload = {
      title: dto.type === 'PDF' ? 'Relatório Mensal' : 'Extrato de Transações',
      period: `${format(startDate, 'dd/MM/yyyy')} a ${format(endDate, 'dd/MM/yyyy')}`,
      user_name: user?.name || 'Usuário Fayol',
      summary: {
        total_income: income,
        total_expense: expense,
        balance: income - expense,
      },
      transactions: transactions.map((t) => ({
        date: format(t.date, 'dd/MM/yyyy'),
        description: t.description,
        category: t.category?.name || 'Sem Categoria',
        account: t.account.name,
        amount: Number(t.amount),
        type: t.type,
      })),
    };

    // 5. Chamar Microserviço
    const endpoint = dto.type === 'PDF' ? '/generate/pdf' : '/generate/excel';

    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.reportServiceUrl}${endpoint}`, payload, {
          responseType: 'arraybuffer', // Importante para receber binário
        })
      );

      return Buffer.from(response.data);
    } catch (error) {
      this.logger.error(`Erro ao gerar relatório no serviço Python: ${error}`);
      throw new ServiceUnavailableException('Serviço de relatórios indisponível no momento.');
    }
  }
}
