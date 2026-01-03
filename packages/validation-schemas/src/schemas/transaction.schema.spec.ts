import { createTransactionSchema, updateTransactionSchema } from './transaction.schema';
import { LIMITS, ERROR_MESSAGES } from '@fayol/shared-constants';
import { LaunchType, Recurrence } from '@fayol/shared-types';

describe('transaction.schema', () => {
  const validUUID = '123e4567-e89b-12d3-a456-426614174000';
  const anotherValidUUID = '223e4567-e89b-12d3-a456-426614174000';

  const baseValidTransaction = {
    description: 'Salary payment',
    amount: 5000,
    date: new Date('2024-01-15'),
    type: LaunchType.INCOME,
    accountId: validUUID,
    categoryId: anotherValidUUID,
    isPaid: true,
    recurrence: Recurrence.NONE,
  };

  // ==================== CREATE TRANSACTION SCHEMA ====================
  describe('createTransactionSchema', () => {
    describe('valid data', () => {
      it('should validate income transaction', () => {
        const result = createTransactionSchema.safeParse(baseValidTransaction);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.type).toBe(LaunchType.INCOME);
          expect(result.data.amount).toBe(5000);
        }
      });

      it('should validate expense transaction', () => {
        const data = {
          ...baseValidTransaction,
          type: LaunchType.EXPENSE,
          amount: 150.50,
          description: 'Grocery shopping',
        };

        const result = createTransactionSchema.safeParse(data);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.type).toBe(LaunchType.EXPENSE);
        }
      });

      it('should validate transfer transaction with destination account', () => {
        const data = {
          ...baseValidTransaction,
          type: LaunchType.TRANSFER,
          destinationAccountId: anotherValidUUID,
          description: 'Transfer between accounts',
        };

        const result = createTransactionSchema.safeParse(data);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.type).toBe(LaunchType.TRANSFER);
          expect(result.data.destinationAccountId).toBe(anotherValidUUID);
        }
      });

      it('should validate with minimum amount', () => {
        const data = {
          ...baseValidTransaction,
          amount: LIMITS.TRANSACTION.MIN_AMOUNT, // 0.01
        };

        const result = createTransactionSchema.safeParse(data);

        expect(result.success).toBe(true);
      });

      it('should validate with maximum amount', () => {
        const data = {
          ...baseValidTransaction,
          amount: LIMITS.TRANSACTION.MAX_AMOUNT, // 999999999.99
        };

        const result = createTransactionSchema.safeParse(data);

        expect(result.success).toBe(true);
      });

      it('should validate without categoryId (optional for AI processing)', () => {
        const { categoryId, ...dataWithoutCategory } = baseValidTransaction;

        const result = createTransactionSchema.safeParse(dataWithoutCategory);

        expect(result.success).toBe(true);
      });

      it('should validate with null categoryId', () => {
        const data = {
          ...baseValidTransaction,
          categoryId: null,
        };

        const result = createTransactionSchema.safeParse(data);

        expect(result.success).toBe(true);
      });

      it('should validate with all recurrence types', () => {
        const recurrenceTypes = [
          Recurrence.NONE,
          Recurrence.DAILY,
          Recurrence.WEEKLY,
          Recurrence.MONTHLY,
          Recurrence.YEARLY,
          Recurrence.CUSTOM,
        ];

        recurrenceTypes.forEach((recurrence) => {
          const data = { ...baseValidTransaction, recurrence };
          const result = createTransactionSchema.safeParse(data);
          expect(result.success).toBe(true);
        });
      });

      it('should validate with isPaid true', () => {
        const data = {
          ...baseValidTransaction,
          isPaid: true,
        };

        const result = createTransactionSchema.safeParse(data);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.isPaid).toBe(true);
        }
      });

      it('should validate with isPaid false', () => {
        const data = {
          ...baseValidTransaction,
          isPaid: false,
        };

        const result = createTransactionSchema.safeParse(data);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.isPaid).toBe(false);
        }
      });

      it('should default isPaid to true when not provided', () => {
        const { isPaid, ...dataWithoutIsPaid } = baseValidTransaction;

        const result = createTransactionSchema.safeParse(dataWithoutIsPaid);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.isPaid).toBe(true);
        }
      });

      it('should default recurrence to NONE when not provided', () => {
        const { recurrence, ...dataWithoutRecurrence } = baseValidTransaction;

        const result = createTransactionSchema.safeParse(dataWithoutRecurrence);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.recurrence).toBe(Recurrence.NONE);
        }
      });

      it('should validate with notes', () => {
        const data = {
          ...baseValidTransaction,
          notes: 'This is a note about the transaction',
        };

        const result = createTransactionSchema.safeParse(data);

        expect(result.success).toBe(true);
      });

      it('should validate with maximum notes length', () => {
        const data = {
          ...baseValidTransaction,
          notes: 'A'.repeat(LIMITS.TRANSACTION.NOTES_MAX), // 1000 characters
        };

        const result = createTransactionSchema.safeParse(data);

        expect(result.success).toBe(true);
      });

      it('should validate without notes (optional)', () => {
        const result = createTransactionSchema.safeParse(baseValidTransaction);

        expect(result.success).toBe(true);
      });

      it('should validate with tags array', () => {
        const data = {
          ...baseValidTransaction,
          tags: ['business', 'important', 'tax-deductible'],
        };

        const result = createTransactionSchema.safeParse(data);

        expect(result.success).toBe(true);
      });

      it('should validate with empty tags array', () => {
        const data = {
          ...baseValidTransaction,
          tags: [],
        };

        const result = createTransactionSchema.safeParse(data);

        expect(result.success).toBe(true);
      });

      it('should validate without tags (optional)', () => {
        const result = createTransactionSchema.safeParse(baseValidTransaction);

        expect(result.success).toBe(true);
      });

      it('should coerce date from string', () => {
        const data = {
          ...baseValidTransaction,
          date: '2024-01-15' as any,
        };

        const result = createTransactionSchema.safeParse(data);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.date).toBeInstanceOf(Date);
        }
      });

      it('should coerce date from ISO string', () => {
        const data = {
          ...baseValidTransaction,
          date: '2024-01-15T10:30:00.000Z' as any,
        };

        const result = createTransactionSchema.safeParse(data);

        expect(result.success).toBe(true);
      });

      it('should validate with decimal amount', () => {
        const data = {
          ...baseValidTransaction,
          amount: 123.45,
        };

        const result = createTransactionSchema.safeParse(data);

        expect(result.success).toBe(true);
      });

      it('should validate with very small amount', () => {
        const data = {
          ...baseValidTransaction,
          amount: 0.01,
        };

        const result = createTransactionSchema.safeParse(data);

        expect(result.success).toBe(true);
      });
    });

    describe('invalid description', () => {
      it('should reject empty description', () => {
        const data = {
          ...baseValidTransaction,
          description: '',
        };

        const result = createTransactionSchema.safeParse(data);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain('description');
          expect(result.error.issues[0].message).toBe(ERROR_MESSAGES.REQUIRED_FIELD);
        }
      });

      it('should reject description exceeding max length', () => {
        const data = {
          ...baseValidTransaction,
          description: 'A'.repeat(LIMITS.TRANSACTION.DESCRIPTION_MAX + 1), // 256 chars
        };

        const result = createTransactionSchema.safeParse(data);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain('description');
          expect(result.error.issues[0].message).toContain('muito longa');
        }
      });

      it('should reject missing description', () => {
        const { description, ...dataWithoutDescription } = baseValidTransaction;

        const result = createTransactionSchema.safeParse(dataWithoutDescription);

        expect(result.success).toBe(false);
      });
    });

    describe('invalid amount', () => {
      it('should reject amount below minimum', () => {
        const data = {
          ...baseValidTransaction,
          amount: 0, // below MIN_AMOUNT (0.01)
        };

        const result = createTransactionSchema.safeParse(data);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain('amount');
          expect(result.error.issues[0].message).toContain('maior que zero');
        }
      });

      it('should reject negative amount', () => {
        const data = {
          ...baseValidTransaction,
          amount: -100,
        };

        const result = createTransactionSchema.safeParse(data);

        expect(result.success).toBe(false);
      });

      it('should reject amount exceeding maximum', () => {
        const data = {
          ...baseValidTransaction,
          amount: LIMITS.TRANSACTION.MAX_AMOUNT + 1,
        };

        const result = createTransactionSchema.safeParse(data);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain('amount');
          expect(result.error.issues[0].message).toContain('excede o limite');
        }
      });

      it('should reject string amount', () => {
        const data = {
          ...baseValidTransaction,
          amount: '100' as any,
        };

        const result = createTransactionSchema.safeParse(data);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('número');
        }
      });

      it('should reject missing amount', () => {
        const { amount, ...dataWithoutAmount } = baseValidTransaction;

        const result = createTransactionSchema.safeParse(dataWithoutAmount);

        expect(result.success).toBe(false);
      });
    });

    describe('invalid date', () => {
      it('should reject invalid date string', () => {
        const data = {
          ...baseValidTransaction,
          date: 'invalid-date' as any,
        };

        const result = createTransactionSchema.safeParse(data);

        expect(result.success).toBe(false);
        if (!result.success) {
          // Zod coerce.date returns "Invalid date" message
          expect(result.error.issues[0].message).toContain('Invalid');
        }
      });

      it('should reject missing date', () => {
        const { date, ...dataWithoutDate } = baseValidTransaction;

        const result = createTransactionSchema.safeParse(dataWithoutDate);

        expect(result.success).toBe(false);
      });
    });

    describe('invalid type', () => {
      it('should reject invalid transaction type', () => {
        const data = {
          ...baseValidTransaction,
          type: 'INVALID_TYPE' as any,
        };

        const result = createTransactionSchema.safeParse(data);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('Tipo de lançamento inválido');
        }
      });

      it('should reject missing type', () => {
        const { type, ...dataWithoutType } = baseValidTransaction;

        const result = createTransactionSchema.safeParse(dataWithoutType);

        expect(result.success).toBe(false);
      });
    });

    describe('invalid accountId', () => {
      it('should reject invalid UUID for accountId', () => {
        const data = {
          ...baseValidTransaction,
          accountId: 'invalid-uuid',
        };

        const result = createTransactionSchema.safeParse(data);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain('accountId');
        }
      });

      it('should reject empty accountId', () => {
        const data = {
          ...baseValidTransaction,
          accountId: '',
        };

        const result = createTransactionSchema.safeParse(data);

        expect(result.success).toBe(false);
      });

      it('should reject missing accountId', () => {
        const { accountId, ...dataWithoutAccountId } = baseValidTransaction;

        const result = createTransactionSchema.safeParse(dataWithoutAccountId);

        expect(result.success).toBe(false);
      });
    });

    describe('transfer validations (refinements)', () => {
      it('should reject transfer without destinationAccountId', () => {
        const data = {
          ...baseValidTransaction,
          type: LaunchType.TRANSFER,
          // missing destinationAccountId
        };

        const result = createTransactionSchema.safeParse(data);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain('destinationAccountId');
          expect(result.error.issues[0].message).toContain('conta de destino');
        }
      });

      it('should reject transfer with same source and destination', () => {
        const data = {
          ...baseValidTransaction,
          type: LaunchType.TRANSFER,
          accountId: validUUID,
          destinationAccountId: validUUID, // same as accountId
        };

        const result = createTransactionSchema.safeParse(data);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('diferente da origem');
        }
      });

      it('should reject transfer with invalid destinationAccountId UUID', () => {
        const data = {
          ...baseValidTransaction,
          type: LaunchType.TRANSFER,
          destinationAccountId: 'invalid-uuid',
        };

        const result = createTransactionSchema.safeParse(data);

        expect(result.success).toBe(false);
      });
    });

    describe('invalid recurrence', () => {
      it('should reject invalid recurrence value', () => {
        const data = {
          ...baseValidTransaction,
          recurrence: 'INVALID' as any,
        };

        const result = createTransactionSchema.safeParse(data);

        expect(result.success).toBe(false);
      });
    });

    describe('invalid notes', () => {
      it('should reject notes exceeding max length', () => {
        const data = {
          ...baseValidTransaction,
          notes: 'A'.repeat(LIMITS.TRANSACTION.NOTES_MAX + 1), // 1001 chars
        };

        const result = createTransactionSchema.safeParse(data);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain('notes');
        }
      });
    });

    describe('invalid tags', () => {
      it('should reject non-array tags', () => {
        const data = {
          ...baseValidTransaction,
          tags: 'not-an-array' as any,
        };

        const result = createTransactionSchema.safeParse(data);

        expect(result.success).toBe(false);
      });

      it('should reject tags with non-string values', () => {
        const data = {
          ...baseValidTransaction,
          tags: [123, true, {}] as any,
        };

        const result = createTransactionSchema.safeParse(data);

        expect(result.success).toBe(false);
      });
    });

    describe('edge cases', () => {
      it('should reject completely empty object', () => {
        const result = createTransactionSchema.safeParse({});

        expect(result.success).toBe(false);
      });

      it('should reject null', () => {
        const result = createTransactionSchema.safeParse(null);

        expect(result.success).toBe(false);
      });

      it('should reject undefined', () => {
        const result = createTransactionSchema.safeParse(undefined);

        expect(result.success).toBe(false);
      });

      it('should handle large transaction amounts correctly', () => {
        const data = {
          ...baseValidTransaction,
          amount: 999999999.99,
        };

        const result = createTransactionSchema.safeParse(data);

        expect(result.success).toBe(true);
      });
    });
  });

  // ==================== UPDATE TRANSACTION SCHEMA ====================
  describe('updateTransactionSchema', () => {
    describe('partial updates', () => {
      it('should validate updating only description', () => {
        const data = {
          description: 'Updated description',
        };

        const result = updateTransactionSchema.safeParse(data);

        expect(result.success).toBe(true);
      });

      it('should validate updating only amount', () => {
        const data = {
          amount: 250.75,
        };

        const result = updateTransactionSchema.safeParse(data);

        expect(result.success).toBe(true);
      });

      it('should validate updating only date', () => {
        const data = {
          date: new Date('2024-02-01'),
        };

        const result = updateTransactionSchema.safeParse(data);

        expect(result.success).toBe(true);
      });

      it('should validate updating only type', () => {
        const data = {
          type: LaunchType.EXPENSE,
        };

        const result = updateTransactionSchema.safeParse(data);

        expect(result.success).toBe(true);
      });

      it('should validate updating multiple fields', () => {
        const data = {
          description: 'Updated',
          amount: 300,
          isPaid: false,
        };

        const result = updateTransactionSchema.safeParse(data);

        expect(result.success).toBe(true);
      });

      it('should validate empty update object', () => {
        const result = updateTransactionSchema.safeParse({});

        expect(result.success).toBe(true);
      });

      it('should still validate constraints on provided fields', () => {
        const data = {
          amount: -50, // invalid
        };

        const result = updateTransactionSchema.safeParse(data);

        expect(result.success).toBe(false);
      });

      it('should validate updating categoryId to null', () => {
        const data = {
          categoryId: null,
        };

        const result = updateTransactionSchema.safeParse(data);

        expect(result.success).toBe(true);
      });

      it('should validate updating tags', () => {
        const data = {
          tags: ['updated', 'tags'],
        };

        const result = updateTransactionSchema.safeParse(data);

        expect(result.success).toBe(true);
      });

      it('should validate updating notes', () => {
        const data = {
          notes: 'Updated notes',
        };

        const result = updateTransactionSchema.safeParse(data);

        expect(result.success).toBe(true);
      });
    });
  });
});
