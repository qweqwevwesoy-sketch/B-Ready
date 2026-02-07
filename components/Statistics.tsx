'use client';

import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, BarController, DoughnutController, PieController } from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { formatDateTime } from '@/lib/utils';
import type { Report } from '@/types';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, BarController, DoughnutController, PieController);

interface StatisticsProps {
  reports: Report[];
}

export function Statistics({ reports }: StatisticsProps) {
  // Calculate statistics
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

// Calculate category breakdown
  const categoryCounts = reports.reduce((acc, report) => {
    if (report.category) {
      acc[report.category] = (acc[report.category] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  // Calculate status breakdown
  const statusCounts = reports.reduce((acc, report) => {
    if (report.status) {
      acc[report.status] = (acc[report.status] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  // Calculate severity breakdown
  const severityCounts = reports.reduce((acc, report) => {
    if (report.severity) {
      acc[report.severity] = (acc[report.severity] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

// Calculate response time statistics
  const responseTimes = reports
    .filter(r => r.adminResponse)
    .map(r => Number(r.adminResponse!));

  const avgResponseTime = responseTimes.length > 0 
    ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
    : 0;

  // Generate detailed summary
const generateSummary = () => {
    const totalText = totalReports === 1 ? '1 report' : `${totalReports} reports`;
    const dailyText = dailyReports === 1 ? '1 report today' : `${dailyReports} reports today`;
    const weeklyText = weeklyReports === 1 ? '1 report this week' : `${weeklyReports} reports this week`;
    const monthlyText = monthlyReports === 1 ? '1 report this month' : `${monthlyReports} reports this month`;
    const yearlyText = yearlyReports === 1 ? '1 report this year' : `${yearlyReports} reports this year`;

    const topCategory = Object.keys(categoryCounts).reduce((a, b) => 
      categoryCounts[a] > categoryCounts[b] ? a : b, '');
    const topCategoryCount = categoryCounts[topCategory];

    const topStatus = Object.keys(statusCounts).reduce((a, b) => 
      statusCounts[a] > statusCounts[b] ? a : b, '');
    const topStatusCount = statusCounts[topStatus];

    const topSeverity = Object.keys(severityCounts).reduce((a, b) => 
      severityCounts[a] > severityCounts[b] ? a : b, '');
    const topSeverityCount = severityCounts[topSeverity];

    return `There are ${totalText} in the system. In the last 24 hours, there were ${dailyText}. This week, we've received ${weeklyText}. This month, we've received ${monthlyText}. This year, we've received ${yearlyText}. The most common category is "${topCategory}" with ${topCategoryCount} reports. The most common status is "${topStatus}" with ${topStatusCount} reports. The most common severity is "${topSeverity}" with ${topSeverityCount} reports. Average response time is ${avgResponseTime} minutes.`;
  };

  // Chart data for trends
const getTrendData = () => {
    const trendData = {
      labels: ['Today', 'This Week', 'This Month', 'This Quarter', 'This Year', 'Total'],
      datasets: [
        {
          label: 'Report Counts',
          data: [dailyReports, weeklyReports, monthlyReports, reports.filter(r => new Date(r.timestamp) >= new Date(new Date().getFullYear(), Math.floor(new Date().getMonth() / 3) * 3, 1)).length, yearlyReports, totalReports],
          borderColor: 'rgb(255, 215, 0)',
          backgroundColor: 'rgba(255, 215, 0, 0.2)',
          tension: 0.1,
          fill: true
        }
      ]
    };

    return trendData;
  };

  // Chart data for category breakdown
const getCategoryData = () => {
    const categories = Object.keys(categoryCounts);
    const data = categories.map(cat => categoryCounts[cat]);

    return {
      labels: categories,
      datasets: [{
        data,
        backgroundColor: [
          'rgb(255, 99, 132)',
          'rgb(54, 162, 235)',
          'rgb(255, 205, 86)',
          'rgb(75, 192, 192)',
          'rgb(153, 102, 255)',
          'rgb(201, 203, 207)'
        ],
        borderWidth: 1
      }]
    };
  };

  // Chart data for status breakdown
const getStatusData = () => {
    const statuses = Object.keys(statusCounts);
    const data = statuses.map(stat => statusCounts[stat]);

    return {
      labels: statuses,
      datasets: [{
        data,
        backgroundColor: [
          'rgb(75, 192, 192)',
          'rgb(255, 99, 132)',
          'rgb(54, 162, 235)',
          'rgb(255, 205, 86)'
        ],
        borderWidth: 1
      }]
    };
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

  const categoryOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      title: {
        display: true,
        text: 'Reports by Category'
      }
    }
  };

  const statusOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      title: {
        display: true,
        text: 'Reports by Status'
      }
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 mb-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">📊 Comprehensive Dashboard Summary</h2>
        <div className="text-sm text-gray-500">
          Last updated: {formatDateTime(new Date().toISOString())}
        </div>
      </div>

      {/* 3-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
{/* Trends Chart (Left Column) */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow">
          <Line data={getTrendData()} options={trendOptions} />
        </div>

{/* Quick Stats (Right Column) */}
        <div className="flex flex-col space-y-4">
          <div className="bg-blue-50 rounded-lg p-4 hover:shadow-lg transition-shadow">
            <div className="text-2xl font-bold text-blue-600">{totalReports}</div>
            <div className="text-sm text-blue-800">Total Reports</div>
            <div className="text-xs text-blue-400 mt-1">All time</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4 hover:shadow-lg transition-shadow">
            <div className="text-2xl font-bold text-green-600">{dailyReports}</div>
            <div className="text-sm text-green-800">Today</div>
            <div className="text-xs text-green-400 mt-1">Last 24 hours</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 hover:shadow-lg transition-shadow">
            <div className="text-2xl font-bold text-purple-600">{weeklyReports}</div>
            <div className="text-sm text-purple-800">This Week</div>
            <div className="text-xs text-purple-400 mt-1">Last 7 days</div>
          </div>
          <div className="bg-orange-50 rounded-lg p-4 hover:shadow-lg transition-shadow">
            <div className="text-2xl font-bold text-orange-600">{monthlyReports}</div>
            <div className="text-sm text-orange-800">This Month</div>
            <div className="text-xs text-orange-400 mt-1">Current month</div>
          </div>
          <div className="bg-red-50 rounded-lg p-4 hover:shadow-lg transition-shadow">
            <div className="text-2xl font-bold text-red-600">{yearlyReports}</div>
            <div className="text-sm text-red-800">This Year</div>
            <div className="text-xs text-red-400 mt-1">Current year</div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4 hover:shadow-lg transition-shadow">
            <div className="text-2xl font-bold text-yellow-600">{avgResponseTime}</div>
            <div className="text-sm text-yellow-800">Avg Response Time</div>
            <div className="text-xs text-yellow-400 mt-1">Minutes</div>
          </div>
        </div>
      </div>

      {/* 2-Column Layout for Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
{/* Category Breakdown Chart */}
        <div className="bg-white rounded-lg shadow">
          <Doughnut data={getCategoryData()} options={categoryOptions} />
        </div>

{/* Status Breakdown Chart */}
        <div className="bg-white rounded-lg shadow">
          <Doughnut data={getStatusData()} options={statusOptions} />
        </div>
      </div>

      {/* Dashboard Summary (Bottom) */}
      <div className="bg-gray-50 rounded-lg p-4">
        <p className="text-gray-700 font-medium mb-2">Detailed Summary:</p>
        <p className="text-gray-600 text-sm leading-relaxed">
          {generateSummary()}
        </p>
      </div>
    </div>
  );
}
