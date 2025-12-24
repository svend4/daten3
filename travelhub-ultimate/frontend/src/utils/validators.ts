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

/**
 * Payment card schema
 */
export const paymentCardSchema = z.object({
  cardNumber: z
    .string()
    .min(1, 'Номер карты обязателен')
    .regex(/^[\d\s]{16,19}$/, 'Некорректный номер карты'),
  cardName: z
    .string()
    .min(2, 'Введите имя владельца карты')
    .regex(/^[a-zA-Z\s]+$/, 'Имя должно содержать только латинские буквы'),
  expiry: z
    .string()
    .min(1, 'Срок действия обязателен')
    .regex(/^(0[1-9]|1[0-2])\/\d{2}$/, 'Формат: MM/YY'),
  cvv: z
    .string()
    .min(3, 'CVV должен содержать 3-4 цифры')
    .max(4, 'CVV должен содержать 3-4 цифры')
    .regex(/^\d{3,4}$/, 'CVV должен содержать только цифры'),
});

/**
 * Booking dates schema
 */
export const bookingDatesSchema = z.object({
  checkIn: z.string().min(1, 'Выберите дату заезда'),
  checkOut: z.string().min(1, 'Выберите дату выезда'),
  guests: z.number().min(1, 'Минимум 1 гость').max(10, 'Максимум 10 гостей'),
}).refine((data) => {
  if (data.checkIn && data.checkOut) {
    return new Date(data.checkOut) > new Date(data.checkIn);
  }
  return true;
}, {
  message: 'Дата выезда должна быть позже даты заезда',
  path: ['checkOut'],
});

/**
 * Price alert schema
 */
export const priceAlertSchema = z.object({
  type: z.enum(['HOTEL', 'FLIGHT'], { errorMap: () => ({ message: 'Выберите тип оповещения' }) }),
  destination: z.string().min(2, 'Введите направление'),
  targetPrice: z.number().min(1, 'Цена должна быть больше 0'),
  currency: z.string().min(1, 'Выберите валюту'),
  checkIn: z.string().optional(),
  checkOut: z.string().optional(),
  departDate: z.string().optional(),
  returnDate: z.string().optional(),
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
export type PaymentCardFormData = z.infer<typeof paymentCardSchema>;
export type BookingDatesFormData = z.infer<typeof bookingDatesSchema>;
export type PriceAlertFormData = z.infer<typeof priceAlertSchema>;

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
