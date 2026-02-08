import { useState } from 'react';
import { useFilterHistory } from '@/lib/filter-history';
import { getMonthName, generateEmptyStateData } from '@/lib/statistics-utils';

interface EmptyStateProps {
  monthIndex: number;
  currentYear: number;
  onFilterAdjacentMonths: () => void;
}

export function EmptyState({ monthIndex, currentYear, onFilterAdjacentMonths }: EmptyStateProps) {
  const { getCurrentState } = useFilterHistory();
  const [showDetails, setShowDetails] = useState(false);

  const emptyStateData = generateEmptyStateData(monthIndex, currentYear);
  const currentState = getCurrentState();

  const handleFilterAdjacentMonths = () => {
    onFilterAdjacentMonths();
    setShowDetails(false);
  };

  return (
    <div className="bg-gray-50 rounded-lg p-6 text-center">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        No reports in {emptyStateData.monthName} {currentYear}
      </h3>
      
      <div className="text-gray-600 mb-4">
        <p>This month had 0 reports, compared to:</p>
        <div className="mt-2 text-sm text-gray-500">
          <p>• Previous month: {emptyStateData.previousMonthReports} reports</p>
          <p>• Same month last year: {emptyStateData.sameMonthLastYear} reports</p>
          <p>• Monthly average: {emptyStateData.monthlyAverage} reports</p>
        </div>
      </div>

      <button
        onClick={handleFilterAdjacentMonths}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
      >
        Filter to see adjacent months
      </button>
    </div>
  );
}