import React, { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { ButtonProps } from '../../types/component.types';

/**
 * Accessible Button component with animations and loading state.
 * Uses React.memo for performance optimization.
 */
export const Button: React.FC<ButtonProps> = memo(
  ({
    children,
    variant = 'primary',
    size = 'md',
    disabled = false,
    loading = false,
    fullWidth = false,
    onClick,
    type = 'button',
    icon,
    className = '',
  }) => {
    // Memoize variant styles
    const variantStyles = useMemo(
      () => ({
        primary:
          'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 shadow-md hover:shadow-lg',
        secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 active:bg-gray-400',
        ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 active:bg-gray-200',
        outline:
          'bg-transparent border-2 border-primary-600 text-primary-600 hover:bg-primary-50 active:bg-primary-100',
      }),
      []
    );

    // Memoize size styles
    const sizeStyles = useMemo(
      () => ({
        sm: 'px-4 py-2 text-sm rounded-lg',
        md: 'px-6 py-3 text-base rounded-xl',
        lg: 'px-8 py-4 text-lg rounded-xl',
      }),
      []
    );

    // Memoize button classes
    const buttonClasses = useMemo(() => {
      const isDisabled = disabled || loading;
      const disabledStyles = isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer';
      const widthStyle = fullWidth ? 'w-full' : '';

      return `
        inline-flex items-center justify-center gap-2
        font-semibold transition-all duration-200
        focus:outline-none focus:ring-4 focus:ring-primary-500/20
        focus-visible:ring-4 focus-visible:ring-primary-500/40
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${disabledStyles}
        ${widthStyle}
        ${className}
      `.trim();
    }, [variant, size, disabled, loading, fullWidth, className, variantStyles, sizeStyles]);

    const isDisabled = disabled || loading;

    return (
      <motion.button
        type={type}
        className={buttonClasses}
        onClick={onClick}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        aria-busy={loading}
        whileTap={{ scale: isDisabled ? 1 : 0.98 }}
        whileHover={{ scale: isDisabled ? 1 : 1.02 }}
      >
        {loading && (
          <Loader2
            className="w-5 h-5 animate-spin"
            aria-hidden="true"
          />
        )}
        {!loading && icon && (
          <span aria-hidden="true">{icon}</span>
        )}
        {loading ? (
          <>
            <span className="sr-only">Загрузка...</span>
            {children}
          </>
        ) : (
          children
        )}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
