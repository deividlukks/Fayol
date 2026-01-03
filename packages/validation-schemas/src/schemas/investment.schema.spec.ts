import { ERROR_MESSAGES } from '@fayol/shared-constants';
import {
  createInvestmentSchema,
  updateInvestmentSchema,
  CreateInvestmentInput,
  UpdateInvestmentInput,
} from './investment.schema';

describe('investment.schema', () => {
  const validUUID = '550e8400-e29b-41d4-a716-446655440000';
  const baseValidInvestment = {
    name: 'Petrobras PN',
    ticker: 'PETR4',
    quantity: 100,
    averagePrice: 35.50,
    currentPrice: 38.20,
    type: 'Ações BR',
    purchaseDate: new Date('2024-01-15'),
    accountId: validUUID,
  };

  describe('createInvestmentSchema', () => {
    describe('valid data', () => {
      it('should validate investment with all fields', () => {
        const result = createInvestmentSchema.safeParse(baseValidInvestment);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.name).toBe('Petrobras PN');
          expect(result.data.ticker).toBe('PETR4');
          expect(result.data.quantity).toBe(100);
          expect(result.data.averagePrice).toBe(35.50);
          expect(result.data.currentPrice).toBe(38.20);
          expect(result.data.type).toBe('Ações BR');
          expect(result.data.accountId).toBe(validUUID);
        }
      });

      it('should validate investment without optional fields', () => {
        const data = {
          name: 'Bitcoin',
          quantity: 0.5,
          averagePrice: 150000,
          type: 'Crypto',
          purchaseDate: new Date('2024-01-01'),
          accountId: validUUID,
        };
        const result = createInvestmentSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.ticker).toBeUndefined();
          expect(result.data.currentPrice).toBeUndefined();
        }
      });

      it('should validate stock investment', () => {
        const data = {
          name: 'Apple Inc.',
          ticker: 'AAPL',
          quantity: 50,
          averagePrice: 150,
          type: 'Ações US',
          purchaseDate: new Date('2024-02-01'),
          accountId: validUUID,
        };
        const result = createInvestmentSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should validate FII investment', () => {
        const data = {
          name: 'HGLG11',
          ticker: 'HGLG11',
          quantity: 200,
          averagePrice: 150.50,
          type: 'FII',
          purchaseDate: new Date('2024-03-01'),
          accountId: validUUID,
        };
        const result = createInvestmentSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should validate crypto investment', () => {
        const data = {
          name: 'Ethereum',
          ticker: 'ETH',
          quantity: 2.5,
          averagePrice: 8000,
          type: 'Crypto',
          purchaseDate: new Date('2024-01-10'),
          accountId: validUUID,
        };
        const result = createInvestmentSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should coerce string purchaseDate to Date', () => {
        const data = {
          ...baseValidInvestment,
          purchaseDate: '2024-01-15' as any,
        };
        const result = createInvestmentSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.purchaseDate).toBeInstanceOf(Date);
        }
      });
    });

    describe('name validation', () => {
      it('should reject empty name', () => {
        const data = {
          ...baseValidInvestment,
          name: '',
        };
        const result = createInvestmentSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain('name');
          expect(result.error.issues[0].message).toBe(ERROR_MESSAGES.REQUIRED_FIELD);
        }
      });

      it('should reject name with more than 100 characters', () => {
        const data = {
          ...baseValidInvestment,
          name: 'a'.repeat(101),
        };
        const result = createInvestmentSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain('name');
        }
      });

      it('should accept name with exactly 1 character (boundary)', () => {
        const data = {
          ...baseValidInvestment,
          name: 'X',
        };
        const result = createInvestmentSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should accept name with exactly 100 characters (boundary)', () => {
        const data = {
          ...baseValidInvestment,
          name: 'a'.repeat(100),
        };
        const result = createInvestmentSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should reject missing name', () => {
        const data = {
          ticker: 'PETR4',
          quantity: 100,
          averagePrice: 35,
          type: 'Ações',
          purchaseDate: new Date(),
          accountId: validUUID,
        };
        const result = createInvestmentSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          const nameIssue = result.error.issues.find((issue) => issue.path.includes('name'));
          expect(nameIssue).toBeDefined();
        }
      });

      it('should accept name with special characters', () => {
        const data = {
          ...baseValidInvestment,
          name: 'Vale S.A. - ON (VALE3)',
        };
        const result = createInvestmentSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    describe('ticker validation', () => {
      it('should accept valid ticker', () => {
        const data = {
          ...baseValidInvestment,
          ticker: 'PETR4',
        };
        const result = createInvestmentSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should accept ticker with exactly 20 characters (boundary)', () => {
        const data = {
          ...baseValidInvestment,
          ticker: 'a'.repeat(20),
        };
        const result = createInvestmentSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should reject ticker with more than 20 characters', () => {
        const data = {
          ...baseValidInvestment,
          ticker: 'a'.repeat(21),
        };
        const result = createInvestmentSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain('ticker');
        }
      });

      it('should accept undefined ticker (optional)', () => {
        const data = {
          name: 'Investimento',
          quantity: 10,
          averagePrice: 100,
          type: 'Ações',
          purchaseDate: new Date(),
          accountId: validUUID,
          ticker: undefined,
        };
        const result = createInvestmentSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should work without ticker', () => {
        const data = {
          name: 'Investimento',
          quantity: 10,
          averagePrice: 100,
          type: 'Ações',
          purchaseDate: new Date(),
          accountId: validUUID,
        };
        const result = createInvestmentSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.ticker).toBeUndefined();
        }
      });

      it('should accept ticker with numbers', () => {
        const data = {
          ...baseValidInvestment,
          ticker: 'PETR4',
        };
        const result = createInvestmentSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    describe('quantity validation', () => {
      it('should accept positive quantity', () => {
        const data = {
          ...baseValidInvestment,
          quantity: 100,
        };
        const result = createInvestmentSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should accept decimal quantity', () => {
        const data = {
          ...baseValidInvestment,
          quantity: 0.5,
        };
        const result = createInvestmentSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should accept very small quantity', () => {
        const data = {
          ...baseValidInvestment,
          quantity: 0.001,
        };
        const result = createInvestmentSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should reject quantity of 0', () => {
        const data = {
          ...baseValidInvestment,
          quantity: 0,
        };
        const result = createInvestmentSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain('quantity');
          expect(result.error.issues[0].message).toContain('maior que zero');
        }
      });

      it('should reject negative quantity', () => {
        const data = {
          ...baseValidInvestment,
          quantity: -10,
        };
        const result = createInvestmentSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should reject missing quantity', () => {
        const data = {
          name: 'Investimento',
          averagePrice: 100,
          type: 'Ações',
          purchaseDate: new Date(),
          accountId: validUUID,
        };
        const result = createInvestmentSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          const quantityIssue = result.error.issues.find((issue) =>
            issue.path.includes('quantity')
          );
          expect(quantityIssue).toBeDefined();
        }
      });
    });

    describe('averagePrice validation', () => {
      it('should accept positive averagePrice', () => {
        const data = {
          ...baseValidInvestment,
          averagePrice: 50.75,
        };
        const result = createInvestmentSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should accept averagePrice of 0', () => {
        const data = {
          ...baseValidInvestment,
          averagePrice: 0,
        };
        const result = createInvestmentSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should reject negative averagePrice', () => {
        const data = {
          ...baseValidInvestment,
          averagePrice: -10,
        };
        const result = createInvestmentSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain('averagePrice');
          expect(result.error.issues[0].message).toContain('não pode ser negativo');
        }
      });

      it('should accept decimal averagePrice', () => {
        const data = {
          ...baseValidInvestment,
          averagePrice: 123.456789,
        };
        const result = createInvestmentSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should reject missing averagePrice', () => {
        const data = {
          name: 'Investimento',
          quantity: 10,
          type: 'Ações',
          purchaseDate: new Date(),
          accountId: validUUID,
        };
        const result = createInvestmentSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          const avgPriceIssue = result.error.issues.find((issue) =>
            issue.path.includes('averagePrice')
          );
          expect(avgPriceIssue).toBeDefined();
        }
      });
    });

    describe('currentPrice validation', () => {
      it('should accept positive currentPrice', () => {
        const data = {
          ...baseValidInvestment,
          currentPrice: 100,
        };
        const result = createInvestmentSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should accept currentPrice of 0', () => {
        const data = {
          ...baseValidInvestment,
          currentPrice: 0,
        };
        const result = createInvestmentSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should reject negative currentPrice', () => {
        const data = {
          ...baseValidInvestment,
          currentPrice: -5,
        };
        const result = createInvestmentSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain('currentPrice');
        }
      });

      it('should accept undefined currentPrice (optional)', () => {
        const data = {
          name: 'Investimento',
          quantity: 10,
          averagePrice: 100,
          type: 'Ações',
          purchaseDate: new Date(),
          accountId: validUUID,
          currentPrice: undefined,
        };
        const result = createInvestmentSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should work without currentPrice', () => {
        const data = {
          name: 'Investimento',
          quantity: 10,
          averagePrice: 100,
          type: 'Ações',
          purchaseDate: new Date(),
          accountId: validUUID,
        };
        const result = createInvestmentSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.currentPrice).toBeUndefined();
        }
      });
    });

    describe('type validation', () => {
      it('should accept valid type', () => {
        const types = ['Ações BR', 'Ações US', 'FII', 'Crypto', 'Tesouro Direto', 'CDB'];
        types.forEach((type) => {
          const data = { ...baseValidInvestment, type };
          const result = createInvestmentSchema.safeParse(data);
          expect(result.success).toBe(true);
        });
      });

      it('should reject empty type', () => {
        const data = {
          ...baseValidInvestment,
          type: '',
        };
        const result = createInvestmentSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain('type');
          expect(result.error.issues[0].message).toBe(ERROR_MESSAGES.REQUIRED_FIELD);
        }
      });

      it('should reject missing type', () => {
        const data = {
          name: 'Investimento',
          quantity: 10,
          averagePrice: 100,
          purchaseDate: new Date(),
          accountId: validUUID,
        };
        const result = createInvestmentSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          const typeIssue = result.error.issues.find((issue) => issue.path.includes('type'));
          expect(typeIssue).toBeDefined();
        }
      });

      it('should accept type with special characters', () => {
        const data = {
          ...baseValidInvestment,
          type: 'Ações - Dividendos',
        };
        const result = createInvestmentSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    describe('purchaseDate validation', () => {
      it('should accept valid purchaseDate', () => {
        const data = {
          ...baseValidInvestment,
          purchaseDate: new Date('2024-01-15'),
        };
        const result = createInvestmentSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should coerce ISO string to Date', () => {
        const data = {
          ...baseValidInvestment,
          purchaseDate: '2024-01-15T00:00:00.000Z' as any,
        };
        const result = createInvestmentSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.purchaseDate).toBeInstanceOf(Date);
        }
      });

      it('should coerce date string to Date', () => {
        const data = {
          ...baseValidInvestment,
          purchaseDate: '2024-01-15' as any,
        };
        const result = createInvestmentSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should reject invalid purchaseDate', () => {
        const data = {
          ...baseValidInvestment,
          purchaseDate: 'invalid-date' as any,
        };
        const result = createInvestmentSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain('purchaseDate');
          expect(result.error.issues[0].message).toContain('Invalid');
        }
      });

      it('should reject missing purchaseDate', () => {
        const data = {
          name: 'Investimento',
          quantity: 10,
          averagePrice: 100,
          type: 'Ações',
          accountId: validUUID,
        };
        const result = createInvestmentSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          const dateIssue = result.error.issues.find((issue) =>
            issue.path.includes('purchaseDate')
          );
          expect(dateIssue).toBeDefined();
        }
      });

      it('should accept past purchaseDate', () => {
        const data = {
          ...baseValidInvestment,
          purchaseDate: new Date('2020-01-01'),
        };
        const result = createInvestmentSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    describe('accountId validation', () => {
      it('should accept valid UUID', () => {
        const data = {
          ...baseValidInvestment,
          accountId: validUUID,
        };
        const result = createInvestmentSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should reject invalid UUID format', () => {
        const data = {
          ...baseValidInvestment,
          accountId: 'not-a-uuid',
        };
        const result = createInvestmentSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain('accountId');
        }
      });

      it('should reject empty string accountId', () => {
        const data = {
          ...baseValidInvestment,
          accountId: '',
        };
        const result = createInvestmentSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should reject missing accountId', () => {
        const data = {
          name: 'Investimento',
          quantity: 10,
          averagePrice: 100,
          type: 'Ações',
          purchaseDate: new Date(),
        };
        const result = createInvestmentSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          const accountIdIssue = result.error.issues.find((issue) =>
            issue.path.includes('accountId')
          );
          expect(accountIdIssue).toBeDefined();
        }
      });

      it('should reject numeric accountId', () => {
        const data = {
          ...baseValidInvestment,
          accountId: 123 as any,
        };
        const result = createInvestmentSchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });

    describe('edge cases and security', () => {
      it('should handle SQL injection attempt in name', () => {
        const data = {
          ...baseValidInvestment,
          name: "'; DROP TABLE investments; --",
        };
        const result = createInvestmentSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should handle XSS attempt in name', () => {
        const data = {
          ...baseValidInvestment,
          name: '<script>alert("XSS")</script>',
        };
        const result = createInvestmentSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should reject object as name', () => {
        const data = {
          ...baseValidInvestment,
          name: { nested: 'value' } as any,
        };
        const result = createInvestmentSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should reject array as name', () => {
        const data = {
          ...baseValidInvestment,
          name: ['array'] as any,
        };
        const result = createInvestmentSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should accept unicode characters in name', () => {
        const data = {
          ...baseValidInvestment,
          name: 'Investimento 日本 中国',
        };
        const result = createInvestmentSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('updateInvestmentSchema', () => {
    it('should allow partial updates (only name)', () => {
      const data = {
        name: 'Novo Nome',
      };
      const result = updateInvestmentSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Novo Nome');
        expect(result.data.quantity).toBeUndefined();
      }
    });

    it('should allow partial updates (only quantity)', () => {
      const data = {
        quantity: 200,
      };
      const result = updateInvestmentSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should allow partial updates (only currentPrice)', () => {
      const data = {
        currentPrice: 45.50,
      };
      const result = updateInvestmentSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should allow empty object (no updates)', () => {
      const data = {};
      const result = updateInvestmentSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should allow updating multiple fields', () => {
      const data = {
        name: 'Investimento Atualizado',
        quantity: 150,
        currentPrice: 40.00,
        ticker: 'NEW',
      };
      const result = updateInvestmentSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should still validate name if provided', () => {
      const data = {
        name: '', // empty
      };
      const result = updateInvestmentSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should still validate quantity if provided', () => {
      const data = {
        quantity: 0, // must be positive
      };
      const result = updateInvestmentSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should still validate averagePrice if provided', () => {
      const data = {
        averagePrice: -10, // cannot be negative
      };
      const result = updateInvestmentSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should still validate currentPrice if provided', () => {
      const data = {
        currentPrice: -5, // cannot be negative
      };
      const result = updateInvestmentSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should still validate accountId UUID if provided', () => {
      const data = {
        accountId: 'not-a-uuid',
      };
      const result = updateInvestmentSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });
});
