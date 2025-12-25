import React, { memo, ReactNode } from 'react';

interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (item: T, index: number) => ReactNode;
  className?: string;
  headerClassName?: string;
}

interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T, index: number) => string;
  emptyMessage?: string;
  loading?: boolean;
  onRowClick?: (item: T) => void;
  className?: string;
}

/**
 * Generic Table component with accessibility support.
 */
function Table<T extends Record<string, unknown>>({
  data,
  columns,
  keyExtractor,
  emptyMessage = 'No data available',
  loading = false,
  onRowClick,
  className = '',
}: TableProps<T>) {
  const getCellValue = (item: T, column: Column<T>): ReactNode => {
    if (column.render) {
      return column.render(item, data.indexOf(item));
    }
    const value = item[column.key as keyof T];
    return value !== null && value !== undefined ? String(value) : '';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="min-w-full divide-y divide-gray-200" role="table">
        <thead className="bg-gray-50">
          <tr role="row">
            {columns.map((column) => (
              <th
                key={String(column.key)}
                scope="col"
                role="columnheader"
                className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${column.headerClassName || ''}`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200" role="rowgroup">
          {data.length === 0 ? (
            <tr role="row">
              <td
                colSpan={columns.length}
                className="px-6 py-12 text-center text-gray-500"
                role="cell"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item, index) => (
              <tr
                key={keyExtractor(item, index)}
                role="row"
                onClick={() => onRowClick?.(item)}
                className={`${onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''} transition-colors`}
                tabIndex={onRowClick ? 0 : undefined}
                onKeyDown={(e) => {
                  if (onRowClick && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    onRowClick(item);
                  }
                }}
              >
                {columns.map((column) => (
                  <td
                    key={String(column.key)}
                    role="cell"
                    className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${column.className || ''}`}
                  >
                    {getCellValue(item, column)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default memo(Table) as typeof Table;
