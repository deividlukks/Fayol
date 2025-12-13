import {
  format,
  addDays,
  subDays,
  startOfMonth,
  endOfMonth,
  isAfter,
  isBefore,
  parseISO,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const DateUtils = {
  // Formata data para exibição (ex: 25/12/2023)
  formatDate: (date: Date | string): string => {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, 'dd/MM/yyyy', { locale: ptBR });
  },

  // Formata data e hora (ex: 25/12/2023 às 14:30)
  formatDateTime: (date: Date | string): string => {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  },

  // Formata para o banco de dados ou API (ISO 8601)
  toISO: (date: Date): string => {
    return date.toISOString();
  },

  // Retorna o primeiro dia do mês
  getStartOfMonth: (date: Date = new Date()): Date => {
    return startOfMonth(date);
  },

  // Retorna o último dia do mês
  getEndOfMonth: (date: Date = new Date()): Date => {
    return endOfMonth(date);
  },

  addDays,
  subDays,
  isAfter,
  isBefore,
};
