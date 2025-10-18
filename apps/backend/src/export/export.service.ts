import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

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

  /**
   * Gera relatório em PDF (HTML para PDF via biblioteca externa ou HTML simples)
   * Esta é uma versão simplificada que gera HTML
   */
  async exportToPDF(userId: string, year: number, month: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const transactions = await this.prisma.transaction.findMany({
      where: {
        userId,
        effectiveDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        account: true,
        category: true,
        subcategory: true,
      },
      orderBy: {
        effectiveDate: 'asc',
      },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    });

    const totalIncome = transactions
      .filter(t => t.movementType === 'income')
      .reduce((sum, t) => sum + t.amount.toNumber(), 0);

    const totalExpenses = transactions
      .filter(t => t.movementType === 'expense')
      .reduce((sum, t) => sum + t.amount.toNumber(), 0);

    const balance = totalIncome - totalExpenses;

    // Agrupar por categoria
    const categoryMap = new Map<string, number>();
    transactions
      .filter(t => t.movementType === 'expense')
      .forEach(t => {
        const current = categoryMap.get(t.category.name) || 0;
        categoryMap.set(t.category.name, current + t.amount.toNumber());
      });

    const categoryData = Array.from(categoryMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({
        name,
        value,
        percentage: ((value / totalExpenses) * 100).toFixed(1),
      }));

    // Gerar HTML
    const html = this.generatePDFHTML(user, {
      year,
      month,
      totalIncome,
      totalExpenses,
      balance,
      transactions,
      categoryData,
    });

    return {
      filename: `fayol_relatorio_${year}_${month.toString().padStart(2, '0')}.html`,
      content: html,
      mimeType: 'text/html',
    };
  }

  private generatePDFHTML(user: any, data: any): string {
    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    const monthName = monthNames[data.month - 1];

    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Relatório Fayol - ${monthName}/${data.year}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: Arial, sans-serif;
            padding: 40px;
            background: #f5f5f5;
        }
        .container {
            max-width: 1000px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
            border-bottom: 3px solid #2196F3;
            padding-bottom: 20px;
        }
        .header h1 { color: #2196F3; font-size: 32px; margin-bottom: 10px; }
        .header p { color: #666; font-size: 16px; }
        .summary {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin-bottom: 40px;
        }
        .summary-card {
            padding: 20px;
            border-radius: 8px;
            text-align: center;
        }
        .summary-card.income { background: #E8F5E9; border-left: 4px solid #4CAF50; }
        .summary-card.expense { background: #FFEBEE; border-left: 4px solid #F44336; }
        .summary-card.balance { background: #E3F2FD; border-left: 4px solid #2196F3; }
        .summary-card h3 { color: #666; font-size: 14px; margin-bottom: 10px; }
        .summary-card p { font-size: 28px; font-weight: bold; }
        .summary-card.income p { color: #4CAF50; }
        .summary-card.expense p { color: #F44336; }
        .summary-card.balance p { color: #2196F3; }
        .section {
            margin-bottom: 40px;
        }
        .section h2 {
            font-size: 24px;
            color: #333;
            margin-bottom: 20px;
            border-bottom: 2px solid #eee;
            padding-bottom: 10px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #eee;
        }
        th {
            background: #f5f5f5;
            font-weight: bold;
            color: #333;
        }
        .income-row { color: #4CAF50; }
        .expense-row { color: #F44336; }
        .footer {
            text-align: center;
            color: #999;
            font-size: 12px;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #eee;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 Relatório Financeiro</h1>
            <p>${monthName} de ${data.year}</p>
            <p><strong>Cliente:</strong> ${user.name} | <strong>Email:</strong> ${user.email}</p>
        </div>

        <div class="summary">
            <div class="summary-card income">
                <h3>💰 Receitas</h3>
                <p>R$ ${data.totalIncome.toFixed(2)}</p>
            </div>
            <div class="summary-card expense">
                <h3>💳 Despesas</h3>
                <p>R$ ${data.totalExpenses.toFixed(2)}</p>
            </div>
            <div class="summary-card balance">
                <h3>📊 Saldo</h3>
                <p>R$ ${data.balance.toFixed(2)}</p>
            </div>
        </div>

        <div class="section">
            <h2>📁 Gastos por Categoria</h2>
            <table>
                <thead>
                    <tr>
                        <th>Categoria</th>
                        <th>Valor</th>
                        <th>Percentual</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.categoryData.map((cat: any) => `
                        <tr>
                            <td>${cat.name}</td>
                            <td>R$ ${cat.value.toFixed(2)}</td>
                            <td>${cat.percentage}%</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <div class="section">
            <h2>📝 Transações</h2>
            <table>
                <thead>
                    <tr>
                        <th>Data</th>
                        <th>Descrição</th>
                        <th>Categoria</th>
                        <th>Valor</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.transactions.map((t: any) => `
                        <tr class="${t.movementType === 'income' ? 'income-row' : 'expense-row'}">
                            <td>${new Date(t.effectiveDate || t.createdAt).toLocaleDateString('pt-BR')}</td>
                            <td>${t.description || '-'}</td>
                            <td>${t.category.name}</td>
                            <td>${t.movementType === 'income' ? '+' : '-'} R$ ${t.amount.toFixed(2)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <div class="footer">
            <p>Relatório gerado em ${new Date().toLocaleString('pt-BR')}</p>
            <p>Fayol - Gestor Financeiro Inteligente</p>
        </div>
    </div>
</body>
</html>
    `;
  }

  /**
   * Registra uma solicitação de exportação no banco
   */
  async createExportRequest(
    userId: string,
    format: string,
    type: string,
    startDate?: string,
    endDate?: string
  ) {
    return this.prisma.dataExport.create({
      data: {
        userId,
        format,
        type,
        status: 'pending',
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
      },
    });
  }

  /**
   * Atualiza o status de uma exportação
   */
  async updateExportStatus(
    exportId: string,
    status: string,
    fileUrl?: string
  ) {
    return this.prisma.dataExport.update({
      where: { id: exportId },
      data: {
        status,
        fileUrl,
      },
    });
  }

  /**
   * Busca exportações de um usuário
   */
  async getUserExports(userId: string) {
    return this.prisma.dataExport.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
  }
}
