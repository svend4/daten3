import React from 'react';
import { BadgeProps } from '@types/component.types';

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
}) => {
  const variantStyles = {
    primary: 'bg-primary-100 text-primary-700 border border-primary-200',
    secondary: 'bg-secondary-100 text-secondary-700 border border-secondary-200',
    success: 'bg-success-50 text-success-700 border border-success-200',
    warning: 'bg-warning-50 text-warning-700 border border-warning-200',
    error: 'bg-error-50 text-error-700 border border-error-200',
  };

  const sizeStyles = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
  };

  const badgeClasses = `
    inline-flex items-center justify-center
    font-semibold rounded-lg
    ${variantStyles[variant]}
    ${sizeStyles[size]}
    ${className}
  `.trim();

  return (
    <span className={badgeClasses}>
      {children}
    </span>
  );
};

export default Badge;
