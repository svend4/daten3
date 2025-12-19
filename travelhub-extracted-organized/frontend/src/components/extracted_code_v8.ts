import React from 'react';
import { ContainerProps } from '@types/component.types';

const Container: React.FC<ContainerProps> = ({
  children,
  maxWidth = 'xl',
  padding = true,
  className = '',
}) => {
  const maxWidthStyles = {
    sm: 'max-w-2xl',
    md: 'max-w-4xl',
    lg: 'max-w-6xl',
    xl: 'max-w-7xl',
    '2xl': 'max-w-screen-2xl',
    full: 'max-w-full',
  };

  const paddingStyle = padding ? 'px-4 md:px-6 lg:px-8' : '';

  return (
    <div className={`${maxWidthStyles[maxWidth]} ${paddingStyle} mx-auto ${className}`}>
      {children}
    </div>
  );
};

export default Container;
