import { Report } from '@/types';

// Helper to get month name from month index (0-11)
export const getMonthName = (monthIndex: number): string => {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return monthNames[monthIndex];
};

// Group reports by month for the current year
export const groupReportsByMonth = (reports: Report[]): { [month: number]: Report[] } => {
  const currentYear = new Date().getFullYear();
  const grouped: { [month: number]: Report[] } = {};

  reports.forEach(report => {
    const reportDate = new Date(report.timestamp);
    if (reportDate.getFullYear() === currentYear) {
      const monthIndex = reportDate.getMonth();
      if (!grouped[monthIndex]) {
        grouped[monthIndex] = [];
      }
      grouped[monthIndex].push(report);
    }
  });

  return grouped;
};

// Calculate monthly statistics for enhanced tooltips
export const calculateMonthlyStatistics = (reports: Report[]): {
  total: number;
  dailyAverage: number;
  busiestDay: { date: string; count: number };
  reportTypes: { [type: string]: number };
  timeToResolution: number;
} => {
  if (reports.length === 0) {
    return {
      total: 0,
      dailyAverage: 0,
      busiestDay: { date: '', count: 0 },
      reportTypes: {},
      timeToResolution: 0
    };
  }

  const reportDates = reports.map(r => new Date(r.timestamp).toDateString());
  const dateCounts = reportDates.reduce((acc, date) => {
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {} as { [date: string]: number });

  const busiestDay = Object.entries(dateCounts).reduce((max, [date, count]) => 
    count > max.count ? { date, count } : max, { date: '', count: 0 }
  );

  const reportTypes = reports.reduce((acc, report) => {
    acc[report.type] = (acc[report.type] || 0) + 1;
    return acc;
  }, {} as { [type: string]: number });

  const timeToResolution = reports.reduce((sum, report) => {
    if (report.responseTimestamp) {
      const reportDate = new Date(report.timestamp).getTime();
      const responseDate = new Date(report.responseTimestamp).getTime();
      sum += (responseDate - reportDate) / (1000 * 60 * 60 * 24); // Convert to days
    }
    return sum;
  }, 0) / reports.length;

  return {
    total: reports.length,
    dailyAverage: reports.length / Object.keys(dateCounts).length,
    busiestDay: { date: busiestDay.date, count: busiestDay.count },
    reportTypes,
    timeToResolution: isNaN(timeToResolution) ? 0 : timeToResolution
  };
};

// Get year-over-year comparison data
export const getYearOverYearComparison = (currentYearReports: Report[]): {
  previousYearTotal: number;
  sameMonthLastYear: number;
  monthlyAverage: number;
} => {
  const currentYear = new Date().getFullYear();
  const previousYear = currentYear - 1;

  // This would typically come from a database query
  // For now, we'll return mock data for demonstration
  // In a real implementation, you'd fetch previous year data
  return {
    previousYearTotal: 45, // Mock data
    sameMonthLastYear: 12, // Mock data
    monthlyAverage: 4.2 // Mock data
  };
};

// Get visible months based on toggle state
export const getVisibleMonths = (currentMonth: number, showAll: boolean): number[] => {
  if (showAll) {
    return Array.from({ length: 12 }, (_, i) => i);
  }
  return Array.from({ length: currentMonth + 1 }, (_, i) => i);
};

// Generate empty state data for months with zero reports
export const generateEmptyStateData = (monthIndex: number, currentYear: number): {
  monthName: string;
  currentYear: number;
  previousMonthReports: number;
  sameMonthLastYear: number;
  monthlyAverage: number;
} => {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Mock data for demonstration
  const previousMonthReports = monthIndex === 0 ? 0 : 50; // Mock data
  const sameMonthLastYear = 12; // Mock data
  const monthlyAverage = 4.2; // Mock data

  return {
    monthName: monthNames[monthIndex],
    currentYear,
    previousMonthReports,
    sameMonthLastYear,
    monthlyAverage
  };
};