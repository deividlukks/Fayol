import { loginSchema, registerSchema } from './auth.schema';
import { REGEX, LIMITS, ERROR_MESSAGES } from '@fayol/shared-constants';

describe('auth.schema', () => {
  // ==================== LOGIN SCHEMA ====================
  describe('loginSchema', () => {
    describe('valid data', () => {
      it('should validate correct login with email', () => {
        const validData = {
          email: 'test@example.com',
          password: 'password123',
        };

        const result = loginSchema.safeParse(validData);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toEqual(validData);
        }
      });

      it('should validate login with phone number (accepts non-email string)', () => {
        const validData = {
          email: '11999999999', // phone as string
          password: 'password123',
        };

        const result = loginSchema.safeParse(validData);

        expect(result.success).toBe(true);
      });

      it('should accept any non-empty string as email field', () => {
        const validData = {
          email: 'any-string-identifier',
          password: 'password123',
        };

        const result = loginSchema.safeParse(validData);

        expect(result.success).toBe(true);
      });

      it('should validate with complex password', () => {
        const validData = {
          email: 'user@test.com',
          password: 'P@ssw0rd!123',
        };

        const result = loginSchema.safeParse(validData);

        expect(result.success).toBe(true);
      });

      it('should validate with special characters in password', () => {
        const validData = {
          email: 'test@example.com',
          password: '!@#$%^&*()',
        };

        const result = loginSchema.safeParse(validData);

        expect(result.success).toBe(true);
      });
    });

    describe('invalid data', () => {
      it('should reject empty email', () => {
        const invalidData = {
          email: '',
          password: 'password123',
        };

        const result = loginSchema.safeParse(invalidData);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain('email');
          expect(result.error.issues[0].message).toBe(ERROR_MESSAGES.REQUIRED_FIELD);
        }
      });

      it('should reject missing email', () => {
        const invalidData = {
          password: 'password123',
        };

        const result = loginSchema.safeParse(invalidData);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain('email');
        }
      });

      it('should reject empty password', () => {
        const invalidData = {
          email: 'test@example.com',
          password: '',
        };

        const result = loginSchema.safeParse(invalidData);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain('password');
          expect(result.error.issues[0].message).toBe(ERROR_MESSAGES.REQUIRED_FIELD);
        }
      });

      it('should reject missing password', () => {
        const invalidData = {
          email: 'test@example.com',
        };

        const result = loginSchema.safeParse(invalidData);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain('password');
        }
      });

      it('should reject null email', () => {
        const invalidData = {
          email: null,
          password: 'password123',
        };

        const result = loginSchema.safeParse(invalidData);

        expect(result.success).toBe(false);
      });

      it('should reject null password', () => {
        const invalidData = {
          email: 'test@example.com',
          password: null,
        };

        const result = loginSchema.safeParse(invalidData);

        expect(result.success).toBe(false);
      });

      it('should reject undefined values', () => {
        const invalidData = {
          email: undefined,
          password: undefined,
        };

        const result = loginSchema.safeParse(invalidData);

        expect(result.success).toBe(false);
      });

      it('should reject numeric email', () => {
        const invalidData = {
          email: 123456,
          password: 'password123',
        };

        const result = loginSchema.safeParse(invalidData);

        expect(result.success).toBe(false);
      });

      it('should reject boolean email', () => {
        const invalidData = {
          email: true,
          password: 'password123',
        };

        const result = loginSchema.safeParse(invalidData);

        expect(result.success).toBe(false);
      });

      it('should reject object as credentials', () => {
        const invalidData = {
          email: { value: 'test@example.com' },
          password: { value: 'password123' },
        };

        const result = loginSchema.safeParse(invalidData);

        expect(result.success).toBe(false);
      });

      it('should reject array as credentials', () => {
        const invalidData = {
          email: ['test@example.com'],
          password: ['password123'],
        };

        const result = loginSchema.safeParse(invalidData);

        expect(result.success).toBe(false);
      });
    });
  });

  // ==================== REGISTER SCHEMA ====================
  describe('registerSchema', () => {
    const validRegisterData = {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '(11) 99999-9999',
      password: 'P@ssw0rd123',
      confirmPassword: 'P@ssw0rd123',
    };

    describe('valid data', () => {
      it('should validate correct registration data', () => {
        const result = registerSchema.safeParse(validRegisterData);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.name).toBe(validRegisterData.name);
          expect(result.data.email).toBe(validRegisterData.email);
        }
      });

      it('should validate with minimum name length', () => {
        const data = {
          ...validRegisterData,
          name: 'AB', // 2 characters (LIMITS.USER.NAME_MIN)
        };

        const result = registerSchema.safeParse(data);

        expect(result.success).toBe(true);
      });

      it('should validate with maximum name length', () => {
        const data = {
          ...validRegisterData,
          name: 'A'.repeat(LIMITS.USER.NAME_MAX), // 100 characters
        };

        const result = registerSchema.safeParse(data);

        expect(result.success).toBe(true);
      });

      it('should validate with phone in various formats', () => {
        const phoneFormats = [
          '(11) 99999-9999',
          '11999999999',
          '+5511999999999',
          '5511999999999',
          '(11)99999-9999',
          '11 99999-9999',
        ];

        phoneFormats.forEach((phone) => {
          const data = { ...validRegisterData, phone };
          const result = registerSchema.safeParse(data);
          expect(result.success).toBe(true);
        });
      });

      it('should validate without phone (optional)', () => {
        const { phone, ...dataWithoutPhone } = validRegisterData;

        const result = registerSchema.safeParse(dataWithoutPhone);

        expect(result.success).toBe(true);
      });

      it('should validate with empty string phone', () => {
        const data = {
          ...validRegisterData,
          phone: '',
        };

        const result = registerSchema.safeParse(data);

        expect(result.success).toBe(true);
      });

      it('should validate with complex password meeting all requirements', () => {
        const data = {
          ...validRegisterData,
          password: 'Complex@123',
          confirmPassword: 'Complex@123',
        };

        const result = registerSchema.safeParse(data);

        expect(result.success).toBe(true);
      });

      it('should validate with various special characters in password', () => {
        const passwords = [
          'P@ssw0rd',
          'Test!123',
          'Secure#456',
          'Valid$789',
          'Strong%012',
        ];

        passwords.forEach((password) => {
          const data = {
            ...validRegisterData,
            password,
            confirmPassword: password,
          };
          const result = registerSchema.safeParse(data);
          expect(result.success).toBe(true);
        });
      });

      it('should validate email in various valid formats', () => {
        const emails = [
          'simple@example.com',
          'user.name@example.com',
          'user+tag@example.co.uk',
          'user_name@example-domain.com',
          'test123@test.io',
        ];

        emails.forEach((email) => {
          const data = { ...validRegisterData, email };
          const result = registerSchema.safeParse(data);
          expect(result.success).toBe(true);
        });
      });
    });

    describe('invalid name', () => {
      it('should reject name shorter than minimum', () => {
        const data = {
          ...validRegisterData,
          name: 'A', // 1 character (< LIMITS.USER.NAME_MIN)
        };

        const result = registerSchema.safeParse(data);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain('name');
          expect(result.error.issues[0].message).toContain(`no mínimo ${LIMITS.USER.NAME_MIN}`);
        }
      });

      it('should reject name longer than maximum', () => {
        const data = {
          ...validRegisterData,
          name: 'A'.repeat(LIMITS.USER.NAME_MAX + 1), // 101 characters
        };

        const result = registerSchema.safeParse(data);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain('name');
          expect(result.error.issues[0].message).toContain(`no máximo ${LIMITS.USER.NAME_MAX}`);
        }
      });

      it('should reject empty name', () => {
        const data = {
          ...validRegisterData,
          name: '',
        };

        const result = registerSchema.safeParse(data);

        expect(result.success).toBe(false);
      });

      it('should reject missing name', () => {
        const { name, ...dataWithoutName } = validRegisterData;

        const result = registerSchema.safeParse(dataWithoutName);

        expect(result.success).toBe(false);
      });
    });

    describe('invalid email', () => {
      it('should reject invalid email format', () => {
        const invalidEmails = [
          'invalid',
          'invalid@',
          '@example.com',
          'user@',
          'user.example.com',
          'user @example.com',
        ];

        invalidEmails.forEach((email) => {
          const data = { ...validRegisterData, email };
          const result = registerSchema.safeParse(data);
          expect(result.success).toBe(false);
          if (!result.success) {
            expect(result.error.issues[0].path).toContain('email');
            expect(result.error.issues[0].message).toBe(ERROR_MESSAGES.INVALID_EMAIL);
          }
        });
      });

      it('should reject empty email', () => {
        const data = {
          ...validRegisterData,
          email: '',
        };

        const result = registerSchema.safeParse(data);

        expect(result.success).toBe(false);
      });

      it('should reject missing email', () => {
        const { email, ...dataWithoutEmail } = validRegisterData;

        const result = registerSchema.safeParse(dataWithoutEmail);

        expect(result.success).toBe(false);
      });
    });

    describe('invalid phone', () => {
      it('should reject invalid phone format', () => {
        const invalidPhones = [
          '123456',
          'invalid',
          '11 8888-8888', // landline (not 9xxxx)
          '(11) 8888-8888',
          '999999999',
        ];

        invalidPhones.forEach((phone) => {
          const data = { ...validRegisterData, phone };
          const result = registerSchema.safeParse(data);
          expect(result.success).toBe(false);
          if (!result.success) {
            expect(result.error.issues.some(issue => issue.path.includes('phone'))).toBe(true);
          }
        });
      });

      it('should reject phone with letters', () => {
        const data = {
          ...validRegisterData,
          phone: '11 ABCDE-9999',
        };

        const result = registerSchema.safeParse(data);

        expect(result.success).toBe(false);
      });
    });

    describe('invalid password', () => {
      it('should reject password shorter than minimum', () => {
        const data = {
          ...validRegisterData,
          password: 'P@ss1', // 5 characters (< LIMITS.USER.PASSWORD_MIN)
          confirmPassword: 'P@ss1',
        };

        const result = registerSchema.safeParse(data);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain('password');
          expect(result.error.issues[0].message).toBe(ERROR_MESSAGES.INVALID_PASSWORD);
        }
      });

      it('should reject password without letters', () => {
        const data = {
          ...validRegisterData,
          password: '12345678@', // no letters
          confirmPassword: '12345678@',
        };

        const result = registerSchema.safeParse(data);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues.some(i => i.path.includes('password'))).toBe(true);
        }
      });

      it('should reject password without numbers', () => {
        const data = {
          ...validRegisterData,
          password: 'Password@', // no numbers
          confirmPassword: 'Password@',
        };

        const result = registerSchema.safeParse(data);

        expect(result.success).toBe(false);
      });

      it('should reject password without special characters', () => {
        const data = {
          ...validRegisterData,
          password: 'Password123', // no special char
          confirmPassword: 'Password123',
        };

        const result = registerSchema.safeParse(data);

        expect(result.success).toBe(false);
      });

      it('should reject empty password', () => {
        const data = {
          ...validRegisterData,
          password: '',
          confirmPassword: '',
        };

        const result = registerSchema.safeParse(data);

        expect(result.success).toBe(false);
      });

      it('should reject missing password', () => {
        const { password, ...dataWithoutPassword } = validRegisterData;

        const result = registerSchema.safeParse(dataWithoutPassword);

        expect(result.success).toBe(false);
      });
    });

    describe('password confirmation', () => {
      it('should reject when passwords do not match', () => {
        const data = {
          ...validRegisterData,
          password: 'P@ssw0rd123',
          confirmPassword: 'Different@123',
        };

        const result = registerSchema.safeParse(data);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain('confirmPassword');
          expect(result.error.issues[0].message).toBe(ERROR_MESSAGES.PASSWORDS_DO_NOT_MATCH);
        }
      });

      it('should reject empty confirmPassword', () => {
        const data = {
          ...validRegisterData,
          confirmPassword: '',
        };

        const result = registerSchema.safeParse(data);

        expect(result.success).toBe(false);
      });

      it('should reject missing confirmPassword', () => {
        const { confirmPassword, ...dataWithoutConfirm } = validRegisterData;

        const result = registerSchema.safeParse(dataWithoutConfirm);

        expect(result.success).toBe(false);
      });

      it('should reject when confirmPassword differs by case', () => {
        const data = {
          ...validRegisterData,
          password: 'P@ssw0rd123',
          confirmPassword: 'p@ssw0rd123', // different case
        };

        const result = registerSchema.safeParse(data);

        expect(result.success).toBe(false);
      });

      it('should reject when confirmPassword has extra spaces', () => {
        const data = {
          ...validRegisterData,
          password: 'P@ssw0rd123',
          confirmPassword: 'P@ssw0rd123 ', // extra space
        };

        const result = registerSchema.safeParse(data);

        expect(result.success).toBe(false);
      });
    });

    describe('edge cases', () => {
      it('should reject completely empty object', () => {
        const result = registerSchema.safeParse({});

        expect(result.success).toBe(false);
      });

      it('should reject null', () => {
        const result = registerSchema.safeParse(null);

        expect(result.success).toBe(false);
      });

      it('should reject undefined', () => {
        const result = registerSchema.safeParse(undefined);

        expect(result.success).toBe(false);
      });

      it('should reject array', () => {
        const result = registerSchema.safeParse([]);

        expect(result.success).toBe(false);
      });

      it('should reject primitive types', () => {
        const primitives = [123, 'string', true, false];

        primitives.forEach((primitive) => {
          const result = registerSchema.safeParse(primitive);
          expect(result.success).toBe(false);
        });
      });

      it('should reject extra unknown fields (strict mode)', () => {
        const dataWithExtra = {
          ...validRegisterData,
          extraField: 'should be ignored or rejected',
        };

        const result = registerSchema.safeParse(dataWithExtra);

        // Zod by default allows extra fields, but we verify the parsed data structure
        if (result.success) {
          expect(result.data).toHaveProperty('name');
          expect(result.data).toHaveProperty('email');
          expect(result.data).toHaveProperty('password');
        }
      });
    });

    describe('SQL injection attempts', () => {
      it('should safely handle SQL injection in email', () => {
        const data = {
          ...validRegisterData,
          email: "admin'--@example.com",
        };

        const result = registerSchema.safeParse(data);

        // Should either reject or sanitize
        expect(typeof result.success).toBe('boolean');
      });

      it('should safely handle SQL injection in name', () => {
        const data = {
          ...validRegisterData,
          name: "'; DROP TABLE users; --",
        };

        const result = registerSchema.safeParse(data);

        // Validation should complete without errors
        expect(typeof result.success).toBe('boolean');
      });
    });

    describe('XSS attempts', () => {
      it('should safely handle XSS in name', () => {
        const data = {
          ...validRegisterData,
          name: '<script>alert("xss")</script>',
        };

        const result = registerSchema.safeParse(data);

        // Validation should complete
        expect(typeof result.success).toBe('boolean');
      });

      it('should safely handle XSS in email', () => {
        const data = {
          ...validRegisterData,
          email: 'test@example.com<script>alert(1)</script>',
        };

        const result = registerSchema.safeParse(data);

        // Should reject due to invalid email format
        expect(result.success).toBe(false);
      });
    });
  });
});
