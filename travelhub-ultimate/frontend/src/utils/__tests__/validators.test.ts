import { describe, it, expect } from 'vitest';
import {
  emailSchema,
  passwordSchema,
  loginPasswordSchema,
  nameSchema,
  phoneSchema,
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  profileSchema,
  contactSchema,
  validateEmail,
  validatePhone,
  validatePassword,
  validateRequired,
  validateMinLength,
  validateMaxLength,
  validateForm,
  getFieldError,
} from '../validators';
import { z } from 'zod';

describe('Validators', () => {
  // =============================================================================
  // Email Schema Tests
  // =============================================================================
  describe('emailSchema', () => {
    it('should accept valid email', () => {
      expect(emailSchema.safeParse('test@example.com').success).toBe(true);
      expect(emailSchema.safeParse('user.name@domain.ru').success).toBe(true);
      expect(emailSchema.safeParse('a@b.co').success).toBe(true);
    });

    it('should reject empty email', () => {
      const result = emailSchema.safeParse('');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Email обязателен');
      }
    });

    it('should reject invalid email format', () => {
      const result = emailSchema.safeParse('invalid-email');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Введите корректный email');
      }
    });

    it('should reject email without domain', () => {
      expect(emailSchema.safeParse('test@').success).toBe(false);
    });
  });

  // =============================================================================
  // Password Schema Tests
  // =============================================================================
  describe('passwordSchema', () => {
    it('should accept valid password', () => {
      expect(passwordSchema.safeParse('Password1').success).toBe(true);
      expect(passwordSchema.safeParse('StrongPass123').success).toBe(true);
      expect(passwordSchema.safeParse('MyP@ssw0rd').success).toBe(true);
    });

    it('should reject short password', () => {
      const result = passwordSchema.safeParse('Pass1');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Пароль должен содержать минимум 8 символов');
      }
    });

    it('should reject password without uppercase', () => {
      const result = passwordSchema.safeParse('password1');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors.some(e => e.message.includes('заглавную'))).toBe(true);
      }
    });

    it('should reject password without lowercase', () => {
      const result = passwordSchema.safeParse('PASSWORD1');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors.some(e => e.message.includes('строчную'))).toBe(true);
      }
    });

    it('should reject password without digit', () => {
      const result = passwordSchema.safeParse('PasswordABC');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors.some(e => e.message.includes('цифру'))).toBe(true);
      }
    });
  });

  // =============================================================================
  // Login Password Schema Tests
  // =============================================================================
  describe('loginPasswordSchema', () => {
    it('should accept any non-empty password', () => {
      expect(loginPasswordSchema.safeParse('a').success).toBe(true);
      expect(loginPasswordSchema.safeParse('123').success).toBe(true);
    });

    it('should reject empty password', () => {
      const result = loginPasswordSchema.safeParse('');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Пароль обязателен');
      }
    });
  });

  // =============================================================================
  // Name Schema Tests
  // =============================================================================
  describe('nameSchema', () => {
    it('should accept valid names', () => {
      expect(nameSchema.safeParse('Иван').success).toBe(true);
      expect(nameSchema.safeParse('John').success).toBe(true);
      expect(nameSchema.safeParse('Анна-Мария').success).toBe(true);
      expect(nameSchema.safeParse('Jean Claude').success).toBe(true);
    });

    it('should reject too short name', () => {
      const result = nameSchema.safeParse('A');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Минимум 2 символа');
      }
    });

    it('should reject too long name', () => {
      const result = nameSchema.safeParse('A'.repeat(51));
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Максимум 50 символов');
      }
    });

    it('should reject name with numbers', () => {
      const result = nameSchema.safeParse('John123');
      expect(result.success).toBe(false);
    });

    it('should reject name with special characters', () => {
      expect(nameSchema.safeParse('John@Doe').success).toBe(false);
      expect(nameSchema.safeParse('John_Doe').success).toBe(false);
    });
  });

  // =============================================================================
  // Phone Schema Tests
  // =============================================================================
  describe('phoneSchema', () => {
    it('should accept valid phone numbers', () => {
      expect(phoneSchema.safeParse('+7 (999) 123-45-67').success).toBe(true);
      expect(phoneSchema.safeParse('89991234567').success).toBe(true);
      expect(phoneSchema.safeParse('+1-555-123-4567').success).toBe(true);
    });

    it('should reject phone with less than 10 digits', () => {
      const result = phoneSchema.safeParse('123456789');
      expect(result.success).toBe(false);
    });

    it('should reject phone with letters', () => {
      const result = phoneSchema.safeParse('phone123456');
      expect(result.success).toBe(false);
    });
  });

  // =============================================================================
  // Login Schema Tests
  // =============================================================================
  describe('loginSchema', () => {
    it('should accept valid login data', () => {
      const result = loginSchema.safeParse({
        email: 'test@example.com',
        password: 'anypassword',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const result = loginSchema.safeParse({
        email: 'invalid',
        password: 'anypassword',
      });
      expect(result.success).toBe(false);
    });

    it('should reject empty password', () => {
      const result = loginSchema.safeParse({
        email: 'test@example.com',
        password: '',
      });
      expect(result.success).toBe(false);
    });
  });

  // =============================================================================
  // Register Schema Tests
  // =============================================================================
  describe('registerSchema', () => {
    const validData = {
      firstName: 'Иван',
      lastName: 'Иванов',
      email: 'ivan@example.com',
      password: 'Password1',
      confirmPassword: 'Password1',
    };

    it('should accept valid registration data', () => {
      const result = registerSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject mismatched passwords', () => {
      const result = registerSchema.safeParse({
        ...validData,
        confirmPassword: 'DifferentPass1',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors.some(e => e.message === 'Пароли не совпадают')).toBe(true);
      }
    });

    it('should reject weak password', () => {
      const result = registerSchema.safeParse({
        ...validData,
        password: 'weak',
        confirmPassword: 'weak',
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid email', () => {
      const result = registerSchema.safeParse({
        ...validData,
        email: 'invalid',
      });
      expect(result.success).toBe(false);
    });
  });

  // =============================================================================
  // Forgot Password Schema Tests
  // =============================================================================
  describe('forgotPasswordSchema', () => {
    it('should accept valid email', () => {
      const result = forgotPasswordSchema.safeParse({ email: 'test@example.com' });
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const result = forgotPasswordSchema.safeParse({ email: 'invalid' });
      expect(result.success).toBe(false);
    });
  });

  // =============================================================================
  // Reset Password Schema Tests
  // =============================================================================
  describe('resetPasswordSchema', () => {
    it('should accept valid reset data', () => {
      const result = resetPasswordSchema.safeParse({
        password: 'NewPassword1',
        confirmPassword: 'NewPassword1',
      });
      expect(result.success).toBe(true);
    });

    it('should reject mismatched passwords', () => {
      const result = resetPasswordSchema.safeParse({
        password: 'NewPassword1',
        confirmPassword: 'Different1',
      });
      expect(result.success).toBe(false);
    });
  });

  // =============================================================================
  // Profile Schema Tests
  // =============================================================================
  describe('profileSchema', () => {
    it('should accept valid profile data', () => {
      const result = profileSchema.safeParse({
        firstName: 'Иван',
        lastName: 'Иванов',
        email: 'ivan@example.com',
        phone: '+7 999 123 45 67',
      });
      expect(result.success).toBe(true);
    });

    it('should accept profile without phone', () => {
      const result = profileSchema.safeParse({
        firstName: 'Иван',
        lastName: 'Иванов',
        email: 'ivan@example.com',
      });
      expect(result.success).toBe(true);
    });

    it('should accept empty phone string', () => {
      const result = profileSchema.safeParse({
        firstName: 'Иван',
        lastName: 'Иванов',
        email: 'ivan@example.com',
        phone: '',
      });
      expect(result.success).toBe(true);
    });
  });

  // =============================================================================
  // Contact Schema Tests
  // =============================================================================
  describe('contactSchema', () => {
    it('should accept valid contact data', () => {
      const result = contactSchema.safeParse({
        name: 'Иван',
        email: 'ivan@example.com',
        subject: 'Вопрос о бронировании',
        message: 'Здравствуйте! Хотел бы узнать подробнее о возможностях бронирования.',
      });
      expect(result.success).toBe(true);
    });

    it('should reject short subject', () => {
      const result = contactSchema.safeParse({
        name: 'Иван',
        email: 'ivan@example.com',
        subject: 'Hi',
        message: 'Здравствуйте! Хотел бы узнать подробнее о возможностях бронирования.',
      });
      expect(result.success).toBe(false);
    });

    it('should reject short message', () => {
      const result = contactSchema.safeParse({
        name: 'Иван',
        email: 'ivan@example.com',
        subject: 'Вопрос о бронировании',
        message: 'Короткое сообщение',
      });
      expect(result.success).toBe(false);
    });
  });

  // =============================================================================
  // Legacy Validator Function Tests
  // =============================================================================
  describe('validateEmail', () => {
    it('should return true for valid email', () => {
      expect(validateEmail('test@example.com')).toBe(true);
    });

    it('should return false for invalid email', () => {
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('')).toBe(false);
    });
  });

  describe('validatePhone', () => {
    it('should return true for valid phone', () => {
      expect(validatePhone('+7 999 123 45 67')).toBe(true);
    });

    it('should return false for invalid phone', () => {
      expect(validatePhone('123')).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('should return valid true for strong password', () => {
      const result = validatePassword('StrongPass1');
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should return errors for weak password', () => {
      const result = validatePassword('weak');
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('validateRequired', () => {
    it('should return true for non-empty string', () => {
      expect(validateRequired('test')).toBe(true);
      expect(validateRequired('  test  ')).toBe(true);
    });

    it('should return false for empty or whitespace string', () => {
      expect(validateRequired('')).toBe(false);
      expect(validateRequired('   ')).toBe(false);
    });
  });

  describe('validateMinLength', () => {
    it('should validate minimum length correctly', () => {
      expect(validateMinLength('test', 3)).toBe(true);
      expect(validateMinLength('test', 4)).toBe(true);
      expect(validateMinLength('test', 5)).toBe(false);
    });
  });

  describe('validateMaxLength', () => {
    it('should validate maximum length correctly', () => {
      expect(validateMaxLength('test', 5)).toBe(true);
      expect(validateMaxLength('test', 4)).toBe(true);
      expect(validateMaxLength('test', 3)).toBe(false);
    });
  });

  // =============================================================================
  // validateForm Helper Tests
  // =============================================================================
  describe('validateForm', () => {
    it('should return success for valid data', () => {
      const result = validateForm(loginSchema, {
        email: 'test@example.com',
        password: 'password',
      });
      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        email: 'test@example.com',
        password: 'password',
      });
    });

    it('should return errors for invalid data', () => {
      const result = validateForm(loginSchema, {
        email: 'invalid',
        password: '',
      });
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.email).toBeDefined();
      expect(result.errors?.password).toBeDefined();
    });
  });

  // =============================================================================
  // getFieldError Helper Tests
  // =============================================================================
  describe('getFieldError', () => {
    it('should return undefined for null errors', () => {
      expect(getFieldError(null, 'email')).toBeUndefined();
    });

    it('should return error message for field', () => {
      const result = loginSchema.safeParse({ email: 'invalid', password: '' });
      if (!result.success) {
        const error = getFieldError(result.error, 'email');
        expect(error).toBeDefined();
      }
    });

    it('should return undefined for non-existent field', () => {
      const result = loginSchema.safeParse({ email: 'invalid', password: 'pass' });
      if (!result.success) {
        const error = getFieldError(result.error, 'nonexistent');
        expect(error).toBeUndefined();
      }
    });
  });
});
