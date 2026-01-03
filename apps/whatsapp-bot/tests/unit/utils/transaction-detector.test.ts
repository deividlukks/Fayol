/**
 * Testes unitários do Transaction Detector
 * Copiado e adaptado de apps/telegram-bot/tests
 */

import {
  detectTransactionType,
  detectFromPrefix,
  removePrefix,
  getTypeIcon,
  getTypeName,
} from '../../../src/utils/transaction-detector';

describe('Transaction Detector', () => {
  describe('detectTransactionType', () => {
    describe('Receitas', () => {
      it('deve detectar salário', () => {
        const result = detectTransactionType('Salário recebido 5000');
        expect(result.type).toBe('INCOME');
        expect(result.confidence).toBe('high');
        expect(result.matchedKeyword).toBeTruthy();
      });

      it('deve detectar freelance', () => {
        const result = detectTransactionType('Freelance projeto web');
        expect(result.type).toBe('INCOME');
        expect(result.matchedKeyword).toContain('freelance');
      });

      it('deve detectar venda', () => {
        const result = detectTransactionType('Venda de notebook');
        expect(result.type).toBe('INCOME');
        expect(result.matchedKeyword).toContain('venda');
      });

      it('deve detectar dividendos', () => {
        const result = detectTransactionType('Dividendos de ações 250.50');
        expect(result.type).toBe('INCOME');
        expect(result.matchedKeyword).toContain('dividendo');
      });

      it('deve detectar reembolso', () => {
        const result = detectTransactionType('Reembolso despesas médicas');
        expect(result.type).toBe('INCOME');
        expect(result.matchedKeyword).toContain('reembolso');
      });

      it('deve detectar bônus', () => {
        const result = detectTransactionType('Bônus de fim de ano');
        expect(result.type).toBe('INCOME');
      });
    });

    describe('Despesas', () => {
      it('deve detectar almoço', () => {
        const result = detectTransactionType('Almoço no restaurante');
        expect(result.type).toBe('EXPENSE');
        expect(result.matchedKeyword).toContain('almoço');
      });

      it('deve detectar uber', () => {
        const result = detectTransactionType('Uber para casa');
        expect(result.type).toBe('EXPENSE');
        expect(result.matchedKeyword).toBe('uber');
      });

      it('deve detectar mercado', () => {
        const result = detectTransactionType('Compras no mercado');
        expect(result.type).toBe('EXPENSE');
        expect(result.matchedKeyword).toBe('mercado');
      });

      it('deve detectar gasolina', () => {
        const result = detectTransactionType('Gasolina no posto');
        expect(result.type).toBe('EXPENSE');
        expect(result.matchedKeyword).toBe('gasolina');
      });

      it('deve detectar netflix', () => {
        const result = detectTransactionType('Assinatura Netflix');
        expect(result.type).toBe('EXPENSE');
        expect(result.matchedKeyword).toBe('netflix');
      });

      it('deve detectar farmácia', () => {
        const result = detectTransactionType('Compra na farmácia');
        expect(result.type).toBe('EXPENSE');
        expect(result.matchedKeyword).toContain('farmácia');
      });

      it('deve detectar cinema', () => {
        const result = detectTransactionType('Ingresso de cinema');
        expect(result.type).toBe('EXPENSE');
        expect(result.matchedKeyword).toBe('cinema');
      });
    });

    describe('Transferências', () => {
      it('deve detectar transferência', () => {
        const result = detectTransactionType('Transferência para conta poupança');
        expect(result.type).toBe('TRANSFER');
        expect(result.matchedKeyword).toContain('transferência');
      });

      it('deve detectar envio', () => {
        const result = detectTransactionType('Enviar para Maria');
        expect(result.type).toBe('TRANSFER');
      });
    });

    describe('Casos sem palavra-chave', () => {
      it('deve assumir despesa por padrão', () => {
        const result = detectTransactionType('Compra genérica 100');
        expect(result.type).toBe('EXPENSE');
        expect(result.confidence).toBe('low');
      });

      it('deve ser case-insensitive', () => {
        const result = detectTransactionType('SALÁRIO 5000');
        expect(result.type).toBe('INCOME');
      });

      it('deve detectar com acentuação', () => {
        const result1 = detectTransactionType('Farmácia');
        const result2 = detectTransactionType('Farmacia');
        expect(result1.type).toBe('EXPENSE');
        expect(result2.type).toBe('EXPENSE');
      });
    });
  });

  describe('detectFromPrefix', () => {
    it('deve detectar + como receita', () => {
      expect(detectFromPrefix('+ Freelance 800')).toBe('INCOME');
    });

    it('deve detectar - como despesa', () => {
      expect(detectFromPrefix('- Compra 150')).toBe('EXPENSE');
    });

    it('deve retornar null se não tiver prefixo', () => {
      expect(detectFromPrefix('Almoço 35')).toBeNull();
    });

    it('deve ignorar espaços antes do prefixo', () => {
      expect(detectFromPrefix('  + Venda 200')).toBe('INCOME');
      expect(detectFromPrefix('  - Despesa 50')).toBe('EXPENSE');
    });
  });

  describe('removePrefix', () => {
    it('deve remover + do início', () => {
      expect(removePrefix('+ Freelance 800')).toBe('Freelance 800');
    });

    it('deve remover - do início', () => {
      expect(removePrefix('- Compra 150')).toBe('Compra 150');
    });

    it('deve retornar texto original se não tiver prefixo', () => {
      expect(removePrefix('Almoço 35')).toBe('Almoço 35');
    });

    it('deve fazer trim do resultado', () => {
      expect(removePrefix('+    Venda 200')).toBe('Venda 200');
    });
  });

  describe('getTypeIcon', () => {
    it('deve retornar ícone correto para INCOME', () => {
      expect(getTypeIcon('INCOME')).toBe('💰');
    });

    it('deve retornar ícone correto para EXPENSE', () => {
      expect(getTypeIcon('EXPENSE')).toBe('💸');
    });

    it('deve retornar ícone correto para TRANSFER', () => {
      expect(getTypeIcon('TRANSFER')).toBe('🔄');
    });

    it('deve retornar ícone padrão para tipo desconhecido', () => {
      expect(getTypeIcon('UNKNOWN' as any)).toBe('📝');
    });
  });

  describe('getTypeName', () => {
    it('deve retornar nome correto para INCOME', () => {
      expect(getTypeName('INCOME')).toBe('Receita');
    });

    it('deve retornar nome correto para EXPENSE', () => {
      expect(getTypeName('EXPENSE')).toBe('Despesa');
    });

    it('deve retornar nome correto para TRANSFER', () => {
      expect(getTypeName('TRANSFER')).toBe('Transferência');
    });

    it('deve retornar nome padrão para tipo desconhecido', () => {
      expect(getTypeName('UNKNOWN' as any)).toBe('Transação');
    });
  });
});
