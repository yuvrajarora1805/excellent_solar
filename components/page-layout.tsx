import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageLayoutProps {
  children: ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
}

const maxWidths = {
  sm: 'max-w-2xl',
  md: 'max-w-4xl',
  lg: 'max-w-6xl',
  xl: 'max-w-7xl',
  '2xl': 'max-w-[1400px]',
  full: 'max-w-full',
};

export function PageLayout({ children, className, maxWidth = '2xl' }: PageLayoutProps) {
  return (
    <div className={cn(
      'w-full mx-auto px-4 sm:px-6 lg:px-8 py-6',
      maxWidths[maxWidth],
      className
    )}>
      <div className="page-transition">
        {children}
      </div>
    </div>
  );
}

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  breadcrumbs?: Array<{ name: string; href: string }>;
}

export function PageHeader({ title, description, actions, breadcrumbs }: PageHeaderProps) {
  return (
    <div className="mb-6">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex mb-4" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2">
            {breadcrumbs.map((breadcrumb, index) => (
              <li key={breadcrumb.href} className="flex items-center">
                {index > 0 && (
                  <svg className="w-4 h-4 text-slate-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                )}
                <a
                  href={breadcrumb.href}
                  className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  {breadcrumb.name}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            {title}
          </h1>
          {description && (
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-3 shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

interface CardGridProps {
  children: ReactNode;
  className?: string;
  cols?: 1 | 2 | 3 | 4;
}

const gridCols = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 md:grid-cols-2',
  3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
};

export function CardGrid({ children, className, cols = 3 }: CardGridProps) {
  return (
    <div className={cn('grid gap-6', gridCols[cols], className)}>
      {children}
    </div>
  );
}

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: ReactNode;
  className?: string;
}

export function StatsCard({ title, value, description, trend, icon, className }: StatsCardProps) {
  const trendColors = {
    up: 'text-green-600',
    down: 'text-red-600',
    neutral: 'text-slate-600',
  };

  return (
    <div className={cn(
      'card-professional p-6',
      'hover:card-elevated transition-all duration-300',
      className
    )}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
            {title}
          </p>
          <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
            {value}
          </p>
          {description && (
            <p className={cn('mt-2 text-sm', trendColors[trend || 'neutral'])}>
              {description}
            </p>
          )}
        </div>
        {icon && (
          <div className="ml-4 flex-shrink-0">
            <div className="w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
              {icon}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
