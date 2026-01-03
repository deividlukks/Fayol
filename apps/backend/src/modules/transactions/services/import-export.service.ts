import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { LaunchType, Recurrence } from '@fayol/shared-types';
import { TransactionsService } from './transactions.service';

interface CsvRow {
  date: string;
  description: string;
  amount: string;
  type: string;
  account: string;
  category?: string;
  isPaid: string;
  notes?: string;
  tags?: string;
  recurrence?: string;
}

interface ImportResult {
  success: number;
  failed: number;
  errors: Array<{ row: number; error: string; data?: any }>;
}

@Injectable()
export class ImportExportService {
  private readonly logger = new Logger(ImportExportService.name);

  constructor(
    private prisma: PrismaService,
    private transactionsService: TransactionsService
  ) {}

  /**
   * Exporta transações para formato CSV
   */
  async exportToCsv(
    userId: string,
    options?: { startDate?: Date; endDate?: Date }
  ): Promise<string> {
    const where: any = { userId };

    if (options?.startDate || options?.endDate) {
      where.date = {};
      if (options.startDate) where.date.gte = options.startDate;
      if (options.endDate) where.date.lte = options.endDate;
    }

    const transactions = await this.prisma.transaction.findMany({
      where,
      include: {
        account: { select: { name: true } },
        category: { select: { name: true } },
      },
      orderBy: { date: 'asc' },
    });

    // Header do CSV
    const header = [
      'Data',
      'Descrição',
      'Valor',
      'Tipo',
      'Conta',
      'Categoria',
      'Pago',
      'Observações',
      'Tags',
      'Recorrência',
    ].join(',');

    // Linhas do CSV
    const rows = transactions.map((t) => {
      return [
        this.formatDate(new Date(t.date)),
        this.escapeCsv(t.description),
        t.amount.toString(),
        t.type,
        this.escapeCsv(t.account.name),
        t.category ? this.escapeCsv(t.category.name) : '',
        t.isPaid ? 'Sim' : 'Não',
        t.notes ? this.escapeCsv(t.notes) : '',
        t.tags.length > 0 ? this.escapeCsv(t.tags.join(';')) : '',
        t.recurrence || Recurrence.NONE,
      ].join(',');
    });

    return [header, ...rows].join('\n');
  }

  /**
   * Importa transações de um arquivo CSV
   */
  async importFromCsv(userId: string, csvContent: string): Promise<ImportResult> {
    const result: ImportResult = {
      success: 0,
      failed: 0,
      errors: [],
    };

    try {
      const lines = csvContent.split('\n').filter((line) => line.trim());

      if (lines.length === 0) {
        throw new BadRequestException('Arquivo CSV vazio');
      }

      // Pula o header (primeira linha)
      const dataLines = lines.slice(1);

      for (let i = 0; i < dataLines.length; i++) {
        const rowNumber = i + 2; // +2 porque começamos da linha 1 e pulamos o header

        try {
          const row = this.parseCsvLine(dataLines[i]);
          await this.importRow(userId, row, rowNumber);
          result.success++;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          result.failed++;
          result.errors.push({
            row: rowNumber,
            error: errorMessage,
            data: dataLines[i],
          });
          this.logger.warn(`Erro ao importar linha ${rowNumber}: ${errorMessage}`);
        }
      }

      this.logger.log(`Importação concluída: ${result.success} sucesso, ${result.failed} falhas`);

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(`Erro ao processar CSV: ${errorMessage}`);
    }
  }

  /**
   * Importa uma única linha do CSV
   */
  private async importRow(userId: string, row: CsvRow, rowNumber: number): Promise<void> {
    // Valida campos obrigatórios
    if (!row.date || !row.description || !row.amount || !row.type || !row.account) {
      throw new Error('Campos obrigatórios faltando (data, descrição, valor, tipo, conta)');
    }

    // Valida e converte a data
    const date = this.parseDate(row.date);
    if (!date || isNaN(date.getTime())) {
      throw new Error(`Data inválida: ${row.date}`);
    }

    // Valida e converte o valor
    const amount = parseFloat(row.amount.replace(',', '.'));
    if (isNaN(amount) || amount <= 0) {
      throw new Error(`Valor inválido: ${row.amount}`);
    }

    // Valida o tipo
    const type = this.parseTransactionType(row.type);
    if (!type) {
      throw new Error(`Tipo inválido: ${row.type}. Use INCOME, EXPENSE ou TRANSFER`);
    }

    // Busca a conta pelo nome
    const account = await this.prisma.account.findFirst({
      where: {
        userId,
        name: { equals: row.account.trim(), mode: 'insensitive' },
      },
    });

    if (!account) {
      throw new Error(`Conta não encontrada: ${row.account}`);
    }

    // Busca a categoria pelo nome (se fornecida)
    let categoryId: string | undefined;
    if (row.category && row.category.trim()) {
      const category = await this.prisma.category.findFirst({
        where: {
          userId,
          name: { equals: row.category.trim(), mode: 'insensitive' },
        },
      });

      if (category) {
        categoryId = category.id;
      } else {
        this.logger.warn(`Categoria não encontrada: ${row.category} (linha ${rowNumber})`);
      }
    }

    // Valida isPaid
    const isPaid = this.parseBoolean(row.isPaid);

    // Valida recorrência
    const recurrence = this.parseRecurrence(row.recurrence);

    // Parse tags
    const tags = row.tags
      ? row.tags
          .split(';')
          .map((t) => t.trim())
          .filter(Boolean)
      : [];

    // Cria a transação usando o TransactionsService
    await this.transactionsService.create(userId, {
      description: row.description.trim(),
      amount,
      date,
      type,
      accountId: account.id,
      categoryId,
      isPaid,
      recurrence,
      notes: row.notes?.trim() || undefined,
      tags,
    });
  }

