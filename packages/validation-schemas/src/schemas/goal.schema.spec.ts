import { ERROR_MESSAGES } from '@fayol/shared-constants';
import {
  createGoalSchema,
  updateGoalSchema,
  CreateGoalInput,
  UpdateGoalInput,
} from './goal.schema';

describe('goal.schema', () => {
  const baseValidGoal = {
    title: 'Comprar um carro',
    currentAmount: 10000,
    targetAmount: 50000,
    deadline: new Date('2025-12-31'),
    color: '#FF5733',
  };

  describe('createGoalSchema', () => {
    describe('valid data', () => {
      it('should validate goal with all fields', () => {
        const result = createGoalSchema.safeParse(baseValidGoal);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.title).toBe('Comprar um carro');
          expect(result.data.currentAmount).toBe(10000);
          expect(result.data.targetAmount).toBe(50000);
          expect(result.data.deadline).toBeInstanceOf(Date);
          expect(result.data.color).toBe('#FF5733');
        }
      });

      it('should validate goal without optional fields', () => {
        const data = {
          title: 'Viagem',
          currentAmount: 0,
          targetAmount: 5000,
        };
        const result = createGoalSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.deadline).toBeUndefined();
          expect(result.data.color).toBeUndefined();
        }
      });

      it('should validate goal with minimum currentAmount (0)', () => {
        const data = {
          ...baseValidGoal,
          currentAmount: 0,
        };
        const result = createGoalSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should validate goal with minimum targetAmount (1)', () => {
        const data = {
          ...baseValidGoal,
          targetAmount: 1,
        };
        const result = createGoalSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should validate goal with large amounts', () => {
        const data = {
          ...baseValidGoal,
          currentAmount: 999999999,
          targetAmount: 999999999.99,
        };
        const result = createGoalSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should coerce string deadline to Date', () => {
        const data = {
          title: 'Meta',
          currentAmount: 0,
          targetAmount: 1000,
          deadline: '2025-12-31' as any,
        };
        const result = createGoalSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.deadline).toBeInstanceOf(Date);
        }
      });
    });

    describe('title validation', () => {
      it('should reject empty title', () => {
        const data = {
          ...baseValidGoal,
          title: '',
        };
        const result = createGoalSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain('title');
          expect(result.error.issues[0].message).toBe(ERROR_MESSAGES.REQUIRED_FIELD);
        }
      });

      it('should reject title with more than 50 characters', () => {
        const data = {
          ...baseValidGoal,
          title: 'a'.repeat(51),
        };
        const result = createGoalSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain('title');
        }
      });

      it('should accept title with exactly 1 character (boundary)', () => {
        const data = {
          ...baseValidGoal,
          title: 'a',
        };
        const result = createGoalSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should accept title with exactly 50 characters (boundary)', () => {
        const data = {
          ...baseValidGoal,
          title: 'a'.repeat(50),
        };
        const result = createGoalSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should reject missing title', () => {
        const data = {
          currentAmount: 0,
          targetAmount: 1000,
        };
        const result = createGoalSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          const titleIssue = result.error.issues.find((issue) => issue.path.includes('title'));
          expect(titleIssue).toBeDefined();
        }
      });

      it('should accept title with special characters', () => {
        const data = {
          ...baseValidGoal,
          title: 'Casa própria - Apê 2024 (100m²)',
        };
        const result = createGoalSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should accept title with unicode characters', () => {
        const data = {
          ...baseValidGoal,
          title: 'Viagem ao Japão 日本',
        };
        const result = createGoalSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    describe('currentAmount preprocessing and validation', () => {
      it('should convert empty string to 0', () => {
        const data = {
          title: 'Meta',
          currentAmount: '' as any,
          targetAmount: 1000,
        };
        const result = createGoalSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.currentAmount).toBe(0);
        }
      });

      it('should convert undefined to 0', () => {
        const data = {
          title: 'Meta',
          currentAmount: undefined as any,
          targetAmount: 1000,
        };
        const result = createGoalSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.currentAmount).toBe(0);
        }
      });

      it('should accept currentAmount of 0', () => {
        const data = {
          ...baseValidGoal,
          currentAmount: 0,
        };
        const result = createGoalSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should reject negative currentAmount', () => {
        const data = {
          ...baseValidGoal,
          currentAmount: -100,
        };
        const result = createGoalSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain('currentAmount');
        }
      });

      it('should accept decimal currentAmount', () => {
        const data = {
          ...baseValidGoal,
          currentAmount: 1234.56,
        };
        const result = createGoalSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should convert string number to number', () => {
        const data = {
          title: 'Meta',
          currentAmount: '500' as any,
          targetAmount: 1000,
        };
        const result = createGoalSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.currentAmount).toBe(500);
          expect(typeof result.data.currentAmount).toBe('number');
        }
      });

      it('should reject non-numeric currentAmount after preprocessing', () => {
        const data = {
          title: 'Meta',
          currentAmount: 'abc' as any,
          targetAmount: 1000,
        };
        const result = createGoalSchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });

    describe('targetAmount preprocessing and validation', () => {
      it('should accept valid targetAmount', () => {
        const data = {
          ...baseValidGoal,
          targetAmount: 10000,
        };
        const result = createGoalSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should reject targetAmount of 0', () => {
        const data = {
          ...baseValidGoal,
          targetAmount: 0,
        };
        const result = createGoalSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain('targetAmount');
          expect(result.error.issues[0].message).toContain('maior que zero');
        }
      });

      it('should reject negative targetAmount', () => {
        const data = {
          ...baseValidGoal,
          targetAmount: -1000,
        };
        const result = createGoalSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should accept decimal targetAmount', () => {
        const data = {
          ...baseValidGoal,
          targetAmount: 9999.99,
        };
        const result = createGoalSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should reject missing targetAmount', () => {
        const data = {
          title: 'Meta',
          currentAmount: 0,
        };
        const result = createGoalSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          const targetIssue = result.error.issues.find((issue) =>
            issue.path.includes('targetAmount')
          );
          expect(targetIssue).toBeDefined();
        }
      });

      it('should convert string number to number', () => {
        const data = {
          title: 'Meta',
          currentAmount: 0,
          targetAmount: '5000' as any,
        };
        const result = createGoalSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.targetAmount).toBe(5000);
          expect(typeof result.data.targetAmount).toBe('number');
        }
      });

      it('should reject non-numeric targetAmount after preprocessing', () => {
        const data = {
          title: 'Meta',
          currentAmount: 0,
          targetAmount: 'invalid' as any,
        };
        const result = createGoalSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should handle empty string targetAmount', () => {
        const data = {
          title: 'Meta',
          currentAmount: 0,
          targetAmount: '' as any,
        };
        const result = createGoalSchema.safeParse(data);
        // Empty string preprocessed to undefined, which fails required validation
        expect(result.success).toBe(false);
      });
    });

    describe('deadline validation', () => {
      it('should accept valid deadline', () => {
        const data = {
          ...baseValidGoal,
          deadline: new Date('2025-12-31'),
        };
        const result = createGoalSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should accept undefined deadline (optional)', () => {
        const data = {
          title: 'Meta',
          currentAmount: 0,
          targetAmount: 1000,
          deadline: undefined,
        };
        const result = createGoalSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should work without deadline', () => {
        const data = {
          title: 'Meta',
          currentAmount: 0,
          targetAmount: 1000,
        };
        const result = createGoalSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.deadline).toBeUndefined();
        }
      });

      it('should coerce ISO string to Date', () => {
        const data = {
          title: 'Meta',
          currentAmount: 0,
          targetAmount: 1000,
          deadline: '2025-06-30T00:00:00.000Z' as any,
        };
        const result = createGoalSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.deadline).toBeInstanceOf(Date);
        }
      });

      it('should reject invalid deadline', () => {
        const data = {
          ...baseValidGoal,
          deadline: 'invalid-date' as any,
        };
        const result = createGoalSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain('deadline');
        }
      });

      it('should accept past deadline (no validation)', () => {
        const data = {
          ...baseValidGoal,
          deadline: new Date('2020-01-01'),
        };
        const result = createGoalSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    describe('color validation', () => {
      it('should accept color in hex format', () => {
        const data = {
          ...baseValidGoal,
          color: '#00FF00',
        };
        const result = createGoalSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should accept color as named color', () => {
        const data = {
          ...baseValidGoal,
          color: 'blue',
        };
        const result = createGoalSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should accept undefined color (optional)', () => {
        const data = {
          title: 'Meta',
          currentAmount: 0,
          targetAmount: 1000,
          color: undefined,
        };
        const result = createGoalSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should work without color', () => {
        const data = {
          title: 'Meta',
          currentAmount: 0,
          targetAmount: 1000,
        };
        const result = createGoalSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.color).toBeUndefined();
        }
      });
    });

    describe('edge cases and security', () => {
      it('should handle SQL injection attempt in title', () => {
        const data = {
          ...baseValidGoal,
          title: "'; DROP TABLE goals; --",
        };
        const result = createGoalSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should handle XSS attempt in title', () => {
        const data = {
          ...baseValidGoal,
          title: '<script>alert("XSS")</script>',
        };
        const result = createGoalSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should reject object as title', () => {
        const data = {
          ...baseValidGoal,
          title: { nested: 'value' } as any,
        };
        const result = createGoalSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should reject array as title', () => {
        const data = {
          ...baseValidGoal,
          title: ['array'] as any,
        };
        const result = createGoalSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should convert null to 0 for currentAmount (Number coercion)', () => {
        const data = {
          title: 'Meta',
          currentAmount: null as any,
          targetAmount: 1000,
        };
        const result = createGoalSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.currentAmount).toBe(0);
        }
      });

      it('should reject null as targetAmount', () => {
        const data = {
          title: 'Meta',
          currentAmount: 0,
          targetAmount: null as any,
        };
        const result = createGoalSchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('updateGoalSchema', () => {
    it('should allow partial updates (only title)', () => {
      const data = {
        title: 'Novo Título',
      };
      const result = updateGoalSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('Novo Título');
        expect(result.data.currentAmount).toBeUndefined();
      }
    });

    it('should allow partial updates (only currentAmount)', () => {
      const data = {
        currentAmount: 15000,
      };
      const result = updateGoalSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.currentAmount).toBe(15000);
      }
    });

    it('should allow partial updates (only targetAmount)', () => {
      const data = {
        targetAmount: 60000,
      };
      const result = updateGoalSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should allow empty object (no updates)', () => {
      const data = {};
      const result = updateGoalSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should allow updating multiple fields', () => {
      const data = {
        title: 'Meta Atualizada',
        currentAmount: 20000,
        targetAmount: 80000,
        color: '#00FF00',
      };
      const result = updateGoalSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should still validate title if provided', () => {
      const data = {
        title: '', // empty
      };
      const result = updateGoalSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should still validate currentAmount if provided', () => {
      const data = {
        currentAmount: -100, // negative
      };
      const result = updateGoalSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should still validate targetAmount if provided', () => {
      const data = {
        targetAmount: 0, // must be > 0
      };
      const result = updateGoalSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should still validate deadline if provided', () => {
      const data = {
        deadline: 'invalid-date' as any,
      };
      const result = updateGoalSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });
});
