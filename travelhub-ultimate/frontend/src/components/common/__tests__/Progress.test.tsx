import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Progress from '../Progress';

describe('Progress Component', () => {
  describe('Rendering', () => {
    it('renders progress bar', () => {
      render(<Progress value={50} />);
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('renders with correct value', () => {
      render(<Progress value={75} />);
      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAttribute('aria-valuenow', '75');
    });
  });

  describe('Value Constraints', () => {
    it('passes negative value to aria (visual clamped)', () => {
      render(<Progress value={-10} />);
      const progressbar = screen.getByRole('progressbar');
      // The component stores the raw value in aria, but visually clamps
      expect(progressbar).toHaveAttribute('aria-valuenow', '-10');
    });

    it('passes value above max to aria (visual clamped)', () => {
      render(<Progress value={150} />);
      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAttribute('aria-valuenow', '150');
    });

    it('accepts custom max value', () => {
      render(<Progress value={50} max={200} />);
      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAttribute('aria-valuemax', '200');
    });
  });

  describe('Accessibility', () => {
    it('has aria-valuemin attribute', () => {
      render(<Progress value={50} />);
      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAttribute('aria-valuemin', '0');
    });

    it('has aria-valuemax attribute', () => {
      render(<Progress value={50} />);
      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAttribute('aria-valuemax', '100');
    });

    it('has default aria-label', () => {
      render(<Progress value={50} />);
      expect(screen.getByLabelText('Progress')).toBeInTheDocument();
    });

    it('uses label prop as aria-label', () => {
      render(<Progress value={50} label="Upload progress" />);
      expect(screen.getByLabelText('Upload progress')).toBeInTheDocument();
    });
  });

  describe('Color Variants', () => {
    it('applies primary color by default', () => {
      render(<Progress value={50} />);
      const progressbar = screen.getByRole('progressbar');
      const inner = progressbar.querySelector('div');
      expect(inner).toHaveClass('bg-primary-600');
    });

    it('applies success color', () => {
      render(<Progress value={50} color="success" />);
      const progressbar = screen.getByRole('progressbar');
      const inner = progressbar.querySelector('div');
      expect(inner).toHaveClass('bg-green-600');
    });

    it('applies warning color', () => {
      render(<Progress value={50} color="warning" />);
      const progressbar = screen.getByRole('progressbar');
      const inner = progressbar.querySelector('div');
      expect(inner).toHaveClass('bg-yellow-500');
    });

    it('applies error color', () => {
      render(<Progress value={50} color="error" />);
      const progressbar = screen.getByRole('progressbar');
      const inner = progressbar.querySelector('div');
      expect(inner).toHaveClass('bg-red-600');
    });
  });

  describe('Sizes', () => {
    it('applies small size', () => {
      render(<Progress value={50} size="sm" />);
      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveClass('h-1');
    });

    it('applies medium size (default)', () => {
      render(<Progress value={50} />);
      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveClass('h-2');
    });

    it('applies large size', () => {
      render(<Progress value={50} size="lg" />);
      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveClass('h-3');
    });
  });

  describe('Label and Percentage', () => {
    it('shows label when provided', () => {
      render(<Progress value={50} label="Upload" />);
      expect(screen.getByText('Upload')).toBeInTheDocument();
    });

    it('shows percentage when showPercentage is true', () => {
      render(<Progress value={50} showPercentage />);
      expect(screen.getByText('50%')).toBeInTheDocument();
    });

    it('does not show percentage by default', () => {
      render(<Progress value={50} />);
      expect(screen.queryByText('50%')).not.toBeInTheDocument();
    });

    it('shows both label and percentage', () => {
      render(<Progress value={75} label="Progress" showPercentage />);
      expect(screen.getByText('Progress')).toBeInTheDocument();
      expect(screen.getByText('75%')).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('applies custom className to wrapper', () => {
      render(<Progress value={50} className="custom-progress" />);
      const wrapper = screen.getByRole('progressbar').parentElement;
      expect(wrapper).toHaveClass('custom-progress');
    });

    it('has rounded corners', () => {
      render(<Progress value={50} />);
      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveClass('rounded-full');
    });

    it('has overflow hidden', () => {
      render(<Progress value={50} />);
      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveClass('overflow-hidden');
    });
  });

  describe('Progress Width', () => {
    it('sets correct width based on value', () => {
      render(<Progress value={50} />);
      const progressbar = screen.getByRole('progressbar');
      const inner = progressbar.querySelector('div');
      expect(inner).toHaveStyle({ width: '50%' });
    });

    it('clamps width to 0% for negative values', () => {
      render(<Progress value={-50} />);
      const progressbar = screen.getByRole('progressbar');
      const inner = progressbar.querySelector('div');
      expect(inner).toHaveStyle({ width: '0%' });
    });

    it('clamps width to 100% for values exceeding max', () => {
      render(<Progress value={150} />);
      const progressbar = screen.getByRole('progressbar');
      const inner = progressbar.querySelector('div');
      expect(inner).toHaveStyle({ width: '100%' });
    });

    it('calculates percentage based on custom max', () => {
      render(<Progress value={50} max={200} />);
      const progressbar = screen.getByRole('progressbar');
      const inner = progressbar.querySelector('div');
      expect(inner).toHaveStyle({ width: '25%' });
    });
  });
});
