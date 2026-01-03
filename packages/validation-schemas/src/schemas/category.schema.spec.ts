import { LaunchType } from '@fayol/shared-types';
import { LIMITS, ERROR_MESSAGES } from '@fayol/shared-constants';
import {
  createCategorySchema,
  updateCategorySchema,
  CreateCategoryInput,
  UpdateCategoryInput,
} from './category.schema';

describe('category.schema', () => {
  const validUUID = '550e8400-e29b-41d4-a716-446655440000';

  describe('createCategorySchema', () => {
    describe('valid data', () => {
      it('should validate expense category', () => {
        const data = {
          name: 'Alimentação',
          type: LaunchType.EXPENSE,
          icon: '🍔',
          color: '#FF5733',
        };
        const result = createCategorySchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.name).toBe('Alimentação');
          expect(result.data.type).toBe(LaunchType.EXPENSE);
          expect(result.data.icon).toBe('🍔');
          expect(result.data.color).toBe('#FF5733');
        }
      });

      it('should validate income category', () => {
        const data = {
          name: 'Salário',
          type: LaunchType.INCOME,
        };
        const result = createCategorySchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.type).toBe(LaunchType.INCOME);
        }
      });

      it('should validate transfer category', () => {
        const data = {
          name: 'Transferências',
          type: LaunchType.TRANSFER,
        };
        const result = createCategorySchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should validate category without optional fields', () => {
        const data = {
          name: 'Transporte',
          type: LaunchType.EXPENSE,
        };
        const result = createCategorySchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.icon).toBeUndefined();
          expect(result.data.color).toBeUndefined();
          expect(result.data.parentId).toBeUndefined();
        }
      });

      it('should validate category with parentId (subcategory)', () => {
        const data = {
          name: 'Restaurantes',
          type: LaunchType.EXPENSE,
          parentId: validUUID,
        };
        const result = createCategorySchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.parentId).toBe(validUUID);
        }
      });

      it('should validate category with null parentId', () => {
        const data = {
          name: 'Categoria Principal',
          type: LaunchType.EXPENSE,
          parentId: null,
        };
        const result = createCategorySchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.parentId).toBeNull();
        }
      });

      it('should validate category with all fields', () => {
        const data = {
          name: 'Alimentação Fora',
          type: LaunchType.EXPENSE,
          icon: '🍕',
          color: '#00FF00',
          parentId: validUUID,
        };
        const result = createCategorySchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    describe('name validation', () => {
      it('should reject name with less than 3 characters', () => {
        const data = {
          name: 'ab', // 2 chars
          type: LaunchType.EXPENSE,
        };
        const result = createCategorySchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain('name');
          expect(result.error.issues[0].message).toContain(`${LIMITS.CATEGORY.NAME_MIN}`);
        }
      });

      it('should reject name with more than 50 characters', () => {
        const data = {
          name: 'a'.repeat(51),
          type: LaunchType.EXPENSE,
        };
        const result = createCategorySchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain('name');
          expect(result.error.issues[0].message).toContain(`${LIMITS.CATEGORY.NAME_MAX}`);
        }
      });

      it('should accept name with exactly 3 characters (boundary)', () => {
        const data = {
          name: 'ABC',
          type: LaunchType.EXPENSE,
        };
        const result = createCategorySchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should accept name with exactly 50 characters (boundary)', () => {
        const data = {
          name: 'a'.repeat(50),
          type: LaunchType.EXPENSE,
        };
        const result = createCategorySchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should reject empty name', () => {
        const data = {
          name: '',
          type: LaunchType.EXPENSE,
        };
        const result = createCategorySchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should reject missing name', () => {
        const data = {
          type: LaunchType.EXPENSE,
        };
        const result = createCategorySchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          const nameIssue = result.error.issues.find((issue) => issue.path.includes('name'));
          expect(nameIssue).toBeDefined();
        }
      });

      it('should accept name with special characters', () => {
        const data = {
          name: 'Saúde & Bem-estar (2024)',
          type: LaunchType.EXPENSE,
        };
        const result = createCategorySchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should accept name with unicode characters', () => {
        const data = {
          name: 'Educação 教育',
          type: LaunchType.EXPENSE,
        };
        const result = createCategorySchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    describe('type validation', () => {
      it('should accept EXPENSE type', () => {
        const data = {
          name: 'Categoria',
          type: LaunchType.EXPENSE,
        };
        const result = createCategorySchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should accept INCOME type', () => {
        const data = {
          name: 'Categoria',
          type: LaunchType.INCOME,
        };
        const result = createCategorySchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should accept TRANSFER type', () => {
        const data = {
          name: 'Categoria',
          type: LaunchType.TRANSFER,
        };
        const result = createCategorySchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should reject invalid type', () => {
        const data = {
          name: 'Categoria',
          type: 'INVALID_TYPE' as any,
        };
        const result = createCategorySchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain('type');
          expect(result.error.issues[0].message).toContain('inválido');
        }
      });

      it('should reject numeric type', () => {
        const data = {
          name: 'Categoria',
          type: 123 as any,
        };
        const result = createCategorySchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should reject null type', () => {
        const data = {
          name: 'Categoria',
          type: null as any,
        };
        const result = createCategorySchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should reject missing type', () => {
        const data = {
          name: 'Categoria',
        };
        const result = createCategorySchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          const typeIssue = result.error.issues.find((issue) => issue.path.includes('type'));
          expect(typeIssue).toBeDefined();
        }
      });
    });

    describe('optional fields', () => {
      it('should accept icon emoji', () => {
        const data = {
          name: 'Categoria',
          type: LaunchType.EXPENSE,
          icon: '💰',
        };
        const result = createCategorySchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should accept icon as text', () => {
        const data = {
          name: 'Categoria',
          type: LaunchType.EXPENSE,
          icon: 'shopping_cart',
        };
        const result = createCategorySchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should accept color in hex format', () => {
        const data = {
          name: 'Categoria',
          type: LaunchType.EXPENSE,
          color: '#FF5733',
        };
        const result = createCategorySchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should accept color as named color', () => {
        const data = {
          name: 'Categoria',
          type: LaunchType.EXPENSE,
          color: 'blue',
        };
        const result = createCategorySchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should work without icon', () => {
        const data = {
          name: 'Categoria',
          type: LaunchType.EXPENSE,
        };
        const result = createCategorySchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.icon).toBeUndefined();
        }
      });

      it('should work without color', () => {
        const data = {
          name: 'Categoria',
          type: LaunchType.EXPENSE,
        };
        const result = createCategorySchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.color).toBeUndefined();
        }
      });
    });

    describe('parentId validation', () => {
      it('should accept valid UUID parentId', () => {
        const data = {
          name: 'Subcategoria',
          type: LaunchType.EXPENSE,
          parentId: validUUID,
        };
        const result = createCategorySchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.parentId).toBe(validUUID);
        }
      });

      it('should accept null parentId', () => {
        const data = {
          name: 'Categoria',
          type: LaunchType.EXPENSE,
          parentId: null,
        };
        const result = createCategorySchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.parentId).toBeNull();
        }
      });

      it('should accept undefined parentId (optional)', () => {
        const data = {
          name: 'Categoria',
          type: LaunchType.EXPENSE,
          parentId: undefined,
        };
        const result = createCategorySchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should work without parentId', () => {
        const data = {
          name: 'Categoria',
          type: LaunchType.EXPENSE,
        };
        const result = createCategorySchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.parentId).toBeUndefined();
        }
      });

      it('should reject invalid UUID format', () => {
        const data = {
          name: 'Categoria',
          type: LaunchType.EXPENSE,
          parentId: 'not-a-uuid',
        };
        const result = createCategorySchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain('parentId');
        }
      });

      it('should reject empty string parentId', () => {
        const data = {
          name: 'Categoria',
          type: LaunchType.EXPENSE,
          parentId: '',
        };
        const result = createCategorySchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should reject numeric parentId', () => {
        const data = {
          name: 'Categoria',
          type: LaunchType.EXPENSE,
          parentId: 123 as any,
        };
        const result = createCategorySchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });

    describe('edge cases and security', () => {
      it('should handle SQL injection attempt in name', () => {
        const data = {
          name: "'; DROP TABLE categories; --",
          type: LaunchType.EXPENSE,
        };
        const result = createCategorySchema.safeParse(data);
        expect(result.success).toBe(true); // accepted as string
        if (result.success) {
          expect(result.data.name).toBe("'; DROP TABLE categories; --");
        }
      });

      it('should handle XSS attempt in name', () => {
        const data = {
          name: '<script>alert("XSS")</script>',
          type: LaunchType.EXPENSE,
        };
        const result = createCategorySchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should handle XSS attempt in icon', () => {
        const data = {
          name: 'Categoria',
          type: LaunchType.EXPENSE,
          icon: '<img src=x onerror=alert(1)>',
        };
        const result = createCategorySchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should reject object as name', () => {
        const data = {
          name: { nested: 'value' } as any,
          type: LaunchType.EXPENSE,
        };
        const result = createCategorySchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should reject array as name', () => {
        const data = {
          name: ['array', 'value'] as any,
          type: LaunchType.EXPENSE,
        };
        const result = createCategorySchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('updateCategorySchema', () => {
    it('should allow partial updates (only name)', () => {
      const data = {
        name: 'Novo Nome',
      };
      const result = updateCategorySchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Novo Nome');
        expect(result.data.type).toBeUndefined();
      }
    });

    it('should allow partial updates (only type)', () => {
      const data = {
        type: LaunchType.INCOME,
      };
      const result = updateCategorySchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe(LaunchType.INCOME);
      }
    });

    it('should allow partial updates (only icon)', () => {
      const data = {
        icon: '🎯',
      };
      const result = updateCategorySchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should allow empty object (no updates)', () => {
      const data = {};
      const result = updateCategorySchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should allow updating multiple fields', () => {
      const data = {
        name: 'Categoria Atualizada',
        icon: '✨',
        color: '#00FF00',
      };
      const result = updateCategorySchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should still validate name length if provided', () => {
      const data = {
        name: 'ab', // too short
      };
      const result = updateCategorySchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should still validate type enum if provided', () => {
      const data = {
        type: 'INVALID' as any,
      };
      const result = updateCategorySchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should still validate parentId UUID if provided', () => {
      const data = {
        parentId: 'not-a-uuid',
      };
      const result = updateCategorySchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should allow setting parentId to null', () => {
      const data = {
        parentId: null,
      };
      const result = updateCategorySchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });
});
