'use client';

import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { formatDateTime } from '@/lib/utils';
import type { Report } from '@/types';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend);

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

  // Chart data for trends
const getTrendData = () => {
    const trendData = {
      labels: ['Today', 'This Week', 'This Month', 'This Quarter', 'This Year', 'Total'],
      datasets: [
        {
          label: 'Report Counts',
          data: [dailyReports, weeklyReports, reports.filter(r => new Date(r.timestamp) >= new Date(new Date().getFullYear(), new Date().getMonth(), 1)).length, reports.filter(r => new Date(r.timestamp) >= new Date(new Date().getFullYear(), Math.floor(new Date().getMonth() / 3) * 3, 1)).length, reports.filter(r => new Date(r.timestamp) >= new Date(new Date().getFullYear(), 0, 1)).length, totalReports],
          borderColor: 'rgb(255, 215, 0)',
          backgroundColor: 'rgba(255, 215, 0, 0.2)',
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

      {/* 2-Column Layout */} 
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
{/* Graph (Left Column) */} 
        <div className="bg-white rounded-lg shadow">
          <Line data={getTrendData()} options={trendOptions} />
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