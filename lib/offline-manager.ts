// lib/offline-manager.ts - Handle offline report submission
import type { Report } from '@/types';

const OFFLINE_REPORTS_KEY = 'bready_offline_reports';
const OFFLINE_MESSAGES_KEY = 'bready_offline_messages';

export interface OfflineReport extends Partial<Report> {
  offlineId: string;
  createdAt: string;
  synced: boolean;
}

export interface OfflineMessage {
  reportId: string;
  text: string;
  userName: string;
  userRole: string;
  timestamp: string;
  offlineId: string;
  synced?: boolean;
  imageData?: string;
}

// Check if user is online
export const isOnline = (): boolean => {
  return navigator.onLine;
};

// Get stored offline reports
export const getOfflineReports = (): OfflineReport[] => {
  try {
    const stored = localStorage.getItem(OFFLINE_REPORTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading offline reports:', error);
    return [];
  }
};

// Store offline report
export const storeOfflineReport = (report: Partial<Report>): OfflineReport => {
  const offlineReport: OfflineReport = {
    ...report,
    offlineId: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
    synced: false,
  };

  const existing = getOfflineReports();
  existing.push(offlineReport);

  try {
    localStorage.setItem(OFFLINE_REPORTS_KEY, JSON.stringify(existing));
  } catch (error) {
    console.error('Error storing offline report:', error);
  }

  return offlineReport;
};

// Mark report as synced
export const markReportSynced = (offlineId: string): void => {
  const reports = getOfflineReports();
  const updated = reports.map(report =>
    report.offlineId === offlineId ? { ...report, synced: true } : report
  );

  try {
    localStorage.setItem(OFFLINE_REPORTS_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error marking report synced:', error);
  }
};

// Remove synced reports (cleanup)
export const cleanupSyncedReports = (): void => {
  const reports = getOfflineReports();
  const unsynced = reports.filter(report => !report.synced);

  try {
    localStorage.setItem(OFFLINE_REPORTS_KEY, JSON.stringify(unsynced));
  } catch (error) {
    console.error('Error cleaning up synced reports:', error);
  }
};

// Get stored offline messages
export const getOfflineMessages = (): OfflineMessage[] => {
  try {
    const stored = localStorage.getItem(OFFLINE_MESSAGES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading offline messages:', error);
    return [];
  }
};

// Store offline message
export const storeOfflineMessage = (message: Omit<OfflineMessage, 'offlineId'>): OfflineMessage => {
  const offlineMessage: OfflineMessage = {
    ...message,
    offlineId: `msg_offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  };

  const existing = getOfflineMessages();
  existing.push(offlineMessage);

  try {
    localStorage.setItem(OFFLINE_MESSAGES_KEY, JSON.stringify(existing));
  } catch (error) {
    console.error('Error storing offline message:', error);
  }

  return offlineMessage;
};

// Remove synced messages for a report
export const removeSyncedMessages = (reportId: string): void => {
  const messages = getOfflineMessages();
  const remaining = messages.filter(msg => msg.reportId !== reportId);

  try {
    localStorage.setItem(OFFLINE_MESSAGES_KEY, JSON.stringify(remaining));
  } catch (error) {
    console.error('Error removing synced messages:', error);
  }
};

// Get messages for a specific report
export const getOfflineMessagesForReport = (reportId: string): OfflineMessage[] => {
  const messages = getOfflineMessages();
  return messages.filter(msg => msg.reportId === reportId);
};

// Hook for offline/online status
export const useOfflineStatus = () => {
  const [isOffline, setIsOffline] = React.useState(!isOnline());

  React.useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOffline;
};

// React import for hook
import React from 'react';
