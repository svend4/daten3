import { ReactNode, forwardRef, memo, useMemo, KeyboardEvent } from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  className?: string;
  onClick?: () => void;
  /** Makes the card focusable and interactive via keyboard */
  interactive?: boolean;
}

const paddingStyles: Record<NonNullable<CardProps['padding']>, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

/**
 * A versatile card component with optional interactive behavior.
 * Supports keyboard navigation when interactive or has onClick handler.
 */
const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  {
    children,
    padding = 'md',
    hover = false,
    className = '',
    onClick,
    interactive,
    role,
    tabIndex,
    onKeyDown,
    ...rest
  },
  ref
) {
  const isInteractive = interactive ?? !!onClick;

  const computedClassName = useMemo(() => {
    const baseStyles = 'bg-white rounded-xl shadow-md';
    const paddingStyle = paddingStyles[padding];
    const hoverStyle = hover ? 'hover:shadow-xl transition-shadow duration-300' : '';
    const interactiveStyle = isInteractive
      ? 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2'
      : '';

    return [baseStyles, paddingStyle, hoverStyle, interactiveStyle, className]
      .filter(Boolean)
      .join(' ');
  }, [padding, hover, isInteractive, className]);

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    // Call provided onKeyDown if exists
    onKeyDown?.(e);

    // Handle Enter/Space for interactive cards
    if (onClick && !e.defaultPrevented && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      ref={ref}
      className={computedClassName}
      onClick={onClick}
      onKeyDown={isInteractive ? handleKeyDown : onKeyDown}
      role={role ?? (isInteractive ? 'button' : undefined)}
      tabIndex={tabIndex ?? (isInteractive ? 0 : undefined)}
      {...rest}
    >
      {children}
    </div>
  );
});

export default memo(Card);
