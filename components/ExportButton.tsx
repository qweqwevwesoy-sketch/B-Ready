import { useState } from 'react';
import { useFilterHistory } from '@/lib/filter-history';
import { getMonthName } from '@/lib/statistics-utils';
import type { Report } from '@/types';

interface ExportButtonProps {
  currentMonth?: number;
  showAllMonths?: boolean;
  allReports: Report[];
  filteredReports: Report[];
}

export function ExportButton({ currentMonth, showAllMonths, allReports, filteredReports }: ExportButtonProps) {
  const { getCurrentState } = useFilterHistory();
  const [isExporting, setIsExporting] = useState(false);

  const currentState = getCurrentState();

  const getExportContext = () => {
    if (currentState?.monthIndex !== undefined) {
      return `Export ${getMonthName(currentState.monthIndex)} ${new Date().getFullYear()} Data`;
    }
    if (currentState?.showAllMonths) {
      return `Export All Data`;
    }
    return 'Export Data';
  };

  const handleExport = () => {
    setIsExporting(true);
    
    // Create CSV content
    const csvContent = [
      Object.keys(filteredReports[0] || {}).join(','),
      ...filteredReports.map(report => 
        Object.values(report)
          .map(value => {
            if (typeof value === 'string') {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          })
          .join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${getExportContext().replace(/\s+/g, '_')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    setIsExporting(false);
  };

  return (
    <button
      onClick={handleExport}
      disabled={isExporting}
      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isExporting ? 'Exporting...' : getExportContext()}
    </button>
  );
}