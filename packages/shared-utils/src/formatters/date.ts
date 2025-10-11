/**
 * Formata uma data para o formato brasileiro (dd/MM/yyyy)
 */
export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return new Intl.DateTimeFormat('pt-BR').format(d);
}

/**
 * Formata uma data com hora (dd/MM/yyyy HH:mm)
 */
export function formatDateTime(date: Date | string): string {
  const d = new Date(date);
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(d);
}

/**
 * Formata uma data de forma relativa (hoje, ontem, há 2 dias, etc.)
 */
export function formatRelativeDate(date: Date | string): string {
  const d = new Date(date);
  const now = new Date();
  const diffInMs = now.getTime() - d.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) return 'Hoje';
  if (diffInDays === 1) return 'Ontem';
  if (diffInDays < 7) return `Há ${diffInDays} dias`;
  if (diffInDays < 30) return `Há ${Math.floor(diffInDays / 7)} semanas`;
  if (diffInDays < 365) return `Há ${Math.floor(diffInDays / 30)} meses`;
  return `Há ${Math.floor(diffInDays / 365)} anos`;
}

/**
 * Converte uma string de data brasileira para Date
 * Exemplo: "25/12/2023" -> Date
 */
export function parseDate(dateString: string): Date | null {
  const parts = dateString.split('/');
  if (parts.length !== 3) return null;

  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // Mês começa em 0
  const year = parseInt(parts[2], 10);

  const date = new Date(year, month, day);

  if (isNaN(date.getTime())) return null;
  return date;
}

/**
 * Verifica se uma data é válida
 */
export function isValidDate(date: any): boolean {
  return date instanceof Date && !isNaN(date.getTime());
}
