/**
 * Utilitário para detectar tipo de transação baseado em palavras-chave e contexto
 */

export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER';

interface DetectionResult {
  type: TransactionType;
  confidence: 'high' | 'medium' | 'low';
  matchedKeyword?: string;
}

/**
 * Palavras-chave que indicam RECEITA
 */
const INCOME_KEYWORDS = [
  // Salários e pagamentos
  'salário', 'salario', 'pagamento', 'salario recebido', 'recebido',
  'recebimento', 'recebi', 'ganho', 'renda', 'honorários', 'honorarios',

  // Vendas e negócios
  'venda', 'vendido', 'vendeu', 'lucro', 'comissão', 'comissao',
  'freelance', 'freela', 'projeto', 'bônus', 'bonus', 'prêmio', 'premio',

  // Investimentos
  'dividendo', 'dividendos', 'rendimento', 'juros', 'resgate',
  'investimento recebido', 'retorno',

  // Reembolsos e devoluções
  'reembolso', 'devolução', 'devolucao', 'estorno', 'cashback',

  // Outros
  'presente recebido', 'doação recebida', 'doacao recebida', 'pix recebido',
  'transferência recebida', 'transferencia recebida', 'depósito', 'deposito',
  'entrada', 'crédito', 'credito',
];

/**
 * Palavras-chave que indicam DESPESA
 */
const EXPENSE_KEYWORDS = [
  // Alimentação
  'almoço', 'almoco', 'jantar', 'café', 'cafe', 'lanche', 'comida',
  'restaurante', 'ifood', 'uber eats', 'delivery', 'pizza', 'hamburguer',
  'mercado', 'supermercado', 'feira', 'padaria', 'açougue', 'acougue',

  // Transporte
  'uber', 'taxi', '99', 'gasolina', 'combustível', 'combustivel',
  'estacionamento', 'pedágio', 'pedagio', 'ônibus', 'onibus', 'metrô', 'metro',
  'transporte', 'passagem',

  // Moradia
  'aluguel', 'condomínio', 'condominio', 'luz', 'água', 'agua',
  'internet', 'gás', 'gas', 'iptu', 'energia', 'telefone',

  // Compras
  'compra', 'comprei', 'loja', 'shopping', 'roupa', 'calçado', 'calcado',
  'eletrônico', 'eletronico', 'amazon', 'mercado livre',

  // Saúde
  'farmácia', 'farmacia', 'remédio', 'remedio', 'médico', 'medico',
  'consulta', 'exame', 'plano de saúde', 'plano de saude',

  // Entretenimento
  'cinema', 'netflix', 'spotify', 'show', 'balada', 'bar',
  'academia', 'livro', 'game', 'jogo',

  // Serviços
  'conta', 'boleto', 'fatura', 'cartão', 'cartao', 'mensalidade',
  'assinatura', 'serviço', 'servico', 'manutenção', 'manutencao',

  // Outros
  'pago', 'paguei', 'comprei', 'gasto', 'despesa', 'débito', 'debito',
  'saída', 'saida', 'pagamento de', 'pix enviado',
];

/**
 * Palavras que indicam TRANSFERÊNCIA
 */
const TRANSFER_KEYWORDS = [
  'transferência', 'transferencia', 'transferir', 'transferi',
  'enviar para', 'enviei para', 'mover para',
];

/**
 * Detecta o tipo de transação baseado na descrição
 */
export function detectTransactionType(description: string): DetectionResult {
  const lowerDesc = description.toLowerCase().trim();

  // Verifica transferências primeiro (mais específico)
  for (const keyword of TRANSFER_KEYWORDS) {
    if (lowerDesc.includes(keyword)) {
      return {
        type: 'TRANSFER',
        confidence: 'high',
        matchedKeyword: keyword,
      };
    }
  }

  // Verifica receitas
  for (const keyword of INCOME_KEYWORDS) {
    if (lowerDesc.includes(keyword)) {
      return {
        type: 'INCOME',
        confidence: 'high',
        matchedKeyword: keyword,
      };
    }
  }

  // Verifica despesas
  for (const keyword of EXPENSE_KEYWORDS) {
    if (lowerDesc.includes(keyword)) {
      return {
        type: 'EXPENSE',
        confidence: 'high',
        matchedKeyword: keyword,
      };
    }
  }

  // Padrão: assume despesa com baixa confiança
  return {
    type: 'EXPENSE',
    confidence: 'low',
  };
}

/**
 * Detecta tipo baseado em prefixos (+/-) na mensagem
 * Retorna null se não houver prefixo
 */
export function detectFromPrefix(text: string): TransactionType | null {
  const trimmed = text.trim();

  if (trimmed.startsWith('+')) {
    return 'INCOME';
  }

  if (trimmed.startsWith('-')) {
    return 'EXPENSE';
  }

  return null;
}

/**
 * Remove prefixos da mensagem
 */
export function removePrefix(text: string): string {
  const trimmed = text.trim();
  if (trimmed.startsWith('+') || trimmed.startsWith('-')) {
    return trimmed.substring(1).trim();
  }
  return trimmed;
}

/**
 * Retorna ícone apropriado para o tipo
 */
export function getTypeIcon(type: TransactionType): string {
  switch (type) {
    case 'INCOME':
      return '💰';
    case 'EXPENSE':
      return '💸';
    case 'TRANSFER':
      return '🔄';
    default:
      return '📝';
  }
}

/**
 * Retorna nome legível do tipo
 */
export function getTypeName(type: TransactionType): string {
  switch (type) {
    case 'INCOME':
      return 'Receita';
    case 'EXPENSE':
      return 'Despesa';
    case 'TRANSFER':
      return 'Transferência';
    default:
      return 'Transação';
  }
}
