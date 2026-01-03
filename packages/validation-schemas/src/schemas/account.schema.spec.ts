import { AccountType } from '@fayol/shared-types';
import { LIMITS } from '@fayol/shared-constants';
import {
  createAccountSchema,
  updateAccountSchema,
  CreateAccountInput,
  UpdateAccountInput,
} from './account.schema';

describe('account.schema', () => {
  describe('createAccountSchema', () => {
    describe('valid data', () => {
      it('should validate checking account with default currency', () => {
        const data = {
          name: 'Conta Corrente Principal',
          type: AccountType.CHECKING,
          balance: 1000,
        };
        const result = createAccountSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.currency).toBe('BRL'); // default
        }
      });

      it('should validate savings account', () => {
        const data = {
          name: 'Poupança',
          type: AccountType.SAVINGS,
          balance: 5000,
          currency: 'BRL',
        };
        const result = createAccountSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should validate investment account with USD', () => {
        const data = {
          name: 'Interactive Brokers',
          type: AccountType.INVESTMENT,
          balance: 10000,
          currency: 'USD',
        };
        const result = createAccountSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.currency).toBe('USD');
        }
      });

      it('should validate cash account', () => {
        const data = {
          name: 'Carteira',
          type: AccountType.CASH,
          balance: 200,
        };
        const result = createAccountSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should validate credit card with creditLimit', () => {
        const data = {
          name: 'Nubank',
          type: AccountType.CREDIT_CARD,
          balance: -500, // negative balance = debt
          creditLimit: 5000,
        };
        const result = createAccountSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.creditLimit).toBe(5000);
        }
      });

      it('should validate other account type', () => {
        const data = {
          name: 'Cofre',
          type: AccountType.OTHER,
          balance: 100,
        };
        const result = createAccountSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should validate with optional color and icon', () => {
        const data = {
          name: 'Conta Colorida',
          type: AccountType.CHECKING,
          balance: 1000,
          color: '#FF5733',
          icon: '💰',
        };
        const result = createAccountSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.color).toBe('#FF5733');
          expect(result.data.icon).toBe('💰');
        }
      });

      it('should validate with balance as string and convert to number', () => {
        const data = {
          name: 'Conta',
          type: AccountType.CHECKING,
          balance: '1500.50' as any,
        };
        const result = createAccountSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.balance).toBe(1500.50);
          expect(typeof result.data.balance).toBe('number');
        }
      });

      it('should validate with creditLimit as string and convert to number', () => {
        const data = {
          name: 'Cartão',
          type: AccountType.CREDIT_CARD,
          balance: 0,
          creditLimit: '3000' as any,
        };
        const result = createAccountSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.creditLimit).toBe(3000);
        }
      });
    });

    describe('name validation', () => {
      it('should reject name with less than 3 characters', () => {
        const data = {
          name: 'ab', // 2 chars
          type: AccountType.CHECKING,
          balance: 0,
        };
        const result = createAccountSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain('name');
          expect(result.error.issues[0].message).toContain(`${LIMITS.ACCOUNT.NAME_MIN}`);
        }
      });

      it('should reject name with more than 50 characters', () => {
        const data = {
          name: 'a'.repeat(51),
          type: AccountType.CHECKING,
          balance: 0,
        };
        const result = createAccountSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain('name');
          expect(result.error.issues[0].message).toContain(`${LIMITS.ACCOUNT.NAME_MAX}`);
        }
      });

      it('should accept name with exactly 3 characters (boundary)', () => {
        const data = {
          name: 'abc',
          type: AccountType.CHECKING,
          balance: 0,
        };
        const result = createAccountSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should accept name with exactly 50 characters (boundary)', () => {
        const data = {
          name: 'a'.repeat(50),
          type: AccountType.CHECKING,
          balance: 0,
        };
        const result = createAccountSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should reject empty name', () => {
        const data = {
          name: '',
          type: AccountType.CHECKING,
          balance: 0,
        };
        const result = createAccountSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain('name');
        }
      });

      it('should reject missing name', () => {
        const data = {
          type: AccountType.CHECKING,
          balance: 0,
        };
        const result = createAccountSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          const nameIssue = result.error.issues.find((issue) => issue.path.includes('name'));
          expect(nameIssue).toBeDefined();
        }
      });

      it('should accept name with special characters', () => {
        const data = {
          name: 'Conta do João - BB (2024)',
          type: AccountType.CHECKING,
          balance: 0,
        };
        const result = createAccountSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    describe('type validation', () => {
      it('should reject invalid account type', () => {
        const data = {
          name: 'Conta',
          type: 'INVALID_TYPE' as any,
          balance: 0,
        };
        const result = createAccountSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain('type');
          expect(result.error.issues[0].message).toContain('inválido');
        }
      });

      it('should reject numeric type', () => {
        const data = {
          name: 'Conta',
          type: 123 as any,
          balance: 0,
        };
        const result = createAccountSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should reject null type', () => {
        const data = {
          name: 'Conta',
          type: null as any,
          balance: 0,
        };
        const result = createAccountSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should reject missing type', () => {
        const data = {
          name: 'Conta',
          balance: 0,
        };
        const result = createAccountSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          const typeIssue = result.error.issues.find((issue) => issue.path.includes('type'));
          expect(typeIssue).toBeDefined();
        }
      });
    });

    describe('balance preprocessing and validation', () => {
      it('should convert empty string to 0', () => {
        const data = {
          name: 'Conta',
          type: AccountType.CHECKING,
          balance: '' as any,
        };
        const result = createAccountSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.balance).toBe(0);
        }
      });

      it('should convert undefined to 0', () => {
        const data = {
          name: 'Conta',
          type: AccountType.CHECKING,
          balance: undefined as any,
        };
        const result = createAccountSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.balance).toBe(0);
        }
      });

      it('should accept balance of 0', () => {
        const data = {
          name: 'Conta',
          type: AccountType.CHECKING,
          balance: 0,
        };
        const result = createAccountSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should accept negative balance', () => {
        const data = {
          name: 'Conta',
          type: AccountType.CREDIT_CARD,
          balance: -1000,
        };
        const result = createAccountSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.balance).toBe(-1000);
        }
      });

      it('should accept decimal balance', () => {
        const data = {
          name: 'Conta',
          type: AccountType.CHECKING,
          balance: 1234.56,
        };
        const result = createAccountSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should accept large balance', () => {
        const data = {
          name: 'Conta',
          type: AccountType.INVESTMENT,
          balance: 999999999.99,
        };
        const result = createAccountSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should reject non-numeric balance after preprocessing', () => {
        const data = {
          name: 'Conta',
          type: AccountType.CHECKING,
          balance: 'abc' as any,
        };
        const result = createAccountSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('número');
        }
      });
    });

    describe('creditLimit preprocessing and validation', () => {
      it('should convert empty string to undefined', () => {
        const data = {
          name: 'Conta',
          type: AccountType.CREDIT_CARD,
          balance: 0,
          creditLimit: '' as any,
        };
        const result = createAccountSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.creditLimit).toBeUndefined();
        }
      });

      it('should convert null to undefined', () => {
        const data = {
          name: 'Conta',
          type: AccountType.CREDIT_CARD,
          balance: 0,
          creditLimit: null as any,
        };
        const result = createAccountSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.creditLimit).toBeUndefined();
        }
      });

      it('should convert undefined to undefined (optional)', () => {
        const data = {
          name: 'Conta',
          type: AccountType.CREDIT_CARD,
          balance: 0,
          creditLimit: undefined as any,
        };
        const result = createAccountSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.creditLimit).toBeUndefined();
        }
      });

      it('should accept valid creditLimit', () => {
        const data = {
          name: 'Conta',
          type: AccountType.CREDIT_CARD,
          balance: 0,
          creditLimit: 5000,
        };
        const result = createAccountSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.creditLimit).toBe(5000);
        }
      });

      it('should accept creditLimit of 0', () => {
        const data = {
          name: 'Conta',
          type: AccountType.CREDIT_CARD,
          balance: 0,
          creditLimit: 0,
        };
        const result = createAccountSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should reject negative creditLimit', () => {
        const data = {
          name: 'Conta',
          type: AccountType.CREDIT_CARD,
          balance: 0,
          creditLimit: -1000 as any,
        };
        const result = createAccountSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          const creditLimitIssue = result.error.issues.find((issue) =>
            issue.path.includes('creditLimit')
          );
          expect(creditLimitIssue).toBeDefined();
        }
      });

      it('should accept large creditLimit', () => {
        const data = {
          name: 'Conta',
          type: AccountType.CREDIT_CARD,
          balance: 0,
          creditLimit: 100000,
        };
        const result = createAccountSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should work without creditLimit (optional)', () => {
        const data = {
          name: 'Conta',
          type: AccountType.CHECKING,
          balance: 1000,
        };
        const result = createAccountSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.creditLimit).toBeUndefined();
        }
      });
    });

    describe('currency validation', () => {
      it('should default to BRL when not provided', () => {
        const data = {
          name: 'Conta',
          type: AccountType.CHECKING,
          balance: 1000,
        };
        const result = createAccountSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.currency).toBe('BRL');
        }
      });

      it('should accept custom currency USD', () => {
        const data = {
          name: 'Conta',
          type: AccountType.CHECKING,
          balance: 1000,
          currency: 'USD',
        };
        const result = createAccountSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.currency).toBe('USD');
        }
      });

      it('should accept custom currency EUR', () => {
        const data = {
          name: 'Conta',
          type: AccountType.CHECKING,
          balance: 1000,
          currency: 'EUR',
        };
        const result = createAccountSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should accept any string as currency (no enum restriction)', () => {
        const data = {
          name: 'Conta',
          type: AccountType.CHECKING,
          balance: 1000,
          currency: 'BTC',
        };
        const result = createAccountSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    describe('optional fields', () => {
      it('should work without color', () => {
        const data = {
          name: 'Conta',
          type: AccountType.CHECKING,
          balance: 1000,
        };
        const result = createAccountSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.color).toBeUndefined();
        }
      });

      it('should work without icon', () => {
        const data = {
          name: 'Conta',
          type: AccountType.CHECKING,
          balance: 1000,
        };
        const result = createAccountSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.icon).toBeUndefined();
        }
      });

      it('should accept color in hex format', () => {
        const data = {
          name: 'Conta',
          type: AccountType.CHECKING,
          balance: 1000,
          color: '#FF5733',
        };
        const result = createAccountSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should accept icon emoji', () => {
        const data = {
          name: 'Conta',
          type: AccountType.CHECKING,
          balance: 1000,
          icon: '🏦',
        };
        const result = createAccountSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    describe('edge cases and security', () => {
      it('should handle SQL injection attempt in name', () => {
        const data = {
          name: "'; DROP TABLE accounts; --",
          type: AccountType.CHECKING,
          balance: 0,
        };
        const result = createAccountSchema.safeParse(data);
        expect(result.success).toBe(true); // accepted as string
        if (result.success) {
          expect(result.data.name).toBe("'; DROP TABLE accounts; --");
        }
      });

      it('should handle XSS attempt in name', () => {
        const data = {
          name: '<script>alert("XSS")</script>',
          type: AccountType.CHECKING,
          balance: 0,
        };
        const result = createAccountSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should reject object as name', () => {
        const data = {
          name: { nested: 'value' } as any,
          type: AccountType.CHECKING,
          balance: 0,
        };
        const result = createAccountSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should reject array as name', () => {
        const data = {
          name: ['array', 'value'] as any,
          type: AccountType.CHECKING,
          balance: 0,
        };
        const result = createAccountSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should handle unicode characters in name', () => {
        const data = {
          name: 'Conta 日本語 中文',
          type: AccountType.CHECKING,
          balance: 0,
        };
        const result = createAccountSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('updateAccountSchema', () => {
    it('should allow partial updates (only name)', () => {
      const data = {
        name: 'Novo Nome',
      };
      const result = updateAccountSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Novo Nome');
        expect(result.data.type).toBeUndefined();
        expect(result.data.balance).toBeUndefined();
      }
    });

    it('should allow partial updates (only type)', () => {
      const data = {
        type: AccountType.SAVINGS,
      };
      const result = updateAccountSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe(AccountType.SAVINGS);
      }
    });

    it('should allow partial updates (only balance)', () => {
      const data = {
        balance: 2000,
      };
      const result = updateAccountSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.balance).toBe(2000);
      }
    });

    it('should allow empty object (no updates)', () => {
      const data = {};
      const result = updateAccountSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should allow updating multiple fields', () => {
      const data = {
        name: 'Conta Atualizada',
        balance: 3000,
        color: '#00FF00',
      };
      const result = updateAccountSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Conta Atualizada');
        expect(result.data.balance).toBe(3000);
        expect(result.data.color).toBe('#00FF00');
      }
    });

    it('should still validate name length if provided', () => {
      const data = {
        name: 'ab', // too short
      };
      const result = updateAccountSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should still validate type enum if provided', () => {
      const data = {
        type: 'INVALID' as any,
      };
      const result = updateAccountSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should still validate creditLimit min if provided', () => {
      const data = {
        creditLimit: -500,
      };
      const result = updateAccountSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });
});
