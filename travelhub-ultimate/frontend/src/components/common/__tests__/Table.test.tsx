import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Table from '../Table';

interface TestData {
  id: number;
  name: string;
  email: string;
}

const mockColumns = [
  { key: 'id' as const, header: 'ID' },
  { key: 'name' as const, header: 'Name' },
  { key: 'email' as const, header: 'Email' },
];

const mockData: TestData[] = [
  { id: 1, name: 'John Doe', email: 'john@example.com' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
];

const keyExtractor = (item: TestData) => String(item.id);

describe('Table Component', () => {
  describe('Rendering', () => {
    it('renders table element', () => {
      render(
        <Table
          columns={mockColumns}
          data={mockData}
          keyExtractor={keyExtractor}
        />
      );
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    it('renders column headers', () => {
      render(
        <Table
          columns={mockColumns}
          data={mockData}
          keyExtractor={keyExtractor}
        />
      );
      expect(screen.getByText('ID')).toBeInTheDocument();
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
    });

    it('renders data rows', () => {
      render(
        <Table
          columns={mockColumns}
          data={mockData}
          keyExtractor={keyExtractor}
        />
      );
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    });

    it('renders correct number of rows', () => {
      render(
        <Table
          columns={mockColumns}
          data={mockData}
          keyExtractor={keyExtractor}
        />
      );
      const rows = screen.getAllByRole('row');
      // 1 header row + 2 data rows
      expect(rows).toHaveLength(3);
    });
  });

  describe('Empty State', () => {
    it('shows empty message when no data', () => {
      render(
        <Table
          columns={mockColumns}
          data={[]}
          keyExtractor={keyExtractor}
        />
      );
      expect(screen.getByText('No data available')).toBeInTheDocument();
    });

    it('shows custom empty message', () => {
      render(
        <Table
          columns={mockColumns}
          data={[]}
          keyExtractor={keyExtractor}
          emptyMessage="Custom empty message"
        />
      );
      expect(screen.getByText('Custom empty message')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('shows loading spinner', () => {
      render(
        <Table
          columns={mockColumns}
          data={[]}
          keyExtractor={keyExtractor}
          loading
        />
      );
      // Loading shows a spinner, not the table
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });

    it('does not show data when loading', () => {
      render(
        <Table
          columns={mockColumns}
          data={mockData}
          keyExtractor={keyExtractor}
          loading
        />
      );
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    });
  });

  describe('Custom Cell Rendering', () => {
    it('supports custom render function', () => {
      const columnsWithRender = [
        { key: 'id' as const, header: 'ID' },
        {
          key: 'name' as const,
          header: 'Name',
          render: (item: TestData) => <strong data-testid="custom-cell">{item.name}</strong>,
        },
      ];
      render(
        <Table
          columns={columnsWithRender}
          data={mockData}
          keyExtractor={keyExtractor}
        />
      );
      expect(screen.getAllByTestId('custom-cell')).toHaveLength(2);
    });
  });

  describe('Row Click', () => {
    it('calls onRowClick when row is clicked', async () => {
      const handleRowClick = vi.fn();
      render(
        <Table
          columns={mockColumns}
          data={mockData}
          keyExtractor={keyExtractor}
          onRowClick={handleRowClick}
        />
      );

      await userEvent.click(screen.getByText('John Doe').closest('tr')!);
      expect(handleRowClick).toHaveBeenCalledWith(mockData[0]);
    });

    it('makes rows focusable when onRowClick is provided', () => {
      render(
        <Table
          columns={mockColumns}
          data={mockData}
          keyExtractor={keyExtractor}
          onRowClick={vi.fn()}
        />
      );

      const row = screen.getByText('John Doe').closest('tr');
      expect(row).toHaveAttribute('tabindex', '0');
    });

    it('calls onRowClick on Enter key', async () => {
      const handleRowClick = vi.fn();
      render(
        <Table
          columns={mockColumns}
          data={mockData}
          keyExtractor={keyExtractor}
          onRowClick={handleRowClick}
        />
      );

      const row = screen.getByText('John Doe').closest('tr')!;
      row.focus();
      await userEvent.keyboard('{Enter}');
      expect(handleRowClick).toHaveBeenCalledWith(mockData[0]);
    });

    it('adds hover styles when onRowClick is provided', () => {
      render(
        <Table
          columns={mockColumns}
          data={mockData}
          keyExtractor={keyExtractor}
          onRowClick={vi.fn()}
        />
      );

      const row = screen.getByText('John Doe').closest('tr');
      expect(row).toHaveClass('cursor-pointer');
      expect(row).toHaveClass('hover:bg-gray-50');
    });
  });

  describe('Styling', () => {
    it('applies default table styles', () => {
      render(
        <Table
          columns={mockColumns}
          data={mockData}
          keyExtractor={keyExtractor}
        />
      );
      const table = screen.getByRole('table');
      expect(table).toHaveClass('min-w-full');
    });

    it('applies custom className to wrapper', () => {
      render(
        <Table
          columns={mockColumns}
          data={mockData}
          keyExtractor={keyExtractor}
          className="custom-table"
        />
      );
      const wrapper = screen.getByRole('table').closest('div');
      expect(wrapper).toHaveClass('custom-table');
    });

    it('applies custom column className', () => {
      const columnsWithClass = [
        { key: 'id' as const, header: 'ID', className: 'custom-cell' },
      ];
      render(
        <Table
          columns={columnsWithClass}
          data={mockData}
          keyExtractor={keyExtractor}
        />
      );
      const cells = screen.getAllByRole('cell');
      expect(cells[0]).toHaveClass('custom-cell');
    });
  });

  describe('Accessibility', () => {
    it('has proper table structure', () => {
      render(
        <Table
          columns={mockColumns}
          data={mockData}
          keyExtractor={keyExtractor}
        />
      );
      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.getAllByRole('columnheader')).toHaveLength(3);
      expect(screen.getAllByRole('cell')).toHaveLength(6); // 2 rows x 3 columns
    });

    it('uses th for headers', () => {
      render(
        <Table
          columns={mockColumns}
          data={mockData}
          keyExtractor={keyExtractor}
        />
      );
      const headers = screen.getAllByRole('columnheader');
      headers.forEach(header => {
        expect(header.tagName).toBe('TH');
      });
    });

    it('headers have scope="col"', () => {
      render(
        <Table
          columns={mockColumns}
          data={mockData}
          keyExtractor={keyExtractor}
        />
      );
      const headers = screen.getAllByRole('columnheader');
      headers.forEach(header => {
        expect(header).toHaveAttribute('scope', 'col');
      });
    });

    it('rows have role="row"', () => {
      render(
        <Table
          columns={mockColumns}
          data={mockData}
          keyExtractor={keyExtractor}
        />
      );
      const rows = screen.getAllByRole('row');
      expect(rows.length).toBeGreaterThan(0);
    });

    it('cells have role="cell"', () => {
      render(
        <Table
          columns={mockColumns}
          data={mockData}
          keyExtractor={keyExtractor}
        />
      );
      const cells = screen.getAllByRole('cell');
      expect(cells.length).toBeGreaterThan(0);
    });
  });
});
