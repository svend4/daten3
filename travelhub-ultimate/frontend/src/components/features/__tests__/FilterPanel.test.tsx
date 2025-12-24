import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FilterPanel from '../FilterPanel';

const mockGroups = [
  {
    id: 'airlines',
    label: 'Airlines',
    type: 'checkbox' as const,
    options: [
      { id: 'aeroflot', label: 'Aeroflot', value: 'aeroflot' },
      { id: 'lufthansa', label: 'Lufthansa', value: 'lufthansa' },
    ],
  },
  {
    id: 'class',
    label: 'Class',
    type: 'radio' as const,
    options: [
      { id: 'economy', label: 'Economy', value: 'economy' },
      { id: 'business', label: 'Business', value: 'business' },
    ],
  },
  {
    id: 'price',
    label: 'Price Range',
    type: 'range' as const,
    min: 0,
    max: 1000,
    step: 50,
  },
];

describe('FilterPanel Component', () => {
  describe('Rendering', () => {
    it('renders filter header', () => {
      render(
        <FilterPanel
          groups={mockGroups}
          values={{}}
          onChange={vi.fn()}
          onApply={vi.fn()}
          onReset={vi.fn()}
        />
      );
      expect(screen.getByText('Фильтры')).toBeInTheDocument();
    });

    it('renders all filter groups', () => {
      render(
        <FilterPanel
          groups={mockGroups}
          values={{}}
          onChange={vi.fn()}
          onApply={vi.fn()}
          onReset={vi.fn()}
        />
      );
      expect(screen.getByText('Airlines')).toBeInTheDocument();
      expect(screen.getByText('Class')).toBeInTheDocument();
      expect(screen.getByText('Price Range')).toBeInTheDocument();
    });

    it('renders apply button', () => {
      render(
        <FilterPanel
          groups={mockGroups}
          values={{}}
          onChange={vi.fn()}
          onApply={vi.fn()}
          onReset={vi.fn()}
        />
      );
      expect(screen.getByText('Применить фильтры')).toBeInTheDocument();
    });
  });

  describe('Checkbox Filters', () => {
    it('renders checkbox options', () => {
      render(
        <FilterPanel
          groups={mockGroups}
          values={{}}
          onChange={vi.fn()}
          onApply={vi.fn()}
          onReset={vi.fn()}
        />
      );
      expect(screen.getByText('Aeroflot')).toBeInTheDocument();
      expect(screen.getByText('Lufthansa')).toBeInTheDocument();
    });

    it('checks checkbox based on values', () => {
      render(
        <FilterPanel
          groups={mockGroups}
          values={{ airlines: ['aeroflot'] }}
          onChange={vi.fn()}
          onApply={vi.fn()}
          onReset={vi.fn()}
        />
      );
      const checkbox = screen.getByLabelText('Aeroflot');
      expect(checkbox).toBeChecked();
    });

    it('calls onChange when checkbox is toggled', async () => {
      const handleChange = vi.fn();
      render(
        <FilterPanel
          groups={mockGroups}
          values={{}}
          onChange={handleChange}
          onApply={vi.fn()}
          onReset={vi.fn()}
        />
      );

      await userEvent.click(screen.getByLabelText('Aeroflot'));
      expect(handleChange).toHaveBeenCalledWith({ airlines: ['aeroflot'] });
    });
  });

  describe('Radio Filters', () => {
    it('renders radio options', () => {
      render(
        <FilterPanel
          groups={mockGroups}
          values={{}}
          onChange={vi.fn()}
          onApply={vi.fn()}
          onReset={vi.fn()}
        />
      );
      expect(screen.getByText('Economy')).toBeInTheDocument();
      expect(screen.getByText('Business')).toBeInTheDocument();
    });

    it('selects radio based on values', () => {
      render(
        <FilterPanel
          groups={mockGroups}
          values={{ class: 'business' }}
          onChange={vi.fn()}
          onApply={vi.fn()}
          onReset={vi.fn()}
        />
      );
      const radio = screen.getByLabelText('Business');
      expect(radio).toBeChecked();
    });

    it('calls onChange when radio is selected', async () => {
      const handleChange = vi.fn();
      render(
        <FilterPanel
          groups={mockGroups}
          values={{}}
          onChange={handleChange}
          onApply={vi.fn()}
          onReset={vi.fn()}
        />
      );

      await userEvent.click(screen.getByLabelText('Economy'));
      expect(handleChange).toHaveBeenCalledWith({ class: 'economy' });
    });
  });

  describe('Range Filters', () => {
    it('renders range inputs', () => {
      render(
        <FilterPanel
          groups={mockGroups}
          values={{}}
          onChange={vi.fn()}
          onApply={vi.fn()}
          onReset={vi.fn()}
        />
      );
      expect(screen.getByText('От')).toBeInTheDocument();
      expect(screen.getByText('До')).toBeInTheDocument();
    });
  });

  describe('Expand/Collapse', () => {
    it('groups are expanded by default', () => {
      render(
        <FilterPanel
          groups={mockGroups}
          values={{}}
          onChange={vi.fn()}
          onApply={vi.fn()}
          onReset={vi.fn()}
        />
      );
      expect(screen.getByText('Aeroflot')).toBeVisible();
    });

    it('collapses group when clicked', async () => {
      render(
        <FilterPanel
          groups={mockGroups}
          values={{}}
          onChange={vi.fn()}
          onApply={vi.fn()}
          onReset={vi.fn()}
        />
      );

      await userEvent.click(screen.getByText('Airlines'));
      // After collapse, options should be hidden
      expect(screen.queryByLabelText('Aeroflot')).not.toBeInTheDocument();
    });
  });

  describe('Actions', () => {
    it('calls onApply when apply button is clicked', async () => {
      const handleApply = vi.fn();
      render(
        <FilterPanel
          groups={mockGroups}
          values={{}}
          onChange={vi.fn()}
          onApply={handleApply}
          onReset={vi.fn()}
        />
      );

      await userEvent.click(screen.getByText('Применить фильтры'));
      expect(handleApply).toHaveBeenCalled();
    });

    it('shows reset button when filters are active', () => {
      render(
        <FilterPanel
          groups={mockGroups}
          values={{ airlines: ['aeroflot'] }}
          onChange={vi.fn()}
          onApply={vi.fn()}
          onReset={vi.fn()}
        />
      );
      expect(screen.getByText('Сбросить')).toBeInTheDocument();
    });

    it('calls onReset when reset button is clicked', async () => {
      const handleReset = vi.fn();
      render(
        <FilterPanel
          groups={mockGroups}
          values={{ airlines: ['aeroflot'] }}
          onChange={vi.fn()}
          onApply={vi.fn()}
          onReset={handleReset}
        />
      );

      await userEvent.click(screen.getByText('Сбросить'));
      expect(handleReset).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has aria-expanded on group buttons', () => {
      render(
        <FilterPanel
          groups={mockGroups}
          values={{}}
          onChange={vi.fn()}
          onApply={vi.fn()}
          onReset={vi.fn()}
        />
      );
      const groupButton = screen.getByText('Airlines').closest('button');
      expect(groupButton).toHaveAttribute('aria-expanded', 'true');
    });

    it('has aria-controls linking button to panel', () => {
      render(
        <FilterPanel
          groups={mockGroups}
          values={{}}
          onChange={vi.fn()}
          onApply={vi.fn()}
          onReset={vi.fn()}
        />
      );
      const groupButton = screen.getByText('Airlines').closest('button');
      expect(groupButton).toHaveAttribute('aria-controls');
    });

    it('reset button has aria-label', () => {
      render(
        <FilterPanel
          groups={mockGroups}
          values={{ airlines: ['aeroflot'] }}
          onChange={vi.fn()}
          onApply={vi.fn()}
          onReset={vi.fn()}
        />
      );
      expect(screen.getByLabelText('Сбросить все фильтры')).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('applies custom className', () => {
      render(
        <FilterPanel
          groups={mockGroups}
          values={{}}
          onChange={vi.fn()}
          onApply={vi.fn()}
          onReset={vi.fn()}
          className="custom-filter"
        />
      );
      const panel = screen.getByText('Фильтры').closest('.bg-white');
      expect(panel).toHaveClass('custom-filter');
    });
  });
});
