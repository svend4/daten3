import { memo, useId, ReactNode, ChangeEvent, forwardRef } from 'react';

export interface InputProps {
  /** Input label text */
  label?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Current value */
  value: string;
  /** Change handler - receives new value */
  onChange: (value: string) => void;
  /** Native change handler - receives full event (optional) */
  onChangeEvent?: (e: ChangeEvent<HTMLInputElement>) => void;
  /** Input type */
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search';
  /** Error message */
  error?: string;
  /** Helper text shown below input */
  helperText?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Required field */
  required?: boolean;
  /** Icon shown on the left */
  icon?: ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Input name attribute */
  name?: string;
  /** Autocomplete attribute */
  autoComplete?: string;
  /** Min length for validation */
  minLength?: number;
  /** Max length for validation */
  maxLength?: number;
  /** Pattern for validation */
  pattern?: string;
  /** onBlur handler */
  onBlur?: () => void;
  /** onFocus handler */
  onFocus?: () => void;
}

/**
 * Accessible Input component with proper label association and ARIA attributes.
 * Uses React.memo for performance optimization.
 */
const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      placeholder,
      value,
      onChange,
      onChangeEvent,
      type = 'text',
      error,
      helperText,
      disabled = false,
      required = false,
      icon,
      className = '',
      name,
      autoComplete,
      minLength,
      maxLength,
      pattern,
      onBlur,
      onFocus,
    },
    ref
  ) => {
    // Generate unique IDs for accessibility
    const generatedId = useId();
    const inputId = name ? `input-${name}` : generatedId;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
      if (onChangeEvent) {
        onChangeEvent(e);
      }
      onChange(e.target.value);
    };

    // Determine aria-describedby based on error and helper text
    const describedBy = [
      error ? errorId : null,
      helperText && !error ? helperId : null,
    ]
      .filter(Boolean)
      .join(' ') || undefined;

    return (
      <div className={`flex flex-col gap-1.5 ${className}`}>
        {/* Label with proper htmlFor */}
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-semibold text-gray-700"
          >
            {label}
            {required && (
              <span className="text-red-500 ml-1" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}

        {/* Input wrapper */}
        <div className="relative">
          {/* Icon */}
          {icon && (
            <div
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
              aria-hidden="true"
            >
              {icon}
            </div>
          )}

          {/* Input element */}
          <input
            ref={ref}
            id={inputId}
            name={name}
            type={type}
            value={value}
            onChange={handleChange}
            onBlur={onBlur}
            onFocus={onFocus}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            autoComplete={autoComplete}
            minLength={minLength}
            maxLength={maxLength}
            pattern={pattern}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={describedBy}
            aria-required={required}
            className={`
              w-full px-4 py-3
              ${icon ? 'pl-10' : ''}
              border rounded-xl
              ${error ? 'border-red-500 focus:ring-red-500/20' : 'border-gray-300 focus:ring-primary-500/20'}
              ${disabled ? 'bg-gray-100 cursor-not-allowed text-gray-500' : 'bg-white text-gray-900'}
              focus:outline-none focus:ring-2 focus:border-transparent
              transition-all duration-200
              placeholder:text-gray-400
            `}
          />
        </div>

        {/* Error message */}
        {error && (
          <p
            id={errorId}
            className="text-sm text-red-500 flex items-center gap-1"
            role="alert"
            aria-live="polite"
          >
            <svg
              className="w-4 h-4 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </p>
        )}

        {/* Helper text (only shown when no error) */}
        {helperText && !error && (
          <p id={helperId} className="text-sm text-gray-500">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default memo(Input);
