import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  className?: string;
  onClick?: () => void;
}

export default function Card({
  children,
  padding = 'md',
  hover = false,
  className = '',
  onClick
}: CardProps) {
  const paddingStyles = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const hoverStyle = hover ? 'hover:shadow-xl transition-shadow duration-300' : '';

  return (
    <div
      className={`bg-white rounded-xl shadow-md ${paddingStyles[padding]} ${hoverStyle} ${className} ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
