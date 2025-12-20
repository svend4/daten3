import React from 'react';
import { motion } from 'framer-motion';
import { CardProps } from '../../types/component.types';

export const Card: React.FC<CardProps> = ({
  children,
  hover = false,
  padding = 'md',
  onClick,
  className = '',
}) => {
  const paddingStyles = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const hoverStyles = hover
    ? 'hover:shadow-strong hover:-translate-y-1 cursor-pointer'
    : '';

  const cardClasses = `
    bg-white rounded-2xl shadow-soft
    transition-all duration-300
    ${paddingStyles[padding]}
    ${hoverStyles}
    ${className}
  `.trim();

  const CardWrapper = hover ? motion.div : 'div';

  return (
    <CardWrapper
      className={cardClasses}
      onClick={onClick}
      {...(hover && {
        whileHover: { y: -4 },
        transition: { duration: 0.2 }
      })}
    >
      {children}
    </CardWrapper>
  );
};

export default Card;
