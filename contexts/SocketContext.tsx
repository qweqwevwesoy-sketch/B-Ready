'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useSocketConnection, socketEvents } from '@/lib/socket-client';
import type { Socket } from 'socket.io-client';
import type { Report } from '@/types';

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
  connectionError: string | null;
  reports: Report[];
  setReports: React.Dispatch<React.SetStateAction<Report[]>>;
  submitReport: (report: Partial<Report>) => void;
  updateReport: (reportId: string, status: string, notes?: string) => void;
  joinReportChat: (reportId: string) => void;
  sendChatMessage: (reportId: string, text: string, userName: string, userRole: string, imageData?: string) => void;
  chatMessages: { [reportId: string]: Array<{ id: string; text: string; userName: string; userRole: string; timestamp: string; reportId: string; imageData?: string }> };
  setChatMessages: React.Dispatch<React.SetStateAction<{ [reportId: string]: Array<{ id: string; text: string; userName: string; userRole: string; timestamp: string; reportId: string; imageData?: string }> }>>;
}
 
const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  // Check if we're using local backend (offline mode)
  const isOfflineMode = process.env.NEXT_PUBLIC_USE_LOCAL_BACKEND === 'true';

  const socketConnection = useSocketConnection();
  const { socket, connected, connectionError } = isOfflineMode ? { socket: null, connected: false, connectionError: null } : socketConnection;

  const [reports, setReports] = useState<Report[]>([]);
  const [chatMessages, setChatMessages] = useState<{ [reportId: string]: Array<{ id: string; text: string; userName: string; userRole: string; timestamp: string; reportId: string }> }>({});

  useEffect(() => {
    if (isOfflineMode) {
      console.log('📱 Offline mode: Skipping socket connection');
      return;
    }

    if (!socket || !connected) return;

    const handleInitialReports = (reportsData: Report[]) => {
      console.log('📋 Received initial reports:', reportsData.length);
      setReports(reportsData);
    };

    const handleNewReport = (report: Report) => {
      console.log('📨 New report received:', report);
      setReports((prev) => {
        const existingIndex = prev.findIndex((r) => r.id === report.id);
        if (existingIndex === -1) {
          return [report, ...prev];
        }
        const updated = [...prev];
        updated[existingIndex] = report;
        return updated;
      });
    };

    const handleReportUpdated = (report: Report) => {
      console.log('🔄 Report updated:', report.id);
      setReports((prev) => {
        const index = prev.findIndex((r) => r.id === report.id);
        if (index !== -1) {
          const updated = [...prev];
          updated[index] = report;
          return updated;
        }
        return [report, ...prev];
      });
    };

    const handleReportSubmitted = (data: { success: boolean; report?: Report; error?: string }) => {
      console.log('📤 Report submission response:', data);
      if (data.success && data.report) {
        setReports((prev) => {
          const index = prev.findIndex((r) => r.id === data.report!.id);
          if (index !== -1) {
            const updated = [...prev];
            updated[index] = data.report!;
            return updated;
          }
          return [data.report!, ...prev];
        });
      }
    };

    const handleChatHistory = (data: { reportId: string; messages: Array<{ id: string; text: string; userName: string; userRole: string; timestamp: string; reportId: string }> }) => {
      console.log('📚 Received chat history for report:', data.reportId, data.messages.length, 'messages');
      setChatMessages((prev) => ({
        ...prev,
        [data.reportId]: data.messages
      }));
    };

    const handleNewChatMessage = (message: { id: string; reportId: string; text: string; userName: string; userRole: string; timestamp: string }) => {
      setChatMessages((prev) => {
        const reportMessages = prev[message.reportId] || [];
        return {
          ...prev,
          [message.reportId]: [...reportMessages, message]
        };
      });
    };

    socket.on('initial_reports', handleInitialReports);
    socket.on('new_report', handleNewReport);
    socket.on('report_updated', handleReportUpdated);
    socket.on('report_submitted', handleReportSubmitted);
    socket.on('chat_history', handleChatHistory);
    socket.on('new_chat_message', handleNewChatMessage);

    // Request initial reports
    socketEvents.getReports(socket);

    return () => {
      socket.off('initial_reports', handleInitialReports);
      socket.off('new_report', handleNewReport);
      socket.off('report_updated', handleReportUpdated);
      socket.off('report_submitted', handleReportSubmitted);
      socket.off('chat_history', handleChatHistory);
      socket.off('new_chat_message', handleNewChatMessage);
    };
  }, [socket, connected]);

  const submitReport = useCallback((report: Partial<Report>) => {
    if (socket && connected) {
      socketEvents.submitReport(socket, report);
    }
  }, [socket, connected]);

  const updateReport = useCallback((reportId: string, status: string, notes?: string) => {
    if (socket && connected) {
      socketEvents.updateReport(socket, { reportId, status, notes });
    }
  }, [socket, connected]);

  const joinReportChat = useCallback((reportId: string) => {
    if (socket && connected) {
      socketEvents.joinReportChat(socket, reportId);
    }
  }, [socket, connected]);

  const sendChatMessage = useCallback((reportId: string, text: string, userName: string, userRole: string, imageData?: string) => {
    if (socket && connected) {
      socketEvents.sendChatMessage(socket, { reportId, text, userName, userRole, imageData });
    }
  }, [socket, connected]);

  return (
    <SocketContext.Provider value={{
      socket,
      connected,
      connectionError,
      reports,
      setReports,
      submitReport,
      updateReport,
      joinReportChat,
      sendChatMessage,
      chatMessages,
      setChatMessages,
    }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocketContext() {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocketContext must be used within a SocketProvider');
  }
  return context;
}
