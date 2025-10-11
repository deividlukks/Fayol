/**
 * Formata um número de telefone brasileiro
 * Exemplo: "11999999999" -> "(11) 99999-9999"
 */
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');

  if (cleaned.length === 11) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  }

  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  }

  return phone;
}

/**
 * Remove formatação de telefone
 * Exemplo: "(11) 99999-9999" -> "11999999999"
 */
export function unformatPhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

/**
 * Valida um número de telefone brasileiro
 */
export function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  return /^[1-9]{2}9?\d{8}$/.test(cleaned);
}
