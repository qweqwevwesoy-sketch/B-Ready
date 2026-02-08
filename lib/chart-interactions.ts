import { Chart, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, TooltipItem } from 'chart.js';
import { getMonthName, groupReportsByMonth, calculateMonthlyStatistics, getYearOverYearComparison, getVisibleMonths, generateEmptyStateData } from '@/lib/statistics-utils';
import type { Report } from '@/types';

Chart.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend);

// Chart interaction handlers
export const handleMonthClick = (monthIndex: number, reports: Report[], setFilteredReports: (reports: Report[]) => void) => {
  const currentYear = new Date().getFullYear();
  const reportDate = new Date(reports[0].timestamp);
  const reportYear = reportDate.getFullYear();

  // Filter reports for the selected month
  const filtered = reports.filter(report => {
    const date = new Date(report.timestamp);
    return date.getFullYear() === reportYear && date.getMonth() === monthIndex;
  });

  setFilteredReports(filtered);
};

export const handleMonthRightClick = (monthIndex: number, reports: Report[]) => {
  const currentYear = new Date().getFullYear();
  const monthReports = reports.filter(report => {
    const date = new Date(report.timestamp);
    return date.getFullYear() === currentYear && date.getMonth() === monthIndex;
  });

  return calculateMonthlyStatistics(monthReports);
};

export const handleMonthHover = (monthIndex: number, reports: Report[]) => {
  const currentYear = new Date().getFullYear();
  const monthReports = reports.filter(report => {
    const date = new Date(report.timestamp);
    return date.getFullYear() === currentYear && date.getMonth() === monthIndex;
  });

  const stats = calculateMonthlyStatistics(monthReports);
  const monthName = getMonthName(monthIndex);

  return {
    month: monthName,
    total: stats.total,
    dailyAverage: stats.dailyAverage.toFixed(1),
    busiestDay: stats.busiestDay.date,
    reportTypes: stats.reportTypes,
    timeToResolution: stats.timeToResolution.toFixed(1)
  };
};

// Enhanced tooltip configuration
export const getEnhancedTooltipConfig = () => {
  return {
    callbacks: {
      title: function(context: TooltipItem<'bar'>[]) {
        const monthIndex = context[0].dataIndex;
        return getMonthName(monthIndex);
      },
      label: function(context: TooltipItem<'bar'>) {
        const monthIndex = context.dataIndex;
        const value = context.parsed.y;
        return `${value} reports`;
      }
    }
  };
};

// Year-over-year comparison line configuration
export const getComparisonLineConfig = (currentYearReports: Report[]) => {
  const comparisonData = getYearOverYearComparison(currentYearReports);
  const currentYear = new Date().getFullYear();

  return {
    label: `${currentYear - 1} Data`,
    data: Array(12).fill(comparisonData.monthlyAverage),
    borderColor: 'rgba(150, 150, 150, 0.6)',
    borderWidth: 2,
    borderDash: [5, 5],
    pointRadius: 0,
    fill: false
  };
};

// Toggle functionality configuration
export const getToggleConfig = (currentMonth: number, showAll: boolean) => {
  const visibleMonths = getVisibleMonths(currentMonth, showAll);
  return {
    getLabels: () => visibleMonths.map(monthIndex => getMonthName(monthIndex)),
    filterData: (data: number[]) => visibleMonths.map(monthIndex => data[monthIndex])
  };
};

// Empty state configuration
export const getEmptyStateConfig = (monthIndex: number, currentYear: number) => {
  const emptyStateData = generateEmptyStateData(monthIndex, currentYear);
  return {
    title: `No reports in ${emptyStateData.monthName} ${currentYear}`,
    description: `
      This month had 0 reports, compared to:
      • Previous month: ${emptyStateData.previousMonthReports} reports
      • Same month last year: ${emptyStateData.sameMonthLastYear} reports
      • Monthly average: ${emptyStateData.monthlyAverage} reports
    `,
    action: 'Filter to see adjacent months'
  };
};