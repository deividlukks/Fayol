import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ExportService {
  constructor(private prisma: PrismaService) {}

  async exportToCsv(userId: string, startDate?: string, endDate?: string) {
    const where: any = { userId };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const transactions = await this.prisma.transaction.findMany({
      where,
      include: {
        account: true,
        category: true,
        subcategory: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // CSV Header
    const header = [
      'Código',
      'Data',
      'Tipo de Movimento',
      'Tipo de Lançamento',
      'Conta',
      'Categoria',
      'Subcategoria',
      'Valor',
      'Descrição',
      'Data Vencimento',
      'Data Recebimento',
      'Data Efetivação',
      'Recorrente',
      'Período de Recorrência',
    ];

    const rows = transactions.map((t) => [
      t.code,
      t.createdAt.toISOString(),
      t.movementType,
      t.launchType,
      t.account.name,
      t.category.name,
      t.subcategory?.name || '',
      t.amount.toString(),
      t.description || '',
      t.dueDate?.toISOString() || '',
      t.receiptDate?.toISOString() || '',
      t.effectiveDate?.toISOString() || '',
      t.isRecurring ? 'Sim' : 'Não',
      t.recurrencePeriod || '',
    ]);

    const csv = [header, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');

    return {
      filename: `fayol_transactions_${new Date().toISOString().split('T')[0]}.csv`,
      content: csv,
      mimeType: 'text/csv',
    };
  }

  async exportFullBackup(userId: string) {
    const [user, accounts, transactions, categories, subcategories] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          investorProfile: true,
          createdAt: true,
        },
      }),
      this.prisma.account.findMany({
        where: { userId },
      }),
      this.prisma.transaction.findMany({
        where: { userId },
        include: {
          account: true,
          category: true,
          subcategory: true,
        },
      }),
      this.prisma.category.findMany({
        where: {
          OR: [{ isSystem: true }, { userId }],
        },
        include: {
          subcategories: true,
        },
      }),
      this.prisma.subcategory.findMany({
        where: {
          OR: [{ isSystem: true }, { userId }],
        },
      }),
    ]);

    const backup = {
      exportDate: new Date().toISOString(),
      user,
      accounts,
      transactions,
      categories,
      subcategories,
    };

    return {
      filename: `fayol_backup_${userId}_${new Date().toISOString().split('T')[0]}.json`,
      content: JSON.stringify(backup, null, 2),
      mimeType: 'application/json',
    };
  }
}
