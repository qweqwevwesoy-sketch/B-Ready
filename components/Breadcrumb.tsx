import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFilterHistory } from '@/lib/filter-history';
import { getMonthName } from '@/lib/statistics-utils';

interface BreadcrumbProps {
  currentMonth?: number;
  showAllMonths?: boolean;
  onClearFilters?: () => void;
}

export function Breadcrumb({ currentMonth, showAllMonths, onClearFilters }: BreadcrumbProps) {
  const router = useRouter();
  const { getCurrentState } = useFilterHistory();
  const [hovered, setHovered] = useState(false);

  const currentState = getCurrentState();
  const hasFilters = currentState?.monthIndex !== undefined || currentState?.showAllMonths !== undefined;

  const getBreadcrumbPath = () => {
    const path: string[] = ['Dashboard'];
    
    if (hasFilters) {
      path.push('2024');
      
      if (currentMonth !== undefined) {
        path.push(getMonthName(currentMonth));
      } else if (showAllMonths) {
        path.push('All Months');
      }
    }

    return path;
  };

  const handleClearFilters = () => {
    onClearFilters?.();
    setHovered(false);
  };

  return (
    <div className="flex items-center space-x-2 text-sm text-gray-500">
      {getBreadcrumbPath().map((item, index) => (
        <span key={index}>
          <span className="text-gray-400">{index > 0 ? '>' : ''}</span>
          <span className="ml-1">{item}</span>
        </span>
      ))}
      
      {hasFilters && (
        <button
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onClick={handleClearFilters}
          className="ml-2 text-xs text-blue-600 hover:text-blue-800 transition-colors"
        >
          {hovered ? 'Clear Filters' : '(x)'}
        </button>
      )}
    </div>
  );
}