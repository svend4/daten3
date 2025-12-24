import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { SearchWidget } from '../SearchWidgetExtended';

const RouterWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('SearchWidget Component', () => {
  describe('Rendering', () => {
    it('renders search widget', () => {
      render(<SearchWidget onSearch={vi.fn()} />, { wrapper: RouterWrapper });
      expect(screen.getByRole('tablist')).toBeInTheDocument();
    });

    it('renders all search type tabs', () => {
      render(<SearchWidget onSearch={vi.fn()} />, { wrapper: RouterWrapper });
      expect(screen.getByText('Авиабилеты')).toBeInTheDocument();
      expect(screen.getByText('Отели')).toBeInTheDocument();
      expect(screen.getByText('Авто')).toBeInTheDocument();
    });

    it('defaults to flights tab', () => {
      render(<SearchWidget onSearch={vi.fn()} />, { wrapper: RouterWrapper });
      const flightsTab = screen.getByText('Авиабилеты').closest('button');
      expect(flightsTab).toHaveAttribute('aria-selected', 'true');
    });
  });

  describe('Tab Navigation', () => {
    it('switches to hotels tab when clicked', async () => {
      render(<SearchWidget onSearch={vi.fn()} />, { wrapper: RouterWrapper });

      await userEvent.click(screen.getByText('Отели'));
      const hotelsTab = screen.getByText('Отели').closest('button');
      expect(hotelsTab).toHaveAttribute('aria-selected', 'true');
    });

    it('shows hotel search form when hotels tab selected', async () => {
      render(<SearchWidget onSearch={vi.fn()} />, { wrapper: RouterWrapper });

      await userEvent.click(screen.getByText('Отели'));
      expect(screen.getByText('Destination')).toBeInTheDocument();
      expect(screen.getByText('Guests')).toBeInTheDocument();
      expect(screen.getByText('Rooms')).toBeInTheDocument();
    });

    it('shows coming soon message for cars tab', async () => {
      render(<SearchWidget onSearch={vi.fn()} />, { wrapper: RouterWrapper });

      await userEvent.click(screen.getByText('Авто'));
      expect(screen.getByText('Car rental search coming soon...')).toBeInTheDocument();
    });
  });

  describe('Flight Search Form', () => {
    it('renders flight search fields', () => {
      render(<SearchWidget onSearch={vi.fn()} type="flights" />, { wrapper: RouterWrapper });
      expect(screen.getByText('From')).toBeInTheDocument();
      expect(screen.getByText('To')).toBeInTheDocument();
      expect(screen.getByText('Departure')).toBeInTheDocument();
      expect(screen.getByText('Passengers')).toBeInTheDocument();
    });

    it('shows error when required fields are empty', async () => {
      render(<SearchWidget onSearch={vi.fn()} />, { wrapper: RouterWrapper });

      await userEvent.click(screen.getByText('Search Flights'));
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Пожалуйста, заполните все обязательные поля')).toBeInTheDocument();
    });

    it('increments passengers when + clicked', async () => {
      render(<SearchWidget onSearch={vi.fn()} />, { wrapper: RouterWrapper });

      const plusButton = screen.getAllByText('+')[0];
      await userEvent.click(plusButton);
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('decrements passengers when - clicked', async () => {
      render(<SearchWidget onSearch={vi.fn()} />, { wrapper: RouterWrapper });

      const plusButton = screen.getAllByText('+')[0];
      await userEvent.click(plusButton);
      await userEvent.click(plusButton);

      const minusButton = screen.getAllByText('-')[0];
      await userEvent.click(minusButton);
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('does not decrement passengers below 1', async () => {
      render(<SearchWidget onSearch={vi.fn()} />, { wrapper: RouterWrapper });

      const minusButton = screen.getAllByText('-')[0];
      await userEvent.click(minusButton);
      await userEvent.click(minusButton);
      expect(screen.getByText('1')).toBeInTheDocument();
    });
  });

  describe('Hotel Search Form', () => {
    it('renders hotel search fields', async () => {
      render(<SearchWidget onSearch={vi.fn()} type="hotels" />, { wrapper: RouterWrapper });

      await userEvent.click(screen.getByText('Отели'));
      expect(screen.getByText('Destination')).toBeInTheDocument();
      expect(screen.getByText('Check-in')).toBeInTheDocument();
      expect(screen.getByText('Check-out')).toBeInTheDocument();
    });

    it('shows error when required hotel fields are empty', async () => {
      render(<SearchWidget onSearch={vi.fn()} />, { wrapper: RouterWrapper });

      await userEvent.click(screen.getByText('Отели'));
      await userEvent.click(screen.getByText('Search Hotels'));
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('disables search button when loading', () => {
      render(<SearchWidget onSearch={vi.fn()} loading />, { wrapper: RouterWrapper });

      const searchButton = screen.getByText('Search Flights').closest('button');
      expect(searchButton).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('has tablist role for tabs', () => {
      render(<SearchWidget onSearch={vi.fn()} />, { wrapper: RouterWrapper });
      expect(screen.getByRole('tablist')).toBeInTheDocument();
    });

    it('has tab role for each tab', () => {
      render(<SearchWidget onSearch={vi.fn()} />, { wrapper: RouterWrapper });
      const tabs = screen.getAllByRole('tab');
      expect(tabs).toHaveLength(3);
    });

    it('has aria-label on tablist', () => {
      render(<SearchWidget onSearch={vi.fn()} />, { wrapper: RouterWrapper });
      const tablist = screen.getByRole('tablist');
      expect(tablist).toHaveAttribute('aria-label', 'Тип поиска');
    });

    it('marks required fields with asterisk', () => {
      render(<SearchWidget onSearch={vi.fn()} />, { wrapper: RouterWrapper });
      const requiredMarkers = screen.getAllByText('*');
      expect(requiredMarkers.length).toBeGreaterThan(0);
    });

    it('error message has alert role', async () => {
      render(<SearchWidget onSearch={vi.fn()} />, { wrapper: RouterWrapper });

      await userEvent.click(screen.getByText('Search Flights'));
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('applies primary style to active tab', () => {
      render(<SearchWidget onSearch={vi.fn()} />, { wrapper: RouterWrapper });
      const activeTab = screen.getByText('Авиабилеты').closest('button');
      expect(activeTab).toHaveClass('bg-primary-600');
      expect(activeTab).toHaveClass('text-white');
    });

    it('applies gray style to inactive tabs', () => {
      render(<SearchWidget onSearch={vi.fn()} />, { wrapper: RouterWrapper });
      const inactiveTab = screen.getByText('Отели').closest('button');
      expect(inactiveTab).toHaveClass('bg-gray-100');
      expect(inactiveTab).toHaveClass('text-gray-600');
    });
  });
});