  /**
   * Faz parse de uma linha CSV respeitando campos entre aspas
   */
  private parseCsvLine(line: string): CsvRow {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    // Adiciona o último campo
    values.push(current.trim());

    return {
      date: values[0] || '',
      description: values[1] || '',
      amount: values[2] || '',
      type: values[3] || '',
      account: values[4] || '',
      category: values[5] || undefined,
      isPaid: values[6] || 'Sim',
      notes: values[7] || undefined,
      tags: values[8] || undefined,
      recurrence: values[9] || Recurrence.NONE,
    };
  }

  /**
   * Converte string de data para Date
   * Aceita formatos: DD/MM/YYYY, YYYY-MM-DD
   */
  private parseDate(dateStr: string): Date {
    // Tenta DD/MM/YYYY
    if (dateStr.includes('/')) {
      const [day, month, year] = dateStr.split('/');
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }

    // Tenta YYYY-MM-DD
    if (dateStr.includes('-')) {
      return new Date(dateStr);
    }

    throw new Error(`Formato de data não suportado: ${dateStr}`);
  }

  /**
   * Converte string para LaunchType
   */
  private parseTransactionType(typeStr: string): LaunchType | null {
    const normalized = typeStr.toUpperCase().trim();

    switch (normalized) {
      case 'INCOME':
      case 'RECEITA':
        return LaunchType.INCOME;
      case 'EXPENSE':
      case 'DESPESA':
        return LaunchType.EXPENSE;
      case 'TRANSFER':
      case 'TRANSFERÊNCIA':
      case 'TRANSFERENCIA':
        return LaunchType.TRANSFER;
      default:
        return null;
    }
  }

  /**
   * Converte string para boolean
   */
  private parseBoolean(value: string): boolean {
    const normalized = value.toLowerCase().trim();
    return (
      normalized === 'sim' || normalized === 'yes' || normalized === 'true' || normalized === '1'
    );
  }

  /**
   * Converte string para Recurrence
   */
  private parseRecurrence(recurrenceStr?: string): Recurrence {
    if (!recurrenceStr) return Recurrence.NONE;

    const normalized = recurrenceStr.toUpperCase().trim();

    switch (normalized) {
      case 'DAILY':
      case 'DIÁRIA':
      case 'DIARIO':
        return Recurrence.DAILY;
      case 'WEEKLY':
      case 'SEMANAL':
        return Recurrence.WEEKLY;
      case 'MONTHLY':
      case 'MENSAL':
        return Recurrence.MONTHLY;
      case 'YEARLY':
      case 'ANUAL':
        return Recurrence.YEARLY;
      default:
        return Recurrence.NONE;
    }
  }

  /**
   * Formata Date para DD/MM/YYYY
   */
  private formatDate(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  /**
   * Escapa valores CSV (adiciona aspas se necessário)
   */
  private escapeCsv(value: string): string {
    if (!value) return '';

    // Se contém vírgula, quebra de linha ou aspas, envolve em aspas
    if (value.includes(',') || value.includes('\n') || value.includes('"')) {
      return `"${value.replace(/"/g, '""')}"`;
    }

    return value;
  }

  /**
   * Gera um template CSV para download
   */
  generateTemplate(): string {
    const header = [
      'Data',
      'Descrição',
      'Valor',
      'Tipo',
      'Conta',
      'Categoria',
      'Pago',
      'Observações',
      'Tags',
      'Recorrência',
    ].join(',');

    const examples = [
      [
        '01/12/2024',
        'Salário',
        '5000.00',
        'INCOME',
        'Conta Corrente',
        'Salário',
        'Sim',
        'Pagamento mensal',
        'trabalho;renda',
        'MONTHLY',
      ].join(','),
      [
        '05/12/2024',
        'Supermercado',
        '250.50',
        'EXPENSE',
        'Cartão de Crédito',
        'Alimentação',
        'Não',
        '',
        'compras',
        'NONE',
      ].join(','),
    ];

    return [header, ...examples].join('\n');
  }
}
