import { z } from 'zod';

// =============================================================================
// Zod Schemas for Form Validation
// =============================================================================

/**
 * Email validation schema
 */
export const emailSchema = z
  .string()
  .min(1, 'Email обязателен')
  .email('Введите корректный email');

/**
 * Password validation schema with security requirements
 */
export const passwordSchema = z
  .string()
  .min(8, 'Пароль должен содержать минимум 8 символов')
  .regex(/[A-Z]/, 'Пароль должен содержать хотя бы одну заглавную букву')
  .regex(/[a-z]/, 'Пароль должен содержать хотя бы одну строчную букву')
  .regex(/\d/, 'Пароль должен содержать хотя бы одну цифру');

/**
 * Simple password schema (for login - no strict requirements)
 */
export const loginPasswordSchema = z
  .string()
  .min(1, 'Пароль обязателен');

/**
 * Name validation schema
 */
export const nameSchema = z
  .string()
  .min(2, 'Минимум 2 символа')
  .max(50, 'Максимум 50 символов')
  .regex(/^[a-zA-Zа-яА-ЯёЁ\s-]+$/, 'Имя может содержать только буквы, пробелы и дефисы');

/**
 * Phone validation schema
 */
export const phoneSchema = z
  .string()
  .regex(/^[\d\s\-\+\(\)]+$/, 'Некорректный формат телефона')
  .refine(
    (val) => val.replace(/\D/g, '').length >= 10,
    'Телефон должен содержать минимум 10 цифр'
  );

/**
 * Login form schema
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: loginPasswordSchema,
});

/**
 * Registration form schema
 */
export const registerSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string().min(1, 'Подтвердите пароль'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Пароли не совпадают',
  path: ['confirmPassword'],
});

/**
 * Forgot password form schema
 */
export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

/**
 * Reset password form schema
 */
export const resetPasswordSchema = z.object({
  password: passwordSchema,
  confirmPassword: z.string().min(1, 'Подтвердите пароль'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Пароли не совпадают',
  path: ['confirmPassword'],
});

/**
 * Profile update form schema
 */
export const profileSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  email: emailSchema,
  phone: phoneSchema.optional().or(z.literal('')),
});

/**
 * Contact form schema
 */
export const contactSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  subject: z.string().min(5, 'Тема должна содержать минимум 5 символов'),
  message: z.string().min(20, 'Сообщение должно содержать минимум 20 символов'),
});

// =============================================================================
// Type Exports
// =============================================================================

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type ProfileFormData = z.infer<typeof profileSchema>;
export type ContactFormData = z.infer<typeof contactSchema>;

// =============================================================================
// Legacy Validator Functions (for backward compatibility)
// =============================================================================

export const validateEmail = (email: string): boolean => {
  const result = emailSchema.safeParse(email);
  return result.success;
};

export const validatePhone = (phone: string): boolean => {
  const result = phoneSchema.safeParse(phone);
  return result.success;
};

export const validatePassword = (password: string): { valid: boolean; errors: string[] } => {
  const result = passwordSchema.safeParse(password);
  if (result.success) {
    return { valid: true, errors: [] };
  }
  return {
    valid: false,
    errors: result.error.errors.map((e) => e.message),
  };
};

export const validateRequired = (value: string): boolean => {
  return value.trim().length > 0;
};

export const validateMinLength = (value: string, minLength: number): boolean => {
  return value.length >= minLength;
};

export const validateMaxLength = (value: string, maxLength: number): boolean => {
  return value.length <= maxLength;
};

// =============================================================================
// Validation Helper Functions
// =============================================================================

/**
 * Validates form data against a Zod schema and returns field errors
 */
export function validateForm<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: boolean; data?: T; errors?: Record<string, string> } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors: Record<string, string> = {};
  result.error.errors.forEach((error) => {
    const path = error.path.join('.');
    if (!errors[path]) {
      errors[path] = error.message;
    }
  });

  return { success: false, errors };
}

/**
 * Get first error message for a field from Zod validation result
 */
export function getFieldError(
  errors: z.ZodError | null,
  field: string
): string | undefined {
  if (!errors) return undefined;
  const fieldError = errors.errors.find((e) => e.path[0] === field);
  return fieldError?.message;
}
