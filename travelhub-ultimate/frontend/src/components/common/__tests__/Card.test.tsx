import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Card from '../Card';

describe('Card Component', () => {
  // =============================================================================
  // Basic Rendering Tests
  // =============================================================================
  describe('Rendering', () => {
    it('renders children correctly', () => {
      render(<Card>Card Content</Card>);
      expect(screen.getByText('Card Content')).toBeInTheDocument();
    });

    it('renders with default styles', () => {
      render(<Card data-testid="card">Content</Card>);
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('bg-white');
      expect(card).toHaveClass('rounded-xl');
      expect(card).toHaveClass('shadow-md');
    });

    it('renders complex children', () => {
      render(
        <Card>
          <h2 data-testid="title">Title</h2>
          <p data-testid="description">Description</p>
        </Card>
      );
      expect(screen.getByTestId('title')).toBeInTheDocument();
      expect(screen.getByTestId('description')).toBeInTheDocument();
    });
  });

  // =============================================================================
  // Padding Tests
  // =============================================================================
  describe('Padding', () => {
    it('applies default (md) padding', () => {
      render(<Card>Content</Card>);
      const card = screen.getByText('Content').closest('div');
      expect(card).toHaveClass('p-6');
    });

    it('applies no padding when padding="none"', () => {
      render(<Card padding="none">Content</Card>);
      const card = screen.getByText('Content').closest('div');
      expect(card).not.toHaveClass('p-4');
      expect(card).not.toHaveClass('p-6');
      expect(card).not.toHaveClass('p-8');
    });

    it('applies small padding when padding="sm"', () => {
      render(<Card padding="sm">Content</Card>);
      const card = screen.getByText('Content').closest('div');
      expect(card).toHaveClass('p-4');
    });

    it('applies large padding when padding="lg"', () => {
      render(<Card padding="lg">Content</Card>);
      const card = screen.getByText('Content').closest('div');
      expect(card).toHaveClass('p-8');
    });
  });

  // =============================================================================
  // Hover Effects Tests
  // =============================================================================
  describe('Hover Effects', () => {
    it('does not apply hover styles by default', () => {
      render(<Card>Content</Card>);
      const card = screen.getByText('Content').closest('div');
      expect(card).not.toHaveClass('hover:shadow-xl');
    });

    it('applies hover styles when hover is true', () => {
      render(<Card hover>Content</Card>);
      const card = screen.getByText('Content').closest('div');
      expect(card).toHaveClass('hover:shadow-xl');
      expect(card).toHaveClass('transition-shadow');
    });
  });

  // =============================================================================
  // Custom Class Tests
  // =============================================================================
  describe('Custom Classes', () => {
    it('applies custom className', () => {
      render(<Card className="custom-class">Content</Card>);
      const card = screen.getByText('Content').closest('div');
      expect(card).toHaveClass('custom-class');
    });

    it('merges custom className with default classes', () => {
      render(<Card className="custom-class">Content</Card>);
      const card = screen.getByText('Content').closest('div');
      expect(card).toHaveClass('bg-white');
      expect(card).toHaveClass('custom-class');
    });
  });

  // =============================================================================
  // Interactive Card Tests
  // =============================================================================
  describe('Interactive Behavior', () => {
    it('calls onClick when clicked', async () => {
      const handleClick = vi.fn();
      render(<Card onClick={handleClick}>Clickable Card</Card>);

      await userEvent.click(screen.getByText('Clickable Card'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('adds cursor-pointer when onClick is provided', () => {
      const handleClick = vi.fn();
      render(<Card onClick={handleClick}>Clickable Card</Card>);
      const card = screen.getByText('Clickable Card').closest('div');
      expect(card).toHaveClass('cursor-pointer');
    });

    it('sets role="button" when interactive', () => {
      const handleClick = vi.fn();
      render(<Card onClick={handleClick}>Clickable Card</Card>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('sets tabIndex=0 when interactive', () => {
      const handleClick = vi.fn();
      render(<Card onClick={handleClick}>Clickable Card</Card>);
      const card = screen.getByText('Clickable Card').closest('div');
      expect(card).toHaveAttribute('tabindex', '0');
    });

    it('handles Enter key press', async () => {
      const handleClick = vi.fn();
      render(<Card onClick={handleClick}>Interactive Card</Card>);

      const card = screen.getByRole('button');
      card.focus();
      await userEvent.keyboard('{Enter}');

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('handles Space key press', async () => {
      const handleClick = vi.fn();
      render(<Card onClick={handleClick}>Interactive Card</Card>);

      const card = screen.getByRole('button');
      card.focus();
      await userEvent.keyboard(' ');

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('does not add interactive styles without onClick', () => {
      render(<Card>Non-interactive Card</Card>);
      const card = screen.getByText('Non-interactive Card').closest('div');
      expect(card).not.toHaveClass('cursor-pointer');
      expect(card).not.toHaveAttribute('tabindex');
    });
  });

  // =============================================================================
  // Accessibility Tests
  // =============================================================================
  describe('Accessibility', () => {
    it('supports custom aria-label', () => {
      render(<Card aria-label="Custom card label">Content</Card>);
      expect(screen.getByLabelText('Custom card label')).toBeInTheDocument();
    });

    it('supports aria-describedby', () => {
      render(
        <>
          <Card aria-describedby="card-description">Content</Card>
          <p id="card-description">Card description</p>
        </>
      );
      const card = screen.getByText('Content').closest('div');
      expect(card).toHaveAttribute('aria-describedby', 'card-description');
    });

    it('allows custom role override', () => {
      const handleClick = vi.fn();
      render(
        <Card onClick={handleClick} role="article">
          Article Card
        </Card>
      );
      expect(screen.getByRole('article')).toBeInTheDocument();
    });

    it('allows custom tabIndex override', () => {
      const handleClick = vi.fn();
      render(
        <Card onClick={handleClick} tabIndex={-1}>
          Card
        </Card>
      );
      const card = screen.getByText('Card').closest('div');
      expect(card).toHaveAttribute('tabindex', '-1');
    });

    it('adds focus ring for keyboard navigation', () => {
      const handleClick = vi.fn();
      render(<Card onClick={handleClick}>Focusable Card</Card>);
      const card = screen.getByText('Focusable Card').closest('div');
      expect(card).toHaveClass('focus:ring-2');
      expect(card).toHaveClass('focus:ring-primary-500');
    });
  });

  // =============================================================================
  // Ref Forwarding Tests
  // =============================================================================
  describe('Ref Forwarding', () => {
    it('forwards ref to the div element', () => {
      const ref = { current: null as HTMLDivElement | null };
      render(<Card ref={ref}>Content</Card>);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  // =============================================================================
  // Custom Event Handlers Tests
  // =============================================================================
  describe('Custom Event Handlers', () => {
    it('supports custom onKeyDown handler', async () => {
      const handleKeyDown = vi.fn();
      render(<Card onKeyDown={handleKeyDown}>Card</Card>);

      const card = screen.getByText('Card').closest('div')!;
      fireEvent.keyDown(card, { key: 'Escape' });

      expect(handleKeyDown).toHaveBeenCalledTimes(1);
    });

    it('calls both custom onKeyDown and internal handler', async () => {
      const handleClick = vi.fn();
      const handleKeyDown = vi.fn();
      render(
        <Card onClick={handleClick} onKeyDown={handleKeyDown}>
          Card
        </Card>
      );

      const card = screen.getByRole('button');
      fireEvent.keyDown(card, { key: 'Enter' });

      expect(handleKeyDown).toHaveBeenCalledTimes(1);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  // =============================================================================
  // HTML Attributes Passthrough Tests
  // =============================================================================
  describe('HTML Attributes Passthrough', () => {
    it('passes through data attributes', () => {
      render(<Card data-testid="test-card">Content</Card>);
      expect(screen.getByTestId('test-card')).toBeInTheDocument();
    });

    it('passes through id attribute', () => {
      render(<Card id="my-card">Content</Card>);
      expect(document.getElementById('my-card')).toBeInTheDocument();
    });

    it('passes through title attribute', () => {
      render(<Card title="Card Title">Content</Card>);
      const card = screen.getByText('Content').closest('div');
      expect(card).toHaveAttribute('title', 'Card Title');
    });
  });
});
