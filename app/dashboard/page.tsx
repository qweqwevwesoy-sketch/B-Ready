'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useSocketContext } from '@/contexts/SocketContext';
import { Header } from '@/components/Header';
import { FAB } from '@/components/FAB';
import { ReportCard } from '@/components/ReportCard';
import { ColumnSearch } from '@/components/ColumnSearch';
import { EnhancedNotificationSystem } from '@/components/EnhancedNotificationSystem';
import { ChatBox } from '@/components/ChatBox';
import { notificationManager } from '@/components/NotificationManager';
import type { Category, Report } from '@/types';
import { getCurrentLocation, reverseGeocode } from '@/lib/utils';
import {
  useOfflineStatus,
  isOnline,
  storeOfflineReport,
  getOfflineReports,
  markReportSynced,
  cleanupSyncedReports,
  storeOfflineMessage,
  getOfflineMessages,
  getOfflineMessagesForReport,
  type OfflineMessage
} from '@/lib/offline-manager';
import { getLocalStorageItem } from '@/lib/client-utils';

function SearchParamsWrapper() {
  const searchParams = useSearchParams();

  return <DashboardContent searchParams={searchParams} />;
}

function DashboardContent({ searchParams }: { searchParams: URLSearchParams }) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { socket, connected, connectionError, reports, submitReport, updateReport, joinReportChat, sendChatMessage, chatMessages, setChatMessages } = useSocketContext();
  const isWebSocketAvailable = socket !== null;
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [showChatbox, setShowChatbox] = useState(false);
  const [currentReportChat, setCurrentReportChat] = useState<string | null>(null);
  const [tempReportId, setTempReportId] = useState<string | null>(null);
  const isOffline = useOfflineStatus();

  // Handle report submission to transfer chat messages from temp ID to real ID
  useEffect(() => {
    if (socket && connected) {
      const handleReportSubmitted = (data: { success: boolean; report?: Report; error?: string }) => {
        if (data.success && data.report && tempReportId && chatMessages[tempReportId]) {
          // Transfer messages from temp report ID to real report ID
          setChatMessages(prev => {
            const updated = { ...prev };
            updated[data.report!.id] = prev[tempReportId] || [];
            delete updated[tempReportId];
            return updated;
          });

          // Update current chat to use real report ID
          if (currentReportChat === tempReportId) {
            setCurrentReportChat(data.report!.id);
            joinReportChat(data.report!.id);
          }

          setTempReportId(null);
        }
      };

      socket.on('report_submitted', handleReportSubmitted);

      return () => {
        socket.off('report_submitted', handleReportSubmitted);
      };
    }
  }, [socket, connected, tempReportId, chatMessages, currentReportChat, joinReportChat, setChatMessages]);

  // Unified offline/online functionality - dashboard works in both modes
  useEffect(() => {
    // Always try to sync when coming back online
    if (!isOffline && user) {
      const syncOfflineData = async () => {
        const offlineReports = getOfflineReports().filter(report => !report.synced);
        const allOfflineMessages: OfflineMessage[] = getOfflineMessages();
        const offlineMessages = allOfflineMessages.filter((msg) => !msg.synced);

        if (offlineReports.length > 0 || offlineMessages.length > 0) {
          console.log('🔄 Syncing offline data...', { reports: offlineReports.length, messages: offlineMessages.length });

          // Sync reports
          for (const offlineReport of offlineReports) {
            try {
              const { offlineId, createdAt, synced, ...reportData } = offlineReport;
              await submitReport(reportData);
              markReportSynced(offlineReport.offlineId);
              console.log('✅ Synced report:', offlineReport.offlineId);
            } catch (error) {
              console.error('❌ Failed to sync report:', offlineReport.offlineId, error);
            }
          }

          // Note: Messages would need server-side sync implementation
          // For now, we keep them local until a full sync system is implemented

          cleanupSyncedReports();
          notificationManager.success(`Synced ${offlineReports.length} offline reports!`);
        }
      };

      // Only sync if connected
      if (connected) {
        syncOfflineData();
      } else {
        // Try to reconnect
        console.log('📡 Attempting to reconnect for sync...');
      }
    }
  }, [isOffline, user, connected, submitReport]);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
      } else if (!getLocalStorageItem('terms_accepted')) {
        router.push('/terms');
      }
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (socket && connected && user) {
      socket.emit('authenticate', {
        email: user.email,
        userId: user.uid,
        role: user.role,
      });
    }
  }, [socket, connected, user]);

  // Handle chat query parameter
  useEffect(() => {
    const chatId = searchParams.get('chat');
    if (chatId && reports.length > 0 && user) {
      const report = reports.find((r) => r.id === chatId);
      if (report && (user.role === 'admin' || report.userId === user.uid)) {
        // Use setTimeout to avoid synchronous setState in effect
        setTimeout(() => {
          setCurrentReportChat(chatId);
          setShowChatbox(true);
          joinReportChat(chatId);
          // Clean up the URL
          router.replace('/dashboard', undefined);
        }, 0);
      }
    }
  }, [searchParams, reports, user, joinReportChat, router]);

  const handleCategorySelect = async (category: Category) => {
    if (!user) return;

    setSelectedCategory(category);
    setShowChatbox(true);

    try {
      const position = await getCurrentLocation();
      const address = await reverseGeocode(position.lat, position.lng);
      const timestamp = new Date().toISOString();
      const tempId = `temp_${Date.now()}_${user.uid}`;
      setTempReportId(tempId);
      setCurrentReportChat(tempId); // Enable chat immediately
      joinReportChat(tempId); // Join the chat room for the temp report

      const reportData: Partial<Report> = {
        id: tempId,
        type: category.name,
        description: `Emergency: ${category.name}`,
        location: position,
        address: address,
        timestamp: timestamp,
        userId: user.uid,
        userName: `${user.firstName} ${user.lastName}`,
        userPhone: user.phone,
        severity: 'medium',
        status: 'pending',
        category: category.name,
        subcategory: category.subcategories[0],
        icon: category.icon,
      };

      if (isOffline) {
        // Store offline
        const offlineReport = storeOfflineReport(reportData);
        notificationManager.info('Report saved offline. Will sync when online.');
        console.log('📱 Report stored offline:', offlineReport.offlineId);
      } else {
        submitReport(reportData);
      }

      // Auto-submit after 3 seconds (only if online)
      setTimeout(() => {
        if (tempId === tempReportId && !isOffline) {
          submitReport(reportData);
        }
      }, 3000);
    } catch (error) {
      console.error('Error creating report:', error);
      notificationManager.error('Failed to get location. Report will be submitted without location.');

      const timestamp = new Date().toISOString();
      const tempId = `temp_${Date.now()}_${user.uid}`;
      setTempReportId(tempId);
      setCurrentReportChat(tempId); // Enable chat immediately
      joinReportChat(tempId); // Join the chat room for the temp report

      const reportData: Partial<Report> = {
        id: tempId,
        type: category.name,
        description: `Emergency: ${category.name}`,
        location: null,
        address: 'Location not available',
        timestamp: timestamp,
        userId: user.uid,
        userName: `${user.firstName} ${user.lastName}`,
        severity: 'medium',
        status: 'pending',
        category: category.name,
        icon: category.icon,
      };

      if (isOffline) {
        const offlineReport = storeOfflineReport(reportData);
        notificationManager.info('Report saved offline. Will sync when online.');
        console.log('📱 Report stored offline:', offlineReport.offlineId);
      } else {
        submitReport(reportData);
      }
    }
  };

  const handleOpenReportChat = (reportId: string) => {
    // Allow temp reports to open chats
    if (reportId.startsWith('temp_')) {
      setCurrentReportChat(reportId);
      setShowChatbox(true);
      joinReportChat(reportId);
      return;
    }

    const report = reports.find((r) => r.id === reportId);
    if (!report) {
      notificationManager.error('Report not found');
      return;
    }

    if (user?.role === 'admin' || report.userId === user?.uid) {
      setCurrentReportChat(reportId);
      setShowChatbox(true);
      joinReportChat(reportId);
    } else {
      notificationManager.error('You cannot open this report chat');
    }
  };

  // Search states for each column
  const [approvedSearchQuery, setApprovedSearchQuery] = useState('');
  const [approvedIsDateSearch, setApprovedIsDateSearch] = useState(false);
  const [approvedDateRange, setApprovedDateRange] = useState<{ start: Date | null; end: Date | null }>({ start: null, end: null });

  const [currentSearchQuery, setCurrentSearchQuery] = useState('');
  const [currentIsDateSearch, setCurrentIsDateSearch] = useState(false);
  const [currentDateRange, setCurrentDateRange] = useState<{ start: Date | null; end: Date | null }>({ start: null, end: null });

  const [thirdColumnSearchQuery, setThirdColumnSearchQuery] = useState('');
  const [thirdColumnIsDateSearch, setThirdColumnIsDateSearch] = useState(false);
  const [thirdColumnDateRange, setThirdColumnDateRange] = useState<{ start: Date | null; end: Date | null }>({ start: null, end: null });

  // Filtered reports based on search
  const approvedReports = reports.filter((r) => r.status === 'approved');
  const filteredApprovedReports = approvedSearchQuery || approvedIsDateSearch 
    ? approvedReports.filter(report => filterReports(report, approvedSearchQuery, approvedIsDateSearch, approvedDateRange))
    : approvedReports;

  const currentReports = reports.filter((r) => r.status === 'current');
  const filteredCurrentReports = currentSearchQuery || currentIsDateSearch
    ? currentReports.filter(report => filterReports(report, currentSearchQuery, currentIsDateSearch, currentDateRange))
    : currentReports;

  const thirdColumnReports =
    user.role === 'admin'
      ? reports.filter((r) => r.status === 'pending')
      : reports.filter((r) => r.userId === user.uid);
  const filteredThirdColumnReports = thirdColumnSearchQuery || thirdColumnIsDateSearch
    ? thirdColumnReports.filter(report => filterReports(report, thirdColumnSearchQuery, thirdColumnIsDateSearch, thirdColumnDateRange))
    : thirdColumnReports;

  // Filter function
  const filterReports = (report: Report, query: string, isDateSearch: boolean, dateRange: { start: Date | null; end: Date | null }) => {
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

  const handleApprove = (reportId: string) => {
    updateReport(reportId, 'approved', 'Report approved by admin');
  };

  const handleReject = (reportId: string) => {
    updateReport(reportId, 'rejected', 'Report rejected by admin');
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

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200">
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-8">

        {/* Reports Section */}
        <div ref={(el) => {
          if (el && user?.role === 'resident') {
            // Auto-scroll to reports section for residents after 3 seconds
            setTimeout(() => {
              el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 3000);
          }
        }} className="bg-white/95 backdrop-blur-lg rounded-2xl p-8 shadow-xl">
          <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Welcome, {user.firstName}!
              </h1>
              <p className="text-gray-600">
                {user.role === 'admin'
                  ? 'Manage emergency reports and coordinate response'
                  : 'Stay informed about barangay emergencies and reports'}
              </p>
            </div>
            <div className="flex items-center gap-4">
              {user.profilePictureUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.profilePictureUrl}
                  alt="Profile"
                  className="w-12 h-12 rounded-full object-cover border-2 border-white"
                  onError={(e) => {
                    // If image fails to load, show initials
                    (e.target as HTMLImageElement).style.display = 'none';
                    const parent = (e.target as HTMLElement).parentElement;
                    if (parent) {
                      const initialsDiv = parent.querySelector('.dashboard-avatar-fallback') as HTMLElement;
                      if (initialsDiv) initialsDiv.style.display = 'flex';
                    }
                  }}
                />
              ) : null}
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary-dark text-white flex items-center justify-center font-bold text-lg dashboard-avatar-fallback" style={{ display: user.profilePictureUrl ? 'none' : 'flex' }}>
                {user.firstName.charAt(0)}{user.lastName.charAt(0)}
              </div>
              <div className="flex items-center gap-2">
                <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  isOffline
                    ? 'bg-red-100 text-red-800'
                    : 'bg-green-100 text-green-800'
                }`}>
                  {isOffline ? '🔴 Offline' : '🟢 Online'}
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  connected
                    ? 'bg-blue-100 text-blue-800'
                    : connectionError
                    ? 'bg-red-100 text-red-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {connected ? '🔗 Connected' : connectionError ? '❌ Reconnecting...' : '⏳ Connecting...'}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Approved Reports Column */}
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
                    <ReportCard
                      key={report.id}
                      report={report}
                      onOpenChat={handleOpenReportChat}
                      canOpenChat={user.role === 'admin' || report.userId === user.uid}
                    />
                  ))
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <p>No approved reports yet</p>
                    <p className="text-sm mt-2">Reports approved by officials will appear here</p>
                  </div>
                )}
              </div>
            </div>

            {/* Current Reports Column */}
            <div className="bg-gray-50 rounded-xl overflow-hidden border border-gray-200 flex flex-col h-[70vh]">
              <div className="bg-gradient-to-r from-custom-yellow-500 to-custom-yellow-600 text-white p-4 text-center font-semibold">
                🔵 Active Reports
                <div className="text-sm opacity-90 mt-1">
                  {filteredCurrentReports.length} of {currentReports.length} reports
                </div>
              </div>
              <ColumnSearch
                placeholder="Search active reports..."
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
                    <ReportCard
                      key={report.id}
                      report={report}
                      onOpenChat={handleOpenReportChat}
                      canOpenChat={user.role === 'admin' || report.userId === user.uid}
                    />
                  ))
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <p>No active reports</p>
                    <p className="text-sm mt-2">Ongoing emergencies will appear here</p>
                  </div>
                )}
              </div>
            </div>

            {/* Third Column (Pending/My Reports) */}
            <div className="bg-gray-50 rounded-xl overflow-hidden border border-gray-200 flex flex-col h-[70vh]">
              <div className="bg-gradient-to-r from-custom-yellow-500 to-custom-yellow-600 text-white p-4 text-center font-semibold">
                {user.role === 'admin' ? '⏳ Pending Review' : '📋 My Reports'}
                <div className="text-sm opacity-90 mt-1">
                  {filteredThirdColumnReports.length} of {thirdColumnReports.length} reports
                </div>
              </div>
              <ColumnSearch
                placeholder={user.role === 'admin' ? "Search pending reports..." : "Search my reports..."}
                onSearch={(query, isDateSearch, dateRange) => {
                  setThirdColumnSearchQuery(query);
                  setThirdColumnIsDateSearch(isDateSearch);
                  if (dateRange) setThirdColumnDateRange(dateRange);
                }}
                onClear={() => {
                  setThirdColumnSearchQuery('');
                  setThirdColumnIsDateSearch(false);
                  setThirdColumnDateRange({ start: null, end: null });
                }}
              />
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {filteredThirdColumnReports.length > 0 ? (
                  filteredThirdColumnReports.map((report) => (
                    <ReportCard
                      key={report.id}
                      report={report}
                      onOpenChat={handleOpenReportChat}
                      onApprove={user.role === 'admin' ? handleApprove : undefined}
                      onReject={user.role === 'admin' ? handleReject : undefined}
                      canOpenChat={user.role === 'admin' || report.userId === user.uid}
                      showActions={user.role === 'admin'}
                    />
                  ))
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <p>No reports here yet</p>
                    <p className="text-sm mt-2">
                      {user.role === 'admin' ? 'Pending reports will appear here' : 'Your reports will appear here'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {user && <FAB onCategorySelect={handleCategorySelect} />}

      {showChatbox && (
        <ChatBox
          reportId={currentReportChat}
          category={selectedCategory}
          onClose={() => {
            setShowChatbox(false);
            setCurrentReportChat(null);
            setSelectedCategory(null);
          }}
          onSendMessage={(text) => {
            if (currentReportChat && user) {
              if (isOffline) {
                // Store message offline
                storeOfflineMessage({
                  reportId: currentReportChat,
                  text,
                  userName: `${user.firstName} ${user.lastName}`,
                  userRole: user.role,
                  timestamp: new Date().toISOString(),
                });
                console.log('💬 Message stored offline for report:', currentReportChat);
              } else {
                sendChatMessage(currentReportChat, text, `${user.firstName} ${user.lastName}`, user.role);
              }
            }
          }}
          onSendImage={(imageData) => {
            if (currentReportChat && user) {
              if (isOffline) {
                // Store image message offline
                storeOfflineMessage({
                  reportId: currentReportChat,
                  text: '[Photo]',
                  userName: `${user.firstName} ${user.lastName}`,
                  userRole: user.role,
                  timestamp: new Date().toISOString(),
                  imageData,
                });
                console.log('📸 Image stored offline for report:', currentReportChat);
              } else {
                // Send image through socket
                sendChatMessage(currentReportChat, '[Photo]', `${user.firstName} ${user.lastName}`, user.role, imageData);
              }
            }
          }}
        />
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
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
    }>
      <SearchParamsWrapper />
    </Suspense>
  );
}
