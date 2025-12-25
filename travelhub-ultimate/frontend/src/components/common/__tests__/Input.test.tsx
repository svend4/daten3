import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Input from '../Input';

describe('Input Component', () => {
  // =============================================================================
  // Basic Rendering Tests
  // =============================================================================
  describe('Rendering', () => {
    it('renders input element', () => {
      render(<Input value="" onChange={() => {}} />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('renders with label', () => {
      render(<Input label="Email" value="" onChange={() => {}} />);
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
    });

    it('renders with placeholder', () => {
      render(<Input placeholder="Enter email" value="" onChange={() => {}} />);
      expect(screen.getByPlaceholderText('Enter email')).toBeInTheDocument();
    });

    it('renders with value', () => {
      render(<Input value="test@example.com" onChange={() => {}} />);
      expect(screen.getByRole('textbox')).toHaveValue('test@example.com');
    });

    it('renders required indicator when required', () => {
      render(<Input label="Email" required value="" onChange={() => {}} />);
      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('renders with icon', () => {
      const icon = <span data-testid="test-icon">📧</span>;
      render(<Input icon={icon} value="" onChange={() => {}} />);
      expect(screen.getByTestId('test-icon')).toBeInTheDocument();
    });
  });

  // =============================================================================
  // Accessibility Tests
  // =============================================================================
  describe('Accessibility', () => {
    it('has proper label association', () => {
      render(<Input label="Email" name="email" value="" onChange={() => {}} />);
      const input = screen.getByLabelText('Email');
      expect(input).toHaveAttribute('id', 'input-email');
    });

    it('sets aria-invalid when error is present', () => {
      render(<Input error="Invalid email" value="" onChange={() => {}} />);
      expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
    });

    it('sets aria-invalid to false when no error', () => {
      render(<Input value="" onChange={() => {}} />);
      expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'false');
    });

    it('sets aria-required when required', () => {
      render(<Input required value="" onChange={() => {}} />);
      expect(screen.getByRole('textbox')).toHaveAttribute('aria-required', 'true');
    });

    it('has aria-describedby linked to error message', () => {
      render(<Input name="email" error="Invalid email" value="" onChange={() => {}} />);
      const input = screen.getByRole('textbox');
      const errorId = input.getAttribute('aria-describedby');
      expect(errorId).toContain('error');
      expect(screen.getByText('Invalid email')).toHaveAttribute('id', errorId);
    });

    it('has aria-describedby linked to helper text', () => {
      render(<Input name="email" helperText="Enter your email" value="" onChange={() => {}} />);
      const input = screen.getByRole('textbox');
      const helperId = input.getAttribute('aria-describedby');
      expect(helperId).toContain('helper');
    });

    it('error message has role="alert"', () => {
      render(<Input error="Invalid email" value="" onChange={() => {}} />);
      expect(screen.getByRole('alert')).toHaveTextContent('Invalid email');
    });
  });

  // =============================================================================
  // Interaction Tests
  // =============================================================================
  describe('Interactions', () => {
    it('calls onChange with new value', async () => {
      const handleChange = vi.fn();
      render(<Input value="" onChange={handleChange} />);

      const input = screen.getByRole('textbox');
      await userEvent.type(input, 'test');

      expect(handleChange).toHaveBeenCalledWith('t');
      expect(handleChange).toHaveBeenCalledWith('e');
      expect(handleChange).toHaveBeenCalledWith('s');
      expect(handleChange).toHaveBeenCalledWith('t');
    });

    it('calls onBlur when input loses focus', () => {
      const handleBlur = vi.fn();
      render(<Input value="" onChange={() => {}} onBlur={handleBlur} />);

      const input = screen.getByRole('textbox');
      fireEvent.blur(input);

      expect(handleBlur).toHaveBeenCalledTimes(1);
    });

    it('calls onFocus when input gains focus', () => {
      const handleFocus = vi.fn();
      render(<Input value="" onChange={() => {}} onFocus={handleFocus} />);

      const input = screen.getByRole('textbox');
      fireEvent.focus(input);

      expect(handleFocus).toHaveBeenCalledTimes(1);
    });

    it('does not allow input when disabled', () => {
      const handleChange = vi.fn();
      render(<Input value="" onChange={handleChange} disabled />);

      const input = screen.getByRole('textbox');
      expect(input).toBeDisabled();
    });
  });

  // =============================================================================
  // Type Tests
  // =============================================================================
  describe('Input Types', () => {
    it('renders as text by default', () => {
      render(<Input value="" onChange={() => {}} />);
      expect(screen.getByRole('textbox')).toHaveAttribute('type', 'text');
    });

    it('renders as email type', () => {
      render(<Input type="email" value="" onChange={() => {}} />);
      expect(screen.getByRole('textbox')).toHaveAttribute('type', 'email');
    });

    it('renders as password type', () => {
      render(<Input type="password" value="" onChange={() => {}} />);
      // Password inputs don't have textbox role
      expect(document.querySelector('input[type="password"]')).toBeInTheDocument();
    });

    it('renders as tel type', () => {
      render(<Input type="tel" value="" onChange={() => {}} />);
      expect(screen.getByRole('textbox')).toHaveAttribute('type', 'tel');
    });
  });

  // =============================================================================
  // Error and Helper Text Tests
  // =============================================================================
  describe('Error and Helper Text', () => {
    it('displays error message', () => {
      render(<Input error="This field is required" value="" onChange={() => {}} />);
      expect(screen.getByText('This field is required')).toBeInTheDocument();
    });

    it('displays helper text when no error', () => {
      render(<Input helperText="Enter a valid email" value="" onChange={() => {}} />);
      expect(screen.getByText('Enter a valid email')).toBeInTheDocument();
    });

    it('hides helper text when error is present', () => {
      render(
        <Input
          helperText="Enter a valid email"
          error="Invalid email"
          value=""
          onChange={() => {}}
        />
      );
      expect(screen.queryByText('Enter a valid email')).not.toBeInTheDocument();
      expect(screen.getByText('Invalid email')).toBeInTheDocument();
    });
  });

  // =============================================================================
  // Styling Tests
  // =============================================================================
  describe('Styling', () => {
    it('applies custom className', () => {
      render(<Input className="custom-class" value="" onChange={() => {}} />);
      const wrapper = screen.getByRole('textbox').closest('div')?.parentElement;
      expect(wrapper).toHaveClass('custom-class');
    });

    it('applies disabled styling', () => {
      render(<Input disabled value="" onChange={() => {}} />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('bg-gray-100');
      expect(input).toHaveClass('cursor-not-allowed');
    });

    it('applies error styling', () => {
      render(<Input error="Error" value="" onChange={() => {}} />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('border-red-500');
    });

    it('applies icon padding when icon is present', () => {
      const icon = <span>📧</span>;
      render(<Input icon={icon} value="" onChange={() => {}} />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('pl-10');
    });
  });

  // =============================================================================
  // HTML Attributes Tests
  // =============================================================================
  describe('HTML Attributes', () => {
    it('sets name attribute', () => {
      render(<Input name="email" value="" onChange={() => {}} />);
      expect(screen.getByRole('textbox')).toHaveAttribute('name', 'email');
    });

    it('sets autoComplete attribute', () => {
      render(<Input autoComplete="email" value="" onChange={() => {}} />);
      expect(screen.getByRole('textbox')).toHaveAttribute('autocomplete', 'email');
    });

    it('sets minLength attribute', () => {
      render(<Input minLength={5} value="" onChange={() => {}} />);
      expect(screen.getByRole('textbox')).toHaveAttribute('minlength', '5');
    });

    it('sets maxLength attribute', () => {
      render(<Input maxLength={100} value="" onChange={() => {}} />);
      expect(screen.getByRole('textbox')).toHaveAttribute('maxlength', '100');
    });

    it('sets pattern attribute', () => {
      render(<Input pattern="[A-Za-z]+" value="" onChange={() => {}} />);
      expect(screen.getByRole('textbox')).toHaveAttribute('pattern', '[A-Za-z]+');
    });
  });
});
