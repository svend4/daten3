import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Tabs from '../Tabs';

const mockTabs = [
  { id: 'tab1', label: 'Tab 1', content: <div>Content 1</div> },
  { id: 'tab2', label: 'Tab 2', content: <div>Content 2</div> },
  { id: 'tab3', label: 'Tab 3', content: <div>Content 3</div> },
];

const mockTabsWithDisabled = [
  { id: 'tab1', label: 'Tab 1', content: <div>Content 1</div> },
  { id: 'tab2', label: 'Tab 2', content: <div>Content 2</div>, disabled: true },
  { id: 'tab3', label: 'Tab 3', content: <div>Content 3</div> },
];

describe('Tabs Component', () => {
  describe('Rendering', () => {
    it('renders all tabs', () => {
      render(<Tabs tabs={mockTabs} />);
      expect(screen.getByText('Tab 1')).toBeInTheDocument();
      expect(screen.getByText('Tab 2')).toBeInTheDocument();
      expect(screen.getByText('Tab 3')).toBeInTheDocument();
    });

    it('renders with role="tablist"', () => {
      render(<Tabs tabs={mockTabs} />);
      expect(screen.getByRole('tablist')).toBeInTheDocument();
    });

    it('renders tabs with role="tab"', () => {
      render(<Tabs tabs={mockTabs} />);
      const tabs = screen.getAllByRole('tab');
      expect(tabs).toHaveLength(3);
    });

    it('renders first tab content by default', () => {
      render(<Tabs tabs={mockTabs} />);
      expect(screen.getByText('Content 1')).toBeInTheDocument();
    });

    it('renders specified default tab content', () => {
      render(<Tabs tabs={mockTabs} defaultActiveTab="tab2" />);
      expect(screen.getByText('Content 2')).toBeInTheDocument();
    });
  });

  describe('Active State', () => {
    it('marks first tab as active by default', () => {
      render(<Tabs tabs={mockTabs} />);
      const firstTab = screen.getByText('Tab 1').closest('button');
      expect(firstTab).toHaveAttribute('aria-selected', 'true');
    });

    it('marks specified default tab as active', () => {
      render(<Tabs tabs={mockTabs} defaultActiveTab="tab2" />);
      const secondTab = screen.getByText('Tab 2').closest('button');
      expect(secondTab).toHaveAttribute('aria-selected', 'true');
    });

    it('marks inactive tabs with aria-selected="false"', () => {
      render(<Tabs tabs={mockTabs} />);
      const inactiveTab = screen.getByText('Tab 2').closest('button');
      expect(inactiveTab).toHaveAttribute('aria-selected', 'false');
    });

    it('applies active styles to selected tab', () => {
      render(<Tabs tabs={mockTabs} />);
      const activeTab = screen.getByText('Tab 1').closest('button');
      expect(activeTab).toHaveClass('border-primary-600');
      expect(activeTab).toHaveClass('text-primary-600');
    });

    it('applies inactive styles to non-selected tabs', () => {
      render(<Tabs tabs={mockTabs} />);
      const inactiveTab = screen.getByText('Tab 2').closest('button');
      expect(inactiveTab).toHaveClass('border-transparent');
      expect(inactiveTab).toHaveClass('text-gray-500');
    });
  });

  describe('Interaction', () => {
    it('changes active tab when clicked', async () => {
      render(<Tabs tabs={mockTabs} />);

      await userEvent.click(screen.getByText('Tab 2'));

      const secondTab = screen.getByText('Tab 2').closest('button');
      expect(secondTab).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByText('Content 2')).toBeInTheDocument();
    });

    it('calls onChange when tab is clicked', async () => {
      const handleChange = vi.fn();
      render(<Tabs tabs={mockTabs} onChange={handleChange} />);

      await userEvent.click(screen.getByText('Tab 2'));
      expect(handleChange).toHaveBeenCalledWith('tab2');
    });

    it('does not change tab when disabled tab is clicked', async () => {
      const handleChange = vi.fn();
      render(<Tabs tabs={mockTabsWithDisabled} onChange={handleChange} />);

      await userEvent.click(screen.getByText('Tab 2'));
      expect(handleChange).not.toHaveBeenCalled();
    });
  });

  describe('Keyboard Navigation', () => {
    it('navigates to next tab with ArrowRight', async () => {
      const handleChange = vi.fn();
      render(<Tabs tabs={mockTabs} onChange={handleChange} />);

      const firstTab = screen.getByText('Tab 1');
      firstTab.focus();
      await userEvent.keyboard('{ArrowRight}');

      expect(handleChange).toHaveBeenCalledWith('tab2');
    });

    it('navigates to previous tab with ArrowLeft', async () => {
      const handleChange = vi.fn();
      render(<Tabs tabs={mockTabs} defaultActiveTab="tab2" onChange={handleChange} />);

      const secondTab = screen.getByText('Tab 2');
      secondTab.focus();
      await userEvent.keyboard('{ArrowLeft}');

      expect(handleChange).toHaveBeenCalledWith('tab1');
    });

    it('navigates to first tab with Home', async () => {
      const handleChange = vi.fn();
      render(<Tabs tabs={mockTabs} defaultActiveTab="tab3" onChange={handleChange} />);

      const thirdTab = screen.getByText('Tab 3');
      thirdTab.focus();
      await userEvent.keyboard('{Home}');

      expect(handleChange).toHaveBeenCalledWith('tab1');
    });

    it('navigates to last tab with End', async () => {
      const handleChange = vi.fn();
      render(<Tabs tabs={mockTabs} onChange={handleChange} />);

      const firstTab = screen.getByText('Tab 1');
      firstTab.focus();
      await userEvent.keyboard('{End}');

      expect(handleChange).toHaveBeenCalledWith('tab3');
    });

    it('wraps around when at end', async () => {
      const handleChange = vi.fn();
      render(<Tabs tabs={mockTabs} defaultActiveTab="tab3" onChange={handleChange} />);

      const thirdTab = screen.getByText('Tab 3');
      thirdTab.focus();
      await userEvent.keyboard('{ArrowRight}');

      expect(handleChange).toHaveBeenCalledWith('tab1');
    });
  });

  describe('Disabled Tabs', () => {
    it('marks disabled tab with aria-disabled', () => {
      render(<Tabs tabs={mockTabsWithDisabled} />);
      const disabledTab = screen.getByText('Tab 2').closest('button');
      expect(disabledTab).toHaveAttribute('aria-disabled', 'true');
    });

    it('disables the tab button', () => {
      render(<Tabs tabs={mockTabsWithDisabled} />);
      const disabledTab = screen.getByText('Tab 2').closest('button');
      expect(disabledTab).toBeDisabled();
    });

    it('applies disabled styles', () => {
      render(<Tabs tabs={mockTabsWithDisabled} />);
      const disabledTab = screen.getByText('Tab 2').closest('button');
      expect(disabledTab).toHaveClass('opacity-50');
      expect(disabledTab).toHaveClass('cursor-not-allowed');
    });
  });

  describe('Accessibility', () => {
    it('has aria-label on tablist', () => {
      render(<Tabs tabs={mockTabs} />);
      const tablist = screen.getByRole('tablist');
      expect(tablist).toHaveAttribute('aria-label', 'Tabs');
    });

    it('tabs have aria-controls linking to panels', () => {
      render(<Tabs tabs={mockTabs} />);
      const firstTab = screen.getByText('Tab 1').closest('button');
      expect(firstTab).toHaveAttribute('aria-controls');
    });

    it('renders tabpanel for active tab', () => {
      render(<Tabs tabs={mockTabs} />);
      const panel = screen.getByRole('tabpanel');
      expect(panel).toBeInTheDocument();
    });

    it('tabpanel has aria-labelledby linking to tab', () => {
      render(<Tabs tabs={mockTabs} />);
      const panel = screen.getByRole('tabpanel');
      expect(panel).toHaveAttribute('aria-labelledby');
    });

    it('active tab has tabIndex 0', () => {
      render(<Tabs tabs={mockTabs} />);
      const activeTab = screen.getByText('Tab 1').closest('button');
      expect(activeTab).toHaveAttribute('tabindex', '0');
    });

    it('inactive tabs have tabIndex -1', () => {
      render(<Tabs tabs={mockTabs} />);
      const inactiveTab = screen.getByText('Tab 2').closest('button');
      expect(inactiveTab).toHaveAttribute('tabindex', '-1');
    });
  });

  describe('Custom Styling', () => {
    it('applies custom className', () => {
      render(<Tabs tabs={mockTabs} className="custom-tabs" />);
      const container = screen.getByRole('tablist').parentElement;
      expect(container).toHaveClass('custom-tabs');
    });
  });
});
