'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { offlineService } from '@/lib/offline-service';
import type { Report } from '@/types';

interface OfflineReport extends Report {
  synced?: boolean;
}

export default function OfflineStatusPage() {
  const router = useRouter();
  const [reports, setReports] = useState<OfflineReport[]>([]);
  const [isOnline, setIsOnline] = useState(() => typeof window !== 'undefined' ? navigator.onLine : true);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'completed' | 'failed'>('idle');

  const loadOfflineReports = useCallback(async () => {
    try {
      const offlineReports = await offlineService.getReports();
      setReports(offlineReports as OfflineReport[]);
    } catch (error) {
      console.error('Failed to load offline reports:', error);
    }
  }, []);

  const syncOfflineReports = useCallback(async () => {
    if (!isOnline) return;

    setSyncStatus('syncing');
    try {
      // Get unsynced reports and messages
      const unsyncedReports = reports.filter(r => !r.synced);
      const unsyncedMessages: Record<string, unknown>[] = []; // Would need to implement message fetching

      if (unsyncedReports.length > 0) {
        const result = await offlineService.syncDataToFirebase(unsyncedReports, unsyncedMessages);
        if (result.success) {
          setSyncStatus('completed');
          // Reload reports to show updated sync status
          loadOfflineReports();
        } else {
          setSyncStatus('failed');
        }
      } else {
        setSyncStatus('completed');
      }
    } catch (error) {
      console.error('Sync failed:', error);
      setSyncStatus('failed');
    }
  }, [isOnline, reports, loadOfflineReports]);

  useEffect(() => {
    // Load offline reports
    // eslint-disable-next-line react-hooks/exhaustive-deps
    loadOfflineReports();

    // Listen for connectivity changes
    const handleOnline = () => {
      setIsOnline(true);
      // Auto-sync when coming back online
      syncOfflineReports();
    };

    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [loadOfflineReports, syncOfflineReports]);

  const getSyncStatusMessage = () => {
    switch (syncStatus) {
      case 'syncing':
        return '🔄 Syncing your reports to the main system...';
      case 'completed':
        return '✅ All reports synced successfully!';
      case 'failed':
        return '❌ Sync failed. Will retry when online.';
      default:
        return '';
    }
  };

  const pendingReports = reports.filter(r => r.status === 'pending');
  const syncedReports = reports.filter(r => r.synced);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-4 shadow-lg">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">📊 B-READY Report Status</h1>
            <p className="text-blue-100 text-sm">Track your emergency reports</p>
          </div>
          <div className="text-right">
            <div className={`text-sm px-3 py-1 rounded-full ${
              isOnline ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {isOnline ? '🟢 Online' : '🔴 Offline'}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6">
        {/* Sync Status Banner */}
        {isOnline && syncStatus !== 'idle' && (
          <div className={`mb-6 p-4 rounded-lg border ${
            syncStatus === 'completed' ? 'bg-green-50 border-green-200' :
            syncStatus === 'failed' ? 'bg-red-50 border-red-200' :
            'bg-blue-50 border-blue-200'
          }`}>
            <p className={`text-sm ${
              syncStatus === 'completed' ? 'text-green-800' :
              syncStatus === 'failed' ? 'text-red-800' :
              'text-blue-800'
            }`}>
              {getSyncStatusMessage()}
            </p>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-blue-600">{reports.length}</div>
            <div className="text-gray-600">Total Reports</div>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-yellow-600">{pendingReports.length}</div>
            <div className="text-gray-600">Pending Review</div>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-green-600">{syncedReports.length}</div>
            <div className="text-gray-600">Synced Online</div>
          </div>
        </div>

        {/* Reports List */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Your Emergency Reports</h2>

          {reports.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">📭</div>
              <p className="text-gray-500">No reports submitted yet.</p>
              <Link
                href="/offline"
                className="inline-block mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Submit Your First Report
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{report.icon || '🚨'}</span>
                        <div>
                          <h3 className="font-semibold text-gray-800">{report.type}</h3>
                          <p className="text-sm text-gray-500">
                            {new Date(report.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      {report.description && (
                        <p className="text-gray-600 text-sm mb-2">{report.description}</p>
                      )}

                      <div className="flex items-center gap-4 text-xs">
                        <span className={`px-2 py-1 rounded-full ${
                          report.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          report.status === 'approved' ? 'bg-green-100 text-green-800' :
                          report.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                        </span>

                        <span className={`px-2 py-1 rounded-full ${
                          report.synced ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {report.synced ? '✅ Synced' : '⏳ Local Only'}
                        </span>

                        <span className={`px-2 py-1 rounded-full ${
                          report.severity === 'high' ? 'bg-red-100 text-red-800' :
                          report.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {report.severity?.charAt(0).toUpperCase() + report.severity?.slice(1)} Priority
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/offline"
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-center"
          >
            🚨 Submit Another Report
          </Link>

          {isOnline && (
            <button
              onClick={syncOfflineReports}
              disabled={syncStatus === 'syncing'}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {syncStatus === 'syncing' ? '🔄 Syncing...' : '🔄 Sync Now'}
            </button>
          )}

          <Link
            href="/"
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-center"
          >
            🏠 Back to Main Site
          </Link>
        </div>

        {/* Help Section */}
        <div className="mt-8 bg-gray-50 rounded-lg p-6">
          <h3 className="font-semibold text-gray-800 mb-3">📞 Need Help?</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <strong>Emergency Hotline:</strong><br />
              Call 911 for immediate assistance
            </div>
            <div>
              <strong>Technical Support:</strong><br />
              Contact your barangay administrator
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
