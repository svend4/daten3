import React from 'react';
import { InputProps } from '@types/component.types';

export const Input: React.FC<InputProps> = ({
  type = 'text',
  value,
  onChange,
  placeholder,
  disabled = false,
  error,
  label,
  required = false,
  icon,
  className = '',
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e.target.value);
  };

  const inputClasses = `
    w-full px-4 py-3 
    bg-white border-2 rounded-xl
    text-gray-900 placeholder-gray-400
    transition-all duration-200
    focus:outline-none focus:ring-4
    ${error 
      ? 'border-error-500 focus:border-error-600 focus:ring-error-500/20' 
      : 'border-gray-200 focus:border-primary-500 focus:ring-primary-500/20'
    }
    ${disabled ? 'bg-gray-50 cursor-not-allowed opacity-50' : ''}
    ${icon ? 'pl-12' : ''}
    ${className}
  `.trim();

  return (
    <div className="relative">
      {label && (
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          {label}
          {required && <span className="text-error-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
        
        <input
          type={type}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={inputClasses}
        />
      </div>

      {error && (
        <p className="mt-2 text-sm text-error-500 animate-slide-down">
          {error}
        </p>
      )}
    </div>
  );
};

export default Input;
