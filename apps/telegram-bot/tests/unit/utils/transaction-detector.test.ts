/**
 * Testes unitários para transaction-detector
 */

import {
  detectTransactionType,
  detectFromPrefix,
  removePrefix,
  getTypeIcon,
  getTypeName,
  type TransactionType,
} from '../../../src/utils/transaction-detector';

describe('Transaction Detector', () => {
  describe('detectTransactionType', () => {
    describe('Income detection', () => {
      it('should detect salary as INCOME', () => {
        const result = detectTransactionType('Salário mensal');
        expect(result.type).toBe('INCOME');
        expect(result.confidence).toBe('high');
        expect(result.matchedKeyword).toBeTruthy();
      });

      it('should detect freelance as INCOME', () => {
        const result = detectTransactionType('Freelance projeto web');
        expect(result.type).toBe('INCOME');
        expect(result.confidence).toBe('high');
      });

      it('should detect sale as INCOME', () => {
        const result = detectTransactionType('Venda notebook');
        expect(result.type).toBe('INCOME');
        expect(result.confidence).toBe('high');
      });

      it('should detect bonus as INCOME', () => {
        const result = detectTransactionType('Bônus anual');
        expect(result.type).toBe('INCOME');
        expect(result.confidence).toBe('high');
      });

      it('should detect dividends as INCOME', () => {
        const result = detectTransactionType('Dividendos ações');
        expect(result.type).toBe('INCOME');
        expect(result.confidence).toBe('high');
      });

      it('should detect refund as INCOME', () => {
        const result = detectTransactionType('Reembolso despesas');
        expect(result.type).toBe('INCOME');
        expect(result.confidence).toBe('high');
      });

      it('should detect cashback as INCOME', () => {
        const result = detectTransactionType('Cashback cartão');
        expect(result.type).toBe('INCOME');
        expect(result.confidence).toBe('high');
      });

      it('should be case insensitive', () => {
        const result1 = detectTransactionType('SALÁRIO');
        const result2 = detectTransactionType('salário');
        const result3 = detectTransactionType('SaLáRiO');

        expect(result1.type).toBe('INCOME');
        expect(result2.type).toBe('INCOME');
        expect(result3.type).toBe('INCOME');
      });
    });

    describe('Expense detection', () => {
      it('should detect lunch as EXPENSE', () => {
        const result = detectTransactionType('Almoço restaurante');
        expect(result.type).toBe('EXPENSE');
        expect(result.confidence).toBe('high');
        expect(result.matchedKeyword).toBeTruthy();
      });

      it('should detect uber as EXPENSE', () => {
        const result = detectTransactionType('Uber para casa');
        expect(result.type).toBe('EXPENSE');
        expect(result.confidence).toBe('high');
      });

      it('should detect supermarket as EXPENSE', () => {
        const result = detectTransactionType('Mercado supermercado');
        expect(result.type).toBe('EXPENSE');
        expect(result.confidence).toBe('high');
      });

      it('should detect gas as EXPENSE', () => {
        const result = detectTransactionType('Gasolina posto');
        expect(result.type).toBe('EXPENSE');
        expect(result.confidence).toBe('high');
      });

      it('should detect pharmacy as EXPENSE', () => {
        const result = detectTransactionType('Farmácia remédios');
        expect(result.type).toBe('EXPENSE');
        expect(result.confidence).toBe('high');
      });

      it('should detect subscriptions as EXPENSE', () => {
        const result = detectTransactionType('Netflix mensalidade');
        expect(result.type).toBe('EXPENSE');
        expect(result.confidence).toBe('high');
      });

      it('should detect bills as EXPENSE', () => {
        const result = detectTransactionType('Conta de luz');
        expect(result.type).toBe('EXPENSE');
        expect(result.confidence).toBe('high');
      });

      it('should be case insensitive', () => {
        const result1 = detectTransactionType('ALMOÇO');
        const result2 = detectTransactionType('almoço');
        const result3 = detectTransactionType('AlMoÇo');

        expect(result1.type).toBe('EXPENSE');
        expect(result2.type).toBe('EXPENSE');
        expect(result3.type).toBe('EXPENSE');
      });
    });

    describe('Transfer detection', () => {
      it('should detect transfer as TRANSFER', () => {
        const result = detectTransactionType('Transferência para poupança');
        expect(result.type).toBe('TRANSFER');
        expect(result.confidence).toBe('high');
        expect(result.matchedKeyword).toBeTruthy();
      });

      it('should detect transferir as TRANSFER', () => {
        const result = detectTransactionType('Transferir para conta');
        expect(result.type).toBe('TRANSFER');
        expect(result.confidence).toBe('high');
      });

      it('should detect enviar as TRANSFER', () => {
        const result = detectTransactionType('Enviar para João');
        expect(result.type).toBe('TRANSFER');
        expect(result.confidence).toBe('high');
      });
    });

    describe('Default behavior', () => {
      it('should default to EXPENSE with low confidence when no keyword matches', () => {
        const result = detectTransactionType('Alguma coisa aleatória');
        expect(result.type).toBe('EXPENSE');
        expect(result.confidence).toBe('low');
        expect(result.matchedKeyword).toBeUndefined();
      });

      it('should handle empty strings', () => {
        const result = detectTransactionType('');
        expect(result.type).toBe('EXPENSE');
        expect(result.confidence).toBe('low');
      });

      it('should handle whitespace', () => {
        const result = detectTransactionType('   ');
        expect(result.type).toBe('EXPENSE');
        expect(result.confidence).toBe('low');
      });
    });

    describe('Priority handling', () => {
      it('should prioritize TRANSFER over INCOME/EXPENSE', () => {
        const result = detectTransactionType('Transferência do salário');
        expect(result.type).toBe('TRANSFER');
      });
    });

    describe('Complex descriptions', () => {
      it('should detect with numbers in description', () => {
        const result = detectTransactionType('Almoço 45.50');
        expect(result.type).toBe('EXPENSE');
      });

      it('should detect with special characters', () => {
        const result = detectTransactionType('Salário (líquido)');
        expect(result.type).toBe('INCOME');
      });

      it('should detect with multiple words', () => {
        const result = detectTransactionType('Pagamento freelance projeto website cliente ABC');
        expect(result.type).toBe('INCOME');
      });
    });
  });

  describe('detectFromPrefix', () => {
    it('should detect + as INCOME', () => {
      const result = detectFromPrefix('+ Freelance 800');
      expect(result).toBe('INCOME');
    });

    it('should detect - as EXPENSE', () => {
      const result = detectFromPrefix('- Almoço 35');
      expect(result).toBe('EXPENSE');
    });

    it('should return null when no prefix', () => {
      const result = detectFromPrefix('Almoço 35');
      expect(result).toBeNull();
    });

    it('should handle whitespace before prefix', () => {
      const result = detectFromPrefix('  + Venda 500');
      expect(result).toBeNull(); // Espaços antes removem o prefixo
    });

    it('should handle prefix without space', () => {
      const result = detectFromPrefix('+Venda');
      expect(result).toBe('INCOME');
    });

    it('should handle empty string', () => {
      const result = detectFromPrefix('');
      expect(result).toBeNull();
    });
  });

  describe('removePrefix', () => {
    it('should remove + prefix', () => {
      const result = removePrefix('+ Freelance 800');
      expect(result).toBe('Freelance 800');
    });

    it('should remove - prefix', () => {
      const result = removePrefix('- Almoço 35');
      expect(result).toBe('Almoço 35');
    });

    it('should not change text without prefix', () => {
      const result = removePrefix('Almoço 35');
      expect(result).toBe('Almoço 35');
    });

    it('should handle multiple spaces after prefix', () => {
      const result = removePrefix('+   Venda');
      expect(result).toBe('Venda');
    });

    it('should handle empty string', () => {
      const result = removePrefix('');
      expect(result).toBe('');
    });

    it('should trim whitespace', () => {
      const result = removePrefix('  + Venda  ');
      expect(result).toBe('Venda');
    });
  });

  describe('getTypeIcon', () => {
    it('should return correct icon for INCOME', () => {
      expect(getTypeIcon('INCOME')).toBe('💰');
    });

    it('should return correct icon for EXPENSE', () => {
      expect(getTypeIcon('EXPENSE')).toBe('💸');
    });

    it('should return correct icon for TRANSFER', () => {
      expect(getTypeIcon('TRANSFER')).toBe('🔄');
    });

    it('should return default icon for unknown type', () => {
      expect(getTypeIcon('UNKNOWN' as TransactionType)).toBe('📝');
    });
  });

  describe('getTypeName', () => {
    it('should return correct name for INCOME', () => {
      expect(getTypeName('INCOME')).toBe('Receita');
    });

    it('should return correct name for EXPENSE', () => {
      expect(getTypeName('EXPENSE')).toBe('Despesa');
    });

    it('should return correct name for TRANSFER', () => {
      expect(getTypeName('TRANSFER')).toBe('Transferência');
    });

    it('should return default name for unknown type', () => {
      expect(getTypeName('UNKNOWN' as TransactionType)).toBe('Transação');
    });
  });

  describe('Edge cases', () => {
    it('should handle accented characters', () => {
      const result = detectTransactionType('almôço');
      expect(result.type).toBe('EXPENSE'); // Deve ignorar acentuação na comparação
    });

    it('should handle mixed case with accents', () => {
      const result = detectTransactionType('SALÁRIO');
      expect(result.type).toBe('INCOME');
    });

    it('should handle partial keyword matches', () => {
      const result = detectTransactionType('salariado');
      expect(result.type).toBe('INCOME'); // Contém "salario"
    });
  });
});
