import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface DataTableProps {
  columns: Array<{
    key: string;
    title: string;
    className?: string;
    render?: (value: any, row: any) => ReactNode;
  }>;
  data: any[];
  isLoading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: any) => void;
  className?: string;
}

export function DataTable({
  columns,
  data,
  isLoading = false,
  emptyMessage = 'No data available',
  onRowClick,
  className,
}: DataTableProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <svg className="w-12 h-12 text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-slate-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-700">
            {columns.map((column) => (
              <th
                key={column.key}
                className={cn(
                  'px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider',
                  column.className
                )}
              >
                {column.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
          {Array.isArray(data) && data.length > 0 ? (
            data.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                onClick={() => onRowClick?.(row)}
                className={cn(
                  'hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors',
                  onRowClick && 'cursor-pointer'
                )}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={cn('px-4 py-3 text-sm text-slate-700 dark:text-slate-300', column.className)}
                  >
                    {column.render ? column.render(row[column.key], row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                No data available.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

interface StatusBadgeProps {
  status: string;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  className?: string;
}

export function StatusBadge({ status, variant, className }: StatusBadgeProps) {
  const variants = {
    default: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300',
    success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    error: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  };

  // Auto-detect variant based on status
  const autoVariant = () => {
    const s = status.toLowerCase();
    if (['completed', 'active', 'approved', 'paid', 'verified', 'installed', 'available'].includes(s)) {
      return 'success';
    }
    if (['pending', 'draft', 'requested', 'scheduled'].includes(s)) {
      return 'warning';
    }
    if (['cancelled', 'rejected', 'failed', 'expired', 'damaged'].includes(s)) {
      return 'error';
    }
    return 'default';
  };

  const badgeVariant = variant || autoVariant();

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        variants[badgeVariant],
        className
      )}
    >
      {status}
    </span>
  );
}
