import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Button from '../Button';

// Wrapper for components that need Router
const RouterWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('Button Component', () => {
  it('renders with children', () => {
    render(<Button>Click me</Button>, { wrapper: RouterWrapper });
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>, { wrapper: RouterWrapper });

    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Click me</Button>, { wrapper: RouterWrapper });

    const button = screen.getByText('Click me');
    expect(button).toBeDisabled();
  });

  it('shows loading state', () => {
    render(<Button loading>Click me</Button>, { wrapper: RouterWrapper });

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    // Check for loading indicator if implemented
  });

  it('applies variant styles', () => {
    const { rerender } = render(<Button variant="primary">Primary</Button>, { wrapper: RouterWrapper });
    let button = screen.getByText('Primary');
    expect(button.className).toContain('bg-blue');

    rerender(<Button variant="secondary">Secondary</Button>);
    button = screen.getByText('Secondary');
    expect(button.className).toContain('bg-gray');
  });

  it('applies size styles', () => {
    const { rerender } = render(<Button size="sm">Small</Button>, { wrapper: RouterWrapper });
    let button = screen.getByText('Small');
    expect(button.className).toMatch(/px-\d+/); // Has padding

    rerender(<Button size="lg">Large</Button>);
    button = screen.getByText('Large');
    expect(button.className).toMatch(/px-\d+/); // Has padding
  });

  it('renders as link when href is provided', () => {
    render(<Button href="/test">Link Button</Button>, { wrapper: RouterWrapper });

    const link = screen.getByText('Link Button');
    expect(link.tagName).toBe('A');
  });

  it('does not call onClick when disabled', () => {
    const handleClick = vi.fn();
    render(
      <Button onClick={handleClick} disabled>
        Disabled
      </Button>,
      { wrapper: RouterWrapper }
    );

    fireEvent.click(screen.getByText('Disabled'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('renders with full width when fullWidth prop is true', () => {
    render(<Button fullWidth>Full Width</Button>, { wrapper: RouterWrapper });

    const button = screen.getByText('Full Width');
    expect(button.className).toContain('w-full');
  });

  it('applies custom className', () => {
    render(<Button className="custom-class">Custom</Button>, { wrapper: RouterWrapper });

    const button = screen.getByText('Custom');
    expect(button.className).toContain('custom-class');
  });
});
