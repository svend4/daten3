import React from 'react';
import { Loader2 } from 'lucide-react';
import { LoadingProps } from '../../types/component.types';

export const Loading: React.FC<LoadingProps> = ({
  size = 'md',
  text,
  fullScreen = false,
}) => {
  const sizeStyles = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  const content = (
    <div className="flex flex-col items-center justify-center gap-4">
      <Loader2 
        className={`${sizeStyles[size]} text-primary-600 animate-spin`}
      />
      {text && (
        <p className="text-gray-600 font-medium">
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
};

// Skeleton Loading Component
export const Skeleton: React.FC<{
  width?: string | number;
  height?: string | number;
  circle?: boolean;
  className?: string;
}> = ({ width = '100%', height = '1rem', circle = false, className = '' }) => {
  return (
    <div
      className={`
        animate-pulse bg-gray-200 
        ${circle ? 'rounded-full' : 'rounded-lg'}
        ${className}
      `}
      style={{ width, height }}
    />
  );
};

export default Loading;
