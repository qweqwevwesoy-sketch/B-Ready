'use client';

import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import { formatDateTime } from '@/lib/utils';
import type { Report } from '@/types';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend);

interface StatisticsProps {
  reports: Report[];
}

export function Statistics({ reports }: StatisticsProps) {
  // Calculate statistics
  const totalReports = reports.length;
  const currentReports = reports.filter(r => r.status === 'current').length;
  const rejectedReports = reports.filter(r => r.status === 'rejected').length;

  // Time-based statistics
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const thisWeek = new Date(today);
  thisWeek.setDate(thisWeek.getDate() - thisWeek.getDay());
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const thisYear = new Date(today.getFullYear(), 0, 1);

  const dailyReports = reports.filter(r => 
    new Date(r.timestamp) >= today
  ).length;
  const weeklyReports = reports.filter(r => 
    new Date(r.timestamp) >= thisWeek
  ).length;
  const monthlyReports = reports.filter(r => 
    new Date(r.timestamp) >= thisMonth
  ).length;
  const yearlyReports = reports.filter(r => 
    new Date(r.timestamp) >= thisYear
  ).length;

  // Category distribution
  const categoryCounts = reports.reduce((acc, report) => {
    if (report.category) {
      acc[report.category] = (acc[report.category] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  // Generate sentence summary
  const generateSummary = () => {
    const totalText = totalReports === 1 ? '1 report' : `${totalReports} reports`;
    const dailyText = dailyReports === 1 ? '1 report today' : `${dailyReports} reports today`;
    const weeklyText = weeklyReports === 1 ? '1 report this week' : `${weeklyReports} reports this week`;
    const monthlyText = monthlyReports === 1 ? '1 report this month' : `${monthlyReports} reports this month`;

    let summary = `There are ${totalText} in the system. In the last 24 hours, there were ${dailyText}. This week, we've received ${weeklyText}. This month, we've received ${monthlyText}. `;

    if (Object.keys(categoryCounts).length > 0) {
      const sortedCategories = Object.entries(categoryCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);

      const categoryText = sortedCategories.map(([category, count], index) => {
        const isLast = index === sortedCategories.length - 1;
        const prefix = index === 0 ? '' : isLast ? ' and ' : ', ';
        return `${prefix}${count} ${category.toLowerCase()}${count === 1 ? '' : 's'}`;
      }).join('');

      summary += `The most common emergency types are: ${categoryText}.`;
    }

    return summary;
  };

  // Chart data for trends
  const getTrendData = () => {
    const trendData = {
      labels: ['Today', 'This Week', 'This Month', 'This Year', 'Total'],
      datasets: [
        {
          label: 'Report Counts',
          data: [dailyReports, weeklyReports, monthlyReports, yearlyReports, totalReports],
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.1,
          fill: true
        }
      ]
    };

    return trendData;
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
        text: 'Report Trends Over Time'
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

  return (
    <div className="bg-white rounded-xl shadow-md p-6 mb-6">
      {/* Header */} 
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">📊 Dashboard Summary</h2>
        <div className="text-sm text-gray-500">
          Last updated: {formatDateTime(new Date().toISOString())}
        </div>
      </div>

      {/* Statistics Grid */} 
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 hover:shadow-lg transition-shadow">
          <div className="text-2xl font-bold text-blue-600">{totalReports}</div>
          <div className="text-sm text-blue-800">Total Reports</div>
          <div className="text-xs text-blue-400 mt-1">All time</div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 hover:shadow-lg transition-shadow">
          <div className="text-2xl font-bold text-purple-600">{dailyReports}</div>
          <div className="text-sm text-purple-800">Today</div>
          <div className="text-xs text-purple-400 mt-1">Last 24 hours</div>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 hover:shadow-lg transition-shadow">
          <div className="text-2xl font-bold text-orange-600">{weeklyReports}</div>
          <div className="text-sm text-orange-800">This Week</div>
          <div className="text-xs text-orange-400 mt-1">Last 7 days</div>
        </div>
      </div>

      {/* Trend Chart */} 
      <div className="h-64 mb-6">
        <Line data={getTrendData()} options={trendOptions} />
      </div>

      {/* Sentence Summary */} 
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4">
        <p className="text-gray-700 font-medium mb-2">Summary:</p>
        <p className="text-gray-600 text-sm leading-relaxed">
          {generateSummary()}
        </p>
      </div>
    </div>
  );
}
