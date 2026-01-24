'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useSocketContext } from '@/contexts/SocketContext';
import { Header } from '@/components/Header';
import { ReportCard } from '@/components/ReportCard';
import { EmergencyContactsAdmin } from '@/components/EmergencyContactsAdmin';
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

  const pendingReports = reports.filter((r) => r.status === 'pending');
  const currentReports = reports.filter((r) => r.status === 'current');
  const approvedReports = reports.filter((r) => r.status === 'approved');

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
              <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white p-4 text-center font-semibold">
                ⏳ Pending Reports
                <div className="text-sm opacity-90 mt-1">{pendingReports.length} reports</div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {pendingReports.length > 0 ? (
                  pendingReports.map((report) => (
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
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 text-center font-semibold">
                🔵 Current Reports
                <div className="text-sm opacity-90 mt-1">{currentReports.length} reports</div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {currentReports.length > 0 ? (
                  currentReports.map((report) => (
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
              <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 text-center font-semibold">
                ✅ Approved Reports
                <div className="text-sm opacity-90 mt-1">{approvedReports.length} reports</div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {approvedReports.length > 0 ? (
                  approvedReports.map((report) => (
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

        {/* Enhanced Notification System */}
        <div className="mt-8">
          <EnhancedNotificationSystem />
        </div>
      </main>
    </div>
  );
}
