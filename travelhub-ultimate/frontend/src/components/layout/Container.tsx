import React, { memo, ReactNode, HTMLAttributes } from 'react';

interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
}

const maxWidthClasses: Record<string, string> = {
  sm: 'max-w-screen-sm',
  md: 'max-w-screen-md',
  lg: 'max-w-screen-lg',
  xl: 'max-w-screen-xl',
  '2xl': 'max-w-screen-2xl',
  full: 'max-w-full',
};

/**
 * Container component for consistent page layout and maximum width constraints.
 * Provides centered content with responsive padding.
 */
const Container: React.FC<ContainerProps> = ({
  children,
  className = '',
  maxWidth = 'xl',
  ...rest
}) => {
  const maxWidthClass = maxWidthClasses[maxWidth] || maxWidthClasses.xl;

  return (
    <div
      className={`w-full mx-auto px-4 sm:px-6 lg:px-8 ${maxWidthClass} ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
};

export default memo(Container);
