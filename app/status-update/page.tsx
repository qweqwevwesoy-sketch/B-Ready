'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useSocketContext } from '@/contexts/SocketContext';
import { Header } from '@/components/Header';
import { ReportCard } from '@/components/ReportCard';
import { ColumnSearch } from '@/components/ColumnSearch';
import { EnhancedNotificationSystem } from '@/components/EnhancedNotificationSystem';
import { notificationManager } from '@/components/NotificationManager';

export default function StatusUpdatePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { reports, updateReport, socket, connected } = useSocketContext();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (user && user.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  // Authenticate with socket connection (same as Dashboard)
  useEffect(() => {
    if (socket && connected && user) {
      socket.emit('authenticate', {
        email: user.email,
        userId: user.uid,
        role: user.role,
      });
    }
  }, [socket, connected, user]);

  const handleStatusChange = (reportId: string, status: string) => {
    updateReport(reportId, status, `Status changed to ${status}`);
    notificationManager.success(`Report status updated to ${status}`);
  };

  const handleOpenReportChat = (reportId: string) => {
    if (reportId.startsWith('temp_')) {
      notificationManager.warning('Report is still being submitted...');
      return;
    }

    const report = reports.find((r) => r.id === reportId);
    if (!report) {
      notificationManager.error('Report not found');
      return;
    }

    // For admin users, they can open any report chat
    router.push(`/dashboard?chat=${reportId}`);
  };

  // Search states for each column
  const [pendingSearchQuery, setPendingSearchQuery] = useState('');
  const [pendingIsDateSearch, setPendingIsDateSearch] = useState(false);
  const [pendingDateRange, setPendingDateRange] = useState<{ start: Date | null; end: Date | null }>({ start: null, end: null });

  const [currentSearchQuery, setCurrentSearchQuery] = useState('');
  const [currentIsDateSearch, setCurrentIsDateSearch] = useState(false);
  const [currentDateRange, setCurrentDateRange] = useState<{ start: Date | null; end: Date | null }>({ start: null, end: null });

  const [approvedSearchQuery, setApprovedSearchQuery] = useState('');
  const [approvedIsDateSearch, setApprovedIsDateSearch] = useState(false);
  const [approvedDateRange, setApprovedDateRange] = useState<{ start: Date | null; end: Date | null }>({ start: null, end: null });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <img
            src="/BLogo.png"
            alt="B-READY Logo"
            className="w-16 h-16 mx-auto mb-4 animate-pulse"
          />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') return null;

  // Filtered reports based on search
  const pendingReports = reports.filter((r) => r.status === 'pending');
  const filteredPendingReports = pendingSearchQuery || pendingIsDateSearch 
    ? pendingReports.filter(report => filterReports(report, pendingSearchQuery, pendingIsDateSearch, pendingDateRange))
    : pendingReports;

  const currentReports = reports.filter((r) => r.status === 'current');
  const filteredCurrentReports = currentSearchQuery || currentIsDateSearch
    ? currentReports.filter(report => filterReports(report, currentSearchQuery, currentIsDateSearch, currentDateRange))
    : currentReports;

  const approvedReports = reports.filter((r) => r.status === 'approved');
  const filteredApprovedReports = approvedSearchQuery || approvedIsDateSearch
    ? approvedReports.filter(report => filterReports(report, approvedSearchQuery, approvedIsDateSearch, approvedDateRange))
    : approvedReports;

  // Filter function
  const filterReports = (report: any, query: string, isDateSearch: boolean, dateRange: { start: Date | null; end: Date | null }) => {
    if (isDateSearch) {
      const reportDate = new Date(report.timestamp);
      if (dateRange.start && dateRange.end) {
        return reportDate >= dateRange.start && reportDate <= dateRange.end;
      } else if (dateRange.start) {
        return reportDate >= dateRange.start;
      } else if (dateRange.end) {
        return reportDate <= dateRange.end;
      }
      return true;
    } else if (query.trim()) {
      const searchLower = query.toLowerCase();
      return (
        (report.type && report.type.toLowerCase().includes(searchLower)) ||
        (report.category && report.category.toLowerCase().includes(searchLower)) ||
        (report.userName && report.userName.toLowerCase().includes(searchLower)) ||
        (report.address && report.address.toLowerCase().includes(searchLower)) ||
        (report.description && report.description.toLowerCase().includes(searchLower))
      );
    }
    return true;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white/95 backdrop-blur-lg rounded-2xl p-8 shadow-xl">
          <h1 className="text-3xl font-bold mb-4">Status Update</h1>
          <p className="text-gray-600 mb-8">Manage and update report statuses.</p>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Pending Reports */}
            <div className="bg-gray-50 rounded-xl overflow-hidden border border-gray-200 flex flex-col h-[70vh]">
              <div className="bg-gradient-to-r from-custom-yellow-500 to-custom-yellow-600 text-white p-4 text-center font-semibold">
                ⏳ Pending Reports
                <div className="text-sm opacity-90 mt-1">
                  {filteredPendingReports.length} of {pendingReports.length} reports
                </div>
              </div>
              <ColumnSearch
                placeholder="Search pending reports..."
                onSearch={(query, isDateSearch, dateRange) => {
                  setPendingSearchQuery(query);
                  setPendingIsDateSearch(isDateSearch);
                  if (dateRange) setPendingDateRange(dateRange);
                }}
                onClear={() => {
                  setPendingSearchQuery('');
                  setPendingIsDateSearch(false);
                  setPendingDateRange({ start: null, end: null });
                }}
              />
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {filteredPendingReports.length > 0 ? (
                  filteredPendingReports.map((report) => (
                    <div key={report.id} className="bg-white rounded-lg p-4 shadow-md">
                      <ReportCard
                        report={report}
                        onOpenChat={handleOpenReportChat}
                        canOpenChat={true}
                      />
                      <div className="mt-4 space-y-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name={`status_${report.id}`}
                            checked={report.status === 'pending'}
                            onChange={() => handleStatusChange(report.id, 'pending')}
                            className="accent-primary"
                          />
                          <span className="text-sm font-semibold text-yellow-700">Pending</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name={`status_${report.id}`}
                            checked={report.status === 'current'}
                            onChange={() => handleStatusChange(report.id, 'current')}
                            className="accent-primary"
                          />
                          <span className="text-sm font-semibold text-blue-700">Current</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name={`status_${report.id}`}
                            checked={report.status === 'approved'}
                            onChange={() => handleStatusChange(report.id, 'approved')}
                            className="accent-primary"
                          />
                          <span className="text-sm font-semibold text-green-700">Approved</span>
                        </label>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <p>No pending reports</p>
                  </div>
                )}
              </div>
            </div>

            {/* Current Reports */}
            <div className="bg-gray-50 rounded-xl overflow-hidden border border-gray-200 flex flex-col h-[70vh]">
              <div className="bg-gradient-to-r from-custom-yellow-500 to-custom-yellow-600 text-white p-4 text-center font-semibold">
                🔵 Current Reports
                <div className="text-sm opacity-90 mt-1">
                  {filteredCurrentReports.length} of {currentReports.length} reports
                </div>
              </div>
              <ColumnSearch
                placeholder="Search current reports..."
                onSearch={(query, isDateSearch, dateRange) => {
                  setCurrentSearchQuery(query);
                  setCurrentIsDateSearch(isDateSearch);
                  if (dateRange) setCurrentDateRange(dateRange);
                }}
                onClear={() => {
                  setCurrentSearchQuery('');
                  setCurrentIsDateSearch(false);
                  setCurrentDateRange({ start: null, end: null });
                }}
              />
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {filteredCurrentReports.length > 0 ? (
                  filteredCurrentReports.map((report) => (
                    <div key={report.id} className="bg-white rounded-lg p-4 shadow-md">
                      <ReportCard
                        report={report}
                        onOpenChat={handleOpenReportChat}
                        canOpenChat={true}
                      />
                      <div className="mt-4 space-y-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name={`status_${report.id}`}
                            checked={report.status === 'pending'}
                            onChange={() => handleStatusChange(report.id, 'pending')}
                            className="accent-primary"
                          />
                          <span className="text-sm font-semibold text-yellow-700">Pending</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name={`status_${report.id}`}
                            checked={report.status === 'current'}
                            onChange={() => handleStatusChange(report.id, 'current')}
                            className="accent-primary"
                          />
                          <span className="text-sm font-semibold text-blue-700">Current</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name={`status_${report.id}`}
                            checked={report.status === 'approved'}
                            onChange={() => handleStatusChange(report.id, 'approved')}
                            className="accent-primary"
                          />
                          <span className="text-sm font-semibold text-green-700">Approved</span>
                        </label>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <p>No current reports</p>
                  </div>
                )}
              </div>
            </div>

            {/* Approved Reports */}
            <div className="bg-gray-50 rounded-xl overflow-hidden border border-gray-200 flex flex-col h-[70vh]">
              <div className="bg-gradient-to-r from-custom-yellow-500 to-custom-yellow-600 text-white p-4 text-center font-semibold">
                ✅ Approved Reports
                <div className="text-sm opacity-90 mt-1">
                  {filteredApprovedReports.length} of {approvedReports.length} reports
                </div>
              </div>
              <ColumnSearch
                placeholder="Search approved reports..."
                onSearch={(query, isDateSearch, dateRange) => {
                  setApprovedSearchQuery(query);
                  setApprovedIsDateSearch(isDateSearch);
                  if (dateRange) setApprovedDateRange(dateRange);
                }}
                onClear={() => {
                  setApprovedSearchQuery('');
                  setApprovedIsDateSearch(false);
                  setApprovedDateRange({ start: null, end: null });
                }}
              />
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {filteredApprovedReports.length > 0 ? (
                  filteredApprovedReports.map((report) => (
                    <div key={report.id} className="bg-white rounded-lg p-4 shadow-md">
                      <ReportCard
                        report={report}
                        onOpenChat={handleOpenReportChat}
                        canOpenChat={true}
                      />
                      <div className="mt-4 space-y-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name={`status_${report.id}`}
                            checked={report.status === 'pending'}
                            onChange={() => handleStatusChange(report.id, 'pending')}
                            className="accent-primary"
                          />
                          <span className="text-sm font-semibold text-yellow-700">Pending</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name={`status_${report.id}`}
                            checked={report.status === 'current'}
                            onChange={() => handleStatusChange(report.id, 'current')}
                            className="accent-primary"
                          />
                          <span className="text-sm font-semibold text-blue-700">Current</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name={`status_${report.id}`}
                            checked={report.status === 'approved'}
                            onChange={() => handleStatusChange(report.id, 'approved')}
                            className="accent-primary"
                          />
                          <span className="text-sm font-semibold text-green-700">Approved</span>
                        </label>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <p>No approved reports</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-8">
            <button
              onClick={() => router.push('/dashboard')}
              className="px-6 py-3 bg-gradient-to-r from-primary to-primary-dark text-white rounded-lg font-semibold hover:opacity-90"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>


      </main>
    </div>
  );
}
