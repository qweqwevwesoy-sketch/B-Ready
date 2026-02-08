'use client';

import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { formatDateTime } from '@/lib/utils';
import type { Report } from '@/types';
import { useState } from 'react';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend);

interface StatisticsProps {
  reports: Report[];
}

type ZoomLevel = 'years' | 'months' | 'days' | 'hours';

interface ZoomContext {
  level: ZoomLevel;
  year?: number;
  month?: number;
  day?: number;
}

export function Statistics({ reports }: StatisticsProps) {
  const [zoomContext, setZoomContext] = useState<ZoomContext>({ level: 'years' });

  // Calculate statistics
  const totalReports = reports.length;
  const dailyReports = reports.filter(r => 
    new Date(r.timestamp) >= new Date(new Date().setHours(0, 0, 0, 0))
  ).length;
  const weeklyReports = reports.filter(r => 
    new Date(r.timestamp) >= new Date(new Date().setDate(new Date().getDate() - new Date().getDay()))
  ).length;

  // Generate sentence summary
  const generateSummary = () => {
    const totalText = totalReports === 1 ? '1 report' : `${totalReports} reports`;
    const dailyText = dailyReports === 1 ? '1 report today' : `${dailyReports} reports today`;
    const weeklyText = weeklyReports === 1 ? '1 report this week' : `${weeklyReports} reports this week`;
    const monthlyText = reports.filter(r => new Date(r.timestamp) >= new Date(new Date().getFullYear(), new Date().getMonth(), 1)).length;
    const monthlyReportsText = monthlyText === 1 ? '1 report this month' : `${monthlyText} reports this month`;
    const yearlyText = reports.filter(r => new Date(r.timestamp) >= new Date(new Date().getFullYear(), 0, 1)).length;
    const yearlyReportsText = yearlyText === 1 ? '1 report this year' : `${yearlyText} reports this year`;

    return `There are ${totalText} in the system. In the last 24 hours, there were ${dailyText}. This week, we've received ${weeklyText}. This month, we've received ${monthlyReportsText}. This year, we've received ${yearlyReportsText}.`;
  };

  // Helper function to get unique years from reports
  const getUniqueYears = () => {
    const years = new Set<number>();
    reports.forEach(report => {
      const year = new Date(report.timestamp).getFullYear();
      years.add(year);
    });
    return Array.from(years).sort((a, b) => a - b);
  };

  // Helper function to get reports for a specific year
  const getReportsForYear = (year: number) => {
    return reports.filter(report => new Date(report.timestamp).getFullYear() === year);
  };

  // Helper function to get reports for a specific year and month
  const getReportsForMonth = (year: number, month: number) => {
    return reports.filter(report => {
      const date = new Date(report.timestamp);
      return date.getFullYear() === year && date.getMonth() === month;
    });
  };

  // Helper function to get reports for a specific year, month, and day
  const getReportsForDay = (year: number, month: number, day: number) => {
    return reports.filter(report => {
      const date = new Date(report.timestamp);
      return date.getFullYear() === year && date.getMonth() === month && date.getDate() === day;
    });
  };

  // Calculate reports per year
  const getYearlyData = () => {
    const years = getUniqueYears();
    const data = years.map(year => {
      const yearReports = getReportsForYear(year);
      return yearReports.length;
    });

    return {
      labels: years.map(year => year.toString()),
      datasets: [
        {
          label: 'Report Counts',
          data,
          borderColor: 'rgb(255, 215, 0)',
          backgroundColor: 'rgba(255, 215, 0, 0.2)',
          tension: 0.1,
          fill: true
        }
      ]
    };
  };

  // Calculate reports per month for a specific year
  const getMonthlyData = (year: number) => {
    const months = Array.from({ length: 12 }, (_, i) => i);
    const data = months.map(month => {
      const monthReports = getReportsForMonth(year, month);
      return monthReports.length;
    });

    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    return {
      labels: monthNames,
      datasets: [
        {
          label: `Report Counts - ${year}`,
          data,
          borderColor: 'rgb(255, 215, 0)',
          backgroundColor: 'rgba(255, 215, 0, 0.2)',
          tension: 0.1,
          fill: true
        }
      ]
    };
  };

  // Calculate reports per day for a specific month
  const getDailyData = (year: number, month: number) => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const data = days.map(day => {
      const dayReports = getReportsForDay(year, month, day);
      return dayReports.length;
    });

    return {
      labels: days.map(day => day.toString()),
      datasets: [
        {
          label: `Report Counts - ${year}-${month + 1}`,
          data,
          borderColor: 'rgb(255, 215, 0)',
          backgroundColor: 'rgba(255, 215, 0, 0.2)',
          tension: 0.1,
          fill: true
        }
      ]
    };
  };

  // Calculate reports per hour for a specific day
  const getHourlyData = (year: number, month: number, day: number) => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const data = hours.map(hour => {
      const hourReports = getReportsForDay(year, month, day).filter(report => {
        const date = new Date(report.timestamp);
        return date.getHours() === hour;
      });
      return hourReports.length;
    });

    return {
      labels: hours.map(hour => `${hour.toString().padStart(2, '0')}:00`),
      datasets: [
        {
          label: `Report Counts - ${year}-${month + 1}-${day}`,
          data,
          borderColor: 'rgb(255, 215, 0)',
          backgroundColor: 'rgba(255, 215, 0, 0.2)',
          tension: 0.1,
          fill: true
        }
      ]
    };
  };

  // Get current chart data based on zoom level
  const getChartData = () => {
    switch (zoomContext.level) {
      case 'years':
        return getYearlyData();
      case 'months':
        return getMonthlyData(zoomContext.year!);
      case 'days':
        return getDailyData(zoomContext.year!, zoomContext.month!);
      case 'hours':
        return getHourlyData(zoomContext.year!, zoomContext.month!, zoomContext.day!);
      default:
        return getYearlyData();
    }
  };

  // Get chart title based on zoom level
  const getChartTitle = () => {
    switch (zoomContext.level) {
      case 'years':
        return 'Report Trends - Years';
      case 'months':
        return `Report Trends - ${zoomContext.year} (Months)`;
      case 'days':
        return `Report Trends - ${zoomContext.year}-${zoomContext.month! + 1} (Days)`;
      case 'hours':
        return `Report Trends - ${zoomContext.year}-${zoomContext.month! + 1}-${zoomContext.day!} (Hours)`;
      default:
        return 'Report Trends';
    }
  };

  // Handle chart click event for zooming
  const handleChartClick = (event: any, elements: any[]) => {
    if (elements.length > 0) {
      const index = elements[0].index;
      
      switch (zoomContext.level) {
        case 'years':
          const years = getUniqueYears();
          setZoomContext({
            level: 'months',
            year: years[index]
          });
          break;
        case 'months':
          setZoomContext({
            level: 'days',
            year: zoomContext.year!,
            month: index
          });
          break;
        case 'days':
          setZoomContext({
            level: 'hours',
            year: zoomContext.year!,
            month: zoomContext.month!,
            day: index + 1
          });
          break;
      }
    }
  };

  // Handle back button click
  const handleBack = () => {
    switch (zoomContext.level) {
      case 'months':
        setZoomContext({ level: 'years' });
        break;
      case 'days':
        setZoomContext({ level: 'months', year: zoomContext.year! });
        break;
      case 'hours':
        setZoomContext({ level: 'days', year: zoomContext.year!, month: zoomContext.month! });
        break;
    }
  };

  // Chart options
  const trendOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: getChartTitle()
      },
      tooltip: {
        callbacks: {
          title: function(context: any[]) {
            const label = context[0].label;
            switch (zoomContext.level) {
              case 'years':
                return `${label}`;
              case 'months':
                return `${label} ${zoomContext.year}`;
              case 'days':
                return `${label} ${zoomContext.month! + 1}/${zoomContext.year}`;
              case 'hours':
                return `${label}`;
              default:
                return label;
            }
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      }
    },
    onClick: handleChartClick
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 mb-6">
      {/* Header */} 
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">📊 Dashboard Summary</h2>
        <div className="text-sm text-gray-500">
          Last updated: {formatDateTime(new Date().toISOString())}
        </div>
      </div>

      {/* Zoom Controls */}
      <div className="mb-4 flex items-center gap-2">
        {zoomContext.level !== 'years' && (
          <button
            onClick={handleBack}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
          >
            ← Back
          </button>
        )}
        <span className="text-sm text-gray-600">
          Current View: {zoomContext.level.charAt(0).toUpperCase() + zoomContext.level.slice(1)}
        </span>
      </div>

      {/* 2-Column Layout */} 
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Graph (Left Column) */} 
        <div className="bg-white rounded-lg shadow">
          <Line data={getChartData()} options={trendOptions as any} />
        </div>

        {/* Statistics (Right Column) */} 
        <div className="flex flex-col space-y-4 lg:space-y-0 lg:flex-row lg:items-stretch">
          <div className="flex-1 bg-blue-50 rounded-lg p-4 hover:shadow-lg transition-shadow">
            <div className="text-2xl font-bold text-blue-600">{totalReports}</div>
            <div className="text-sm text-blue-800">Total Reports</div>
            <div className="text-xs text-blue-400 mt-1">All time</div>
          </div>
          <div className="flex-1 bg-blue-50 rounded-lg p-4 hover:shadow-lg transition-shadow">
            <div className="text-2xl font-bold text-blue-600">{dailyReports}</div>
            <div className="text-sm text-blue-800">Today</div>
            <div className="text-xs text-blue-400 mt-1">Last 24 hours</div>
          </div>
          <div className="flex-1 bg-blue-50 rounded-lg p-4 hover:shadow-lg transition-shadow">
            <div className="text-2xl font-bold text-blue-600">{weeklyReports}</div>
            <div className="text-sm text-blue-800">This Week</div>
            <div className="text-xs text-blue-400 mt-1">Last 7 days</div>
          </div>
        </div>
      </div>

      {/* Dashboard Summary (Bottom) */} 
      <div className="bg-gray-50 rounded-lg p-4">
        <p className="text-gray-700 font-medium mb-2">Summary:</p>
        <p className="text-gray-600 text-sm leading-relaxed">
          {generateSummary()}
        </p>
      </div>
    </div>
  );
}