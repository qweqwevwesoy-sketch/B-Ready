'use client';

import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, TooltipItem } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { formatDateTime } from '@/lib/utils';
import type { Report } from '@/types';
import { 
  getMonthName, 
  groupReportsByMonth, 
  calculateMonthlyStatistics, 
  getYearOverYearComparison, 
  getVisibleMonths,
  generateEmptyStateData 
} from '@/lib/statistics-utils';
import { 
  handleMonthClick, 
  handleMonthRightClick, 
  handleMonthHover,
  getEnhancedTooltipConfig,
  getComparisonLineConfig,
  getToggleConfig,
  getEmptyStateConfig 
} from '@/lib/chart-interactions';
import { useFilterHistory } from '@/lib/filter-history';
import { Breadcrumb } from './Breadcrumb';
import { EmptyState } from './EmptyState';
import { ExportButton } from './ExportButton';
import { useState, useEffect } from 'react';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend);

interface StatisticsProps {
  reports: Report[];
}

export function Statistics({ reports }: StatisticsProps) {
  const [filteredReports, setFilteredReports] = useState<Report[]>(reports);
  const [showAllMonths, setShowAllMonths] = useState(true);
  const [hoveredMonth, setHoveredMonth] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [comparisonMode, setComparisonMode] = useState(false);

  const { addFilterState, undoFilter, redoFilter, canUndo, canRedo } = useFilterHistory();

  // Calculate summary statistics
  const totalReports = reports.length;
  const dailyReports = reports.filter(r => 
    new Date(r.timestamp) >= new Date(new Date().setHours(0, 0, 0, 0))
  ).length;
  const weeklyReports = reports.filter(r => 
    new Date(r.timestamp) >= new Date(new Date().setDate(new Date().getDate() - new Date().getDay()))
  ).length;
  const monthlyReports = reports.filter(r => 
    new Date(r.timestamp) >= new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  ).length;
  const yearlyReports = reports.filter(r => 
    new Date(r.timestamp) >= new Date(new Date().getFullYear(), 0, 1)
  ).length;

  // Group reports by month for the current year
  const currentYear = new Date().getFullYear();
  const monthlyGrouped = groupReportsByMonth(reports);
  const visibleMonths = getVisibleMonths(new Date().getMonth(), showAllMonths);

  // Generate monthly data for chart
  const getMonthlyData = () => {
    const currentYearData = visibleMonths.map(monthIndex => 
      monthlyGrouped[monthIndex]?.length || 0
    );

    const comparisonData = getComparisonLineConfig(reports);

    return {
      labels: visibleMonths.map(monthIndex => getMonthName(monthIndex)),
      datasets: [
        {
          label: `${currentYear} Reports`,
          data: currentYearData,
          borderColor: 'rgb(255, 215, 0)',
          backgroundColor: 'rgba(255, 215, 0, 0.2)',
          tension: 0.1,
          fill: true,
          pointBackgroundColor: hoveredMonth !== null && hoveredMonth >= 0 ? 
            hoveredMonth === selectedMonth ? 'rgb(255, 165, 0)' : 'rgb(255, 215, 0)' : 
            selectedMonth !== null && selectedMonth >= 0 ? 'rgb(255, 165, 0)' : 'rgb(255, 215, 0)',
          pointBorderColor: 'rgb(255, 215, 0)',
          pointRadius: hoveredMonth !== null && hoveredMonth >= 0 ? 8 : 
                       selectedMonth !== null && selectedMonth >= 0 ? 6 : 4,
          pointHoverRadius: 10,
          pointHitRadius: 15
        },
        comparisonData
      ]
    };
  };

  // Enhanced tooltip configuration
  const tooltipConfig = getEnhancedTooltipConfig();

  // Chart options with interactive features
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: `Report Trends (${showAllMonths ? 'All Months' : 'Year to Date'})`
      },
      tooltip: {
        ...tooltipConfig,
        enabled: true,
        mode: 'index' as const,
        intersect: false,
        callbacks: {
          ...tooltipConfig.callbacks,
          afterLabel: function(context: TooltipItem<'line'>) {
            const monthIndex = context.dataIndex;
            const stats = calculateMonthlyStatistics(monthlyGrouped[monthIndex] || []);
            return [
              `Daily Avg: ${stats.dailyAverage.toFixed(1)}`,
              `Busiest: ${stats.busiestDay.date} (${stats.busiestDay.count})`,
              `Types: ${Object.keys(stats.reportTypes).join(', ')}`
            ];
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
    }
  };

  // Handle chart interactions
  const handleChartClick = (event: any, activeElements: any[]) => {
    if (activeElements.length > 0) {
      const monthIndex = activeElements[0].dataIndex;
      handleMonthClick(monthIndex, reports, setFilteredReports);
      addFilterState(filteredReports, monthIndex);
      setSelectedMonth(monthIndex);
    }
  };

  const handleChartHover = (event: any, activeElements: any[]) => {
    if (activeElements.length > 0) {
      const monthIndex = activeElements[0].dataIndex;
      setHoveredMonth(monthIndex);
    } else {
      setHoveredMonth(null);
    }
  };

  const handleChartRightClick = (event: any, activeElements: any[]) => {
    if (activeElements.length > 0) {
      const monthIndex = activeElements[0].dataIndex;
      const stats = handleMonthRightClick(monthIndex, reports);
      // In a real implementation, you'd show a modal with these stats
      console.log('Month Statistics:', stats);
    }
  };

  // Generate summary table
  const generateSummaryTable = () => {
    return (
      <div className="bg-white rounded-lg shadow">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left p-3">Time Period</th>
              <th className="text-right p-3">Number of Reports</th>
            </tr>
          </thead>
          <tbody>
            <tr className="hover:bg-gray-50 cursor-pointer" 
                onClick={() => handleMonthClick(new Date().getMonth(), reports, setFilteredReports)}>
              <td className="p-3">Last 24 Hours</td>
              <td className="text-right p-3 font-semibold text-blue-600">{dailyReports}</td>
            </tr>
            <tr className="hover:bg-gray-50 cursor-pointer" 
                onClick={() => handleMonthClick(new Date().getMonth() - new Date().getDay(), reports, setFilteredReports)}>
              <td className="p-3">This Week</td>
              <td className="text-right p-3 font-semibold text-blue-600">{weeklyReports}</td>
            </tr>
            <tr className="hover:bg-gray-50 cursor-pointer" 
                onClick={() => handleMonthClick(new Date().getMonth(), reports, setFilteredReports)}>
              <td className="p-3">This Month</td>
              <td className="text-right p-3 font-semibold text-blue-600">{monthlyReports}</td>
            </tr>
            <tr className="hover:bg-gray-50 cursor-pointer" 
                onClick={() => handleMonthClick(0, reports, setFilteredReports)}>
              <td className="p-3">This Year</td>
              <td className="text-right p-3 font-semibold text-blue-600">{yearlyReports}</td>
            </tr>
            <tr className="border-t">
              <td className="p-3 font-semibold">Total in System</td>
              <td className="text-right p-3 font-bold text-blue-600">{totalReports}</td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  // Generate chart with empty state handling
  const renderChart = () => {
    if (selectedMonth !== null && selectedMonth >= 0) {
      const monthReports = monthlyGrouped[selectedMonth] || [];
      if (monthReports.length === 0) {
        return (
          <EmptyState 
            monthIndex={selectedMonth} 
            currentYear={currentYear}
            onFilterAdjacentMonths={() => {
              // Filter to show adjacent months with data
              const adjacentReports = reports.filter(report => {
                const date = new Date(report.timestamp);
                const month = date.getMonth();
                return month >= selectedMonth - 1 && month <= selectedMonth + 1;
              });
              setFilteredReports(adjacentReports);
              addFilterState(adjacentReports);
            }}
          />
        );
      }
    }

    return (
      <Line
        data={getMonthlyData()}
        options={chartOptions}
        onElementsClick={handleChartClick}
        onHover={handleChartHover}
      />
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 mb-6">
      {/* Header */} 
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">📊 Dashboard Summary</h2>
          <Breadcrumb 
            currentMonth={selectedMonth}
            showAllMonths={showAllMonths}
            onClearFilters={() => {
              setFilteredReports(reports);
              setSelectedMonth(null);
              setShowAllMonths(true);
              addFilterState(reports);
            }}
          />
        </div>
        <div className="text-sm text-gray-500">
          Last updated: {formatDateTime(new Date().toISOString())}
        </div>
      </div>

      {/* Main Content */} 
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Summary Table (Left) */} 
        <div className="lg:col-span-1">
          {generateSummaryTable()}
        </div>

        {/* Chart (Center) */} 
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow">
            {renderChart()}
          </div>
        </div>
      </div>

      {/* Controls (Bottom) */} 
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-center">
        {/* Toggle */} 
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowAllMonths(true)}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              showAllMonths ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            All Months
          </button>
          <button
            onClick={() => setShowAllMonths(false)}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              !showAllMonths ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            Year to Date
          </button>
          <button
            onClick={() => setComparisonMode(!comparisonMode)}
            className="px-4 py-2 rounded-md font-medium transition-colors"
          >
            Comparison Mode
          </button>
        </div>

        {/* Export Button */} 
        <ExportButton 
          currentMonth={selectedMonth}
          showAllMonths={showAllMonths}
          allReports={reports}
          filteredReports={filteredReports}
        />

        {/* Undo/Redo */} 
        <div className="flex items-center space-x-2">
          <button
            onClick={undoFilter}
            disabled={!canUndo()}
            className="px-3 py-1 text-xs rounded-md transition-colors"
          >
            Undo
          </button>
          <button
            onClick={redoFilter}
            disabled={!canRedo()}
            className="px-3 py-1 text-xs rounded-md transition-colors"
          >
            Redo
          </button>
        </div>
      </div>
    </div>
  );
}