import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Função utilitária para mesclar classes Tailwind de forma inteligente.
 * Resolve conflitos de classes (ex: 'px-2 px-4' vira 'px-4').
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
