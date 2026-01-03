import { ERROR_MESSAGES } from '@fayol/shared-constants';
import {
  createBudgetSchema,
  updateBudgetSchema,
  CreateBudgetInput,
  UpdateBudgetInput,
} from './budget.schema';

describe('budget.schema', () => {
  const validUUID = '550e8400-e29b-41d4-a716-446655440000';
  const baseValidBudget = {
    name: 'Orçamento de Alimentação',
    amount: 1000,
    categoryId: validUUID,
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-01-31'),
    notifyThreshold: 80,
  };

  describe('createBudgetSchema', () => {
    describe('valid data', () => {
      it('should validate budget with all fields', () => {
        const result = createBudgetSchema.safeParse(baseValidBudget);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.name).toBe('Orçamento de Alimentação');
          expect(result.data.amount).toBe(1000);
          expect(result.data.categoryId).toBe(validUUID);
          expect(result.data.notifyThreshold).toBe(80);
        }
      });

      it('should validate budget without categoryId (global budget)', () => {
        const data = {
          name: 'Orçamento Global',
          amount: 5000,
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-12-31'),
        };
        const result = createBudgetSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.categoryId).toBeUndefined();
        }
      });

      it('should validate budget without notifyThreshold', () => {
        const data = {
          name: 'Orçamento Simples',
          amount: 500,
          categoryId: validUUID,
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31'),
        };
        const result = createBudgetSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.notifyThreshold).toBeUndefined();
        }
      });

      it('should validate budget with minimum amount', () => {
        const data = {
          ...baseValidBudget,
          amount: 0.01,
        };
        const result = createBudgetSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should validate budget with large amount', () => {
        const data = {
          ...baseValidBudget,
          amount: 999999999.99,
        };
        const result = createBudgetSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should coerce string dates to Date objects', () => {
        const data = {
          name: 'Orçamento',
          amount: 1000,
          startDate: '2024-01-01' as any,
          endDate: '2024-01-31' as any,
        };
        const result = createBudgetSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.startDate).toBeInstanceOf(Date);
          expect(result.data.endDate).toBeInstanceOf(Date);
        }
      });
    });

    describe('name validation', () => {
      it('should reject empty name', () => {
        const data = {
          ...baseValidBudget,
          name: '',
        };
        const result = createBudgetSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain('name');
          expect(result.error.issues[0].message).toBe(ERROR_MESSAGES.REQUIRED_FIELD);
        }
      });

      it('should reject name with more than 50 characters', () => {
        const data = {
          ...baseValidBudget,
          name: 'a'.repeat(51),
        };
        const result = createBudgetSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain('name');
        }
      });

      it('should accept name with exactly 1 character (boundary)', () => {
        const data = {
          ...baseValidBudget,
          name: 'a',
        };
        const result = createBudgetSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should accept name with exactly 50 characters (boundary)', () => {
        const data = {
          ...baseValidBudget,
          name: 'a'.repeat(50),
        };
        const result = createBudgetSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should reject missing name', () => {
        const data = {
          amount: 1000,
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31'),
        };
        const result = createBudgetSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          const nameIssue = result.error.issues.find((issue) => issue.path.includes('name'));
          expect(nameIssue).toBeDefined();
        }
      });

      it('should accept name with special characters', () => {
        const data = {
          ...baseValidBudget,
          name: 'Orçamento 2024 - Alimentação & Transporte (Jan)',
        };
        const result = createBudgetSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should accept name with unicode characters', () => {
        const data = {
          ...baseValidBudget,
          name: 'Orçamento 日本 2024',
        };
        const result = createBudgetSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    describe('amount validation', () => {
      it('should reject amount of 0', () => {
        const data = {
          ...baseValidBudget,
          amount: 0,
        };
        const result = createBudgetSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain('amount');
          expect(result.error.issues[0].message).toContain('maior que zero');
        }
      });

      it('should reject negative amount', () => {
        const data = {
          ...baseValidBudget,
          amount: -100,
        };
        const result = createBudgetSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should accept decimal amount', () => {
        const data = {
          ...baseValidBudget,
          amount: 123.45,
        };
        const result = createBudgetSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should reject missing amount', () => {
        const data = {
          name: 'Orçamento',
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31'),
        };
        const result = createBudgetSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          const amountIssue = result.error.issues.find((issue) => issue.path.includes('amount'));
          expect(amountIssue).toBeDefined();
        }
      });

      it('should reject non-numeric amount', () => {
        const data = {
          ...baseValidBudget,
          amount: 'abc' as any,
        };
        const result = createBudgetSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should reject string amount', () => {
        const data = {
          ...baseValidBudget,
          amount: '1000' as any,
        };
        const result = createBudgetSchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });

    describe('categoryId validation', () => {
      it('should accept valid UUID', () => {
        const data = {
          ...baseValidBudget,
          categoryId: validUUID,
        };
        const result = createBudgetSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should accept undefined categoryId (optional)', () => {
        const data = {
          name: 'Orçamento',
          amount: 1000,
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31'),
          categoryId: undefined,
        };
        const result = createBudgetSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should reject invalid UUID format', () => {
        const data = {
          ...baseValidBudget,
          categoryId: 'not-a-uuid',
        };
        const result = createBudgetSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain('categoryId');
        }
      });

      it('should reject empty string categoryId', () => {
        const data = {
          ...baseValidBudget,
          categoryId: '',
        };
        const result = createBudgetSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should reject numeric categoryId', () => {
        const data = {
          ...baseValidBudget,
          categoryId: 123 as any,
        };
        const result = createBudgetSchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });

    describe('date validation', () => {
      it('should accept valid startDate', () => {
        const data = {
          ...baseValidBudget,
          startDate: new Date('2024-01-01'),
        };
        const result = createBudgetSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should accept valid endDate', () => {
        const data = {
          ...baseValidBudget,
          endDate: new Date('2024-12-31'),
        };
        const result = createBudgetSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should coerce ISO string to Date', () => {
        const data = {
          ...baseValidBudget,
          startDate: '2024-01-01T00:00:00.000Z' as any,
          endDate: '2024-01-31T23:59:59.999Z' as any,
        };
        const result = createBudgetSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.startDate).toBeInstanceOf(Date);
          expect(result.data.endDate).toBeInstanceOf(Date);
        }
      });

      it('should reject invalid startDate', () => {
        const data = {
          ...baseValidBudget,
          startDate: 'invalid-date' as any,
        };
        const result = createBudgetSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain('startDate');
          expect(result.error.issues[0].message).toContain('Invalid');
        }
      });

      it('should reject invalid endDate', () => {
        const data = {
          ...baseValidBudget,
          endDate: 'not-a-date' as any,
        };
        const result = createBudgetSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain('endDate');
        }
      });

      it('should reject missing startDate', () => {
        const data = {
          name: 'Orçamento',
          amount: 1000,
          endDate: new Date('2024-01-31'),
        };
        const result = createBudgetSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          const startDateIssue = result.error.issues.find((issue) =>
            issue.path.includes('startDate')
          );
          expect(startDateIssue).toBeDefined();
        }
      });

      it('should reject missing endDate', () => {
        const data = {
          name: 'Orçamento',
          amount: 1000,
          startDate: new Date('2024-01-01'),
        };
        const result = createBudgetSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          const endDateIssue = result.error.issues.find((issue) => issue.path.includes('endDate'));
          expect(endDateIssue).toBeDefined();
        }
      });

      it('should accept endDate before startDate (no refinement)', () => {
        const data = {
          ...baseValidBudget,
          startDate: new Date('2024-12-31'),
          endDate: new Date('2024-01-01'),
        };
        const result = createBudgetSchema.safeParse(data);
        expect(result.success).toBe(true); // schema doesn't enforce this
      });
    });

    describe('notifyThreshold validation', () => {
      it('should accept valid notifyThreshold (80%)', () => {
        const data = {
          ...baseValidBudget,
          notifyThreshold: 80,
        };
        const result = createBudgetSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should accept minimum notifyThreshold (1)', () => {
        const data = {
          ...baseValidBudget,
          notifyThreshold: 1,
        };
        const result = createBudgetSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should accept maximum notifyThreshold (100)', () => {
        const data = {
          ...baseValidBudget,
          notifyThreshold: 100,
        };
        const result = createBudgetSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should reject notifyThreshold of 0', () => {
        const data = {
          ...baseValidBudget,
          notifyThreshold: 0,
        };
        const result = createBudgetSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain('notifyThreshold');
        }
      });

      it('should reject notifyThreshold above 100', () => {
        const data = {
          ...baseValidBudget,
          notifyThreshold: 101,
        };
        const result = createBudgetSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should reject negative notifyThreshold', () => {
        const data = {
          ...baseValidBudget,
          notifyThreshold: -10,
        };
        const result = createBudgetSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should accept undefined notifyThreshold (optional)', () => {
        const data = {
          name: 'Orçamento',
          amount: 1000,
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31'),
          notifyThreshold: undefined,
        };
        const result = createBudgetSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should accept decimal notifyThreshold', () => {
        const data = {
          ...baseValidBudget,
          notifyThreshold: 85.5,
        };
        const result = createBudgetSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should reject string notifyThreshold', () => {
        const data = {
          ...baseValidBudget,
          notifyThreshold: '80' as any,
        };
        const result = createBudgetSchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });

    describe('edge cases and security', () => {
      it('should handle SQL injection attempt in name', () => {
        const data = {
          ...baseValidBudget,
          name: "'; DROP TABLE budgets; --",
        };
        const result = createBudgetSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should handle XSS attempt in name', () => {
        const data = {
          ...baseValidBudget,
          name: '<script>alert("XSS")</script>',
        };
        const result = createBudgetSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should reject object as name', () => {
        const data = {
          ...baseValidBudget,
          name: { nested: 'value' } as any,
        };
        const result = createBudgetSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should reject array as name', () => {
        const data = {
          ...baseValidBudget,
          name: ['array'] as any,
        };
        const result = createBudgetSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should reject null as amount', () => {
        const data = {
          ...baseValidBudget,
          amount: null as any,
        };
        const result = createBudgetSchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('updateBudgetSchema', () => {
    it('should allow partial updates (only name)', () => {
      const data = {
        name: 'Novo Nome',
      };
      const result = updateBudgetSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Novo Nome');
        expect(result.data.amount).toBeUndefined();
      }
    });

    it('should allow partial updates (only amount)', () => {
      const data = {
        amount: 2000,
      };
      const result = updateBudgetSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.amount).toBe(2000);
      }
    });

    it('should allow partial updates (only dates)', () => {
      const data = {
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-02-29'),
      };
      const result = updateBudgetSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should allow empty object (no updates)', () => {
      const data = {};
      const result = updateBudgetSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should allow updating multiple fields', () => {
      const data = {
        name: 'Orçamento Atualizado',
        amount: 3000,
        notifyThreshold: 90,
      };
      const result = updateBudgetSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should still validate name if provided', () => {
      const data = {
        name: '', // empty
      };
      const result = updateBudgetSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should still validate amount if provided', () => {
      const data = {
        amount: 0, // must be > 0
      };
      const result = updateBudgetSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should still validate notifyThreshold if provided', () => {
      const data = {
        notifyThreshold: 150, // max 100
      };
      const result = updateBudgetSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should still validate categoryId UUID if provided', () => {
      const data = {
        categoryId: 'not-a-uuid',
      };
      const result = updateBudgetSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });
});
