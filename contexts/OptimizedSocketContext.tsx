'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { useOptimizedSocket, optimizedSocketEvents, useSocketPerformance } from '@/lib/socket-client-optimized';
import type { Report, User } from '@/types';

interface OptimizedSocketContextType {
  // Connection state
  connected: boolean;
  connectionState: string;
  queueLength: number;
  hasPendingMessages: boolean;
  
  // Reports
  reports: Report[];
  loading: boolean;
  error: string | null;
  
  // Chat functionality
  chatMessages: any[];
  chatLoading: boolean;
  currentChatReportId: string | null;
  
  // Performance metrics
  performanceMetrics: {
    connectionTime: number;
    messageRate: number;
    lastMessageTime: number;
    totalMessages: number;
  };
  
  // Actions
  submitReport: (report: Partial<Report>) => Promise<void>;
  joinReportChat: (reportId: string) => void;
  leaveReportChat: () => void;
  sendMessage: (text: string, imageData?: string) => Promise<void>;
  updateReport: (reportId: string, status: string, notes?: string) => Promise<void>;
  refreshReports: () => void;
  clearError: () => void;
}

const OptimizedSocketContext = createContext<OptimizedSocketContextType | undefined>(undefined);

export const useOptimizedSocketContext = () => {
  const context = useContext(OptimizedSocketContext);
  if (context === undefined) {
    throw new Error('useOptimizedSocketContext must be used within an OptimizedSocketProvider');
  }
  return context;
};

export const OptimizedSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const {
    connect,
    disconnect,
    emit,
    on,
    connectionState,
    queueLength,
    isConnected,
    isConnecting,
    hasPendingMessages,
  } = useOptimizedSocket();
  
  const {
    metrics: performanceMetrics,
    recordMessage,
    startConnectionTimer,
    endConnectionTimer,
  } = useSocketPerformance();

  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [currentChatReportId, setCurrentChatReportId] = useState<string | null>(null);
  
  const reportsRef = useRef<Report[]>([]);
  const chatMessagesRef = useRef<any[]>([]);

  // Update refs when state changes
  useEffect(() => {
    reportsRef.current = reports;
  }, [reports]);

  useEffect(() => {
    chatMessagesRef.current = chatMessages;
  }, [chatMessages]);

  // Connect to WebSocket when user is authenticated
  useEffect(() => {
    if (user) {
      connect();
      startConnectionTimer();
    } else {
      disconnect();
    }
  }, [user, connect, disconnect, startConnectionTimer]);

  // Set up socket event listeners
  useEffect(() => {
    if (!isConnected) return;

    const handleReportsUpdate = (data: any) => {
      try {
        if (data && Array.isArray(data.reports)) {
          setReports(data.reports);
          recordMessage();
        }
      } catch (error) {
        console.error('Error handling reports update:', error);
      }
    };

    const handleNewReport = (data: any) => {
      try {
        if (data && data.report) {
          setReports(prev => {
            const newReports = [data.report, ...prev];
            return newReports;
          });
          recordMessage();
        }
      } catch (error) {
        console.error('Error handling new report:', error);
      }
    };

    const handleReportUpdate = (data: any) => {
      try {
        if (data && data.report) {
          setReports(prev => {
            return prev.map(report => 
              report.id === data.report.id ? data.report : report
            );
          });
          recordMessage();
        }
      } catch (error) {
        console.error('Error handling report update:', error);
      }
    };

    const handleChatMessage = (data: any) => {
      try {
        if (data && data.message && data.reportId === currentChatReportId) {
          setChatMessages(prev => [...prev, data.message]);
          recordMessage();
        }
      } catch (error) {
        console.error('Error handling chat message:', error);
      }
    };

    const handleChatHistory = (data: any) => {
      try {
        if (data && Array.isArray(data.messages)) {
          setChatMessages(data.messages);
          setChatLoading(false);
          recordMessage();
        }
      } catch (error) {
        console.error('Error handling chat history:', error);
        setChatLoading(false);
      }
    };

    const handleConnectionError = (error: any) => {
      console.error('Socket connection error:', error);
      setError('Connection error: ' + (error?.message || 'Unknown error'));
    };

    const handleReconnect = () => {
      console.log('Socket reconnected');
      setError(null);
      if (currentChatReportId) {
        joinReportChat(currentChatReportId);
      }
    };

    // Subscribe to events
    const unsubscribeReports = on('reports_update', handleReportsUpdate);
    const unsubscribeNewReport = on('new_report', handleNewReport);
    const unsubscribeReportUpdate = on('report_updated', handleReportUpdate);
    const unsubscribeChatMessage = on('report_chat_message', handleChatMessage);
    const unsubscribeChatHistory = on('report_chat_history', handleChatHistory);
    const unsubscribeError = on('error', handleConnectionError);
    const unsubscribeReconnect = on('reconnect', handleReconnect);

    // Request initial reports
    emit('get_reports', {});

    return () => {
      unsubscribeReports();
      unsubscribeNewReport();
      unsubscribeReportUpdate();
      unsubscribeChatMessage();
      unsubscribeChatHistory();
      unsubscribeError();
      unsubscribeReconnect();
    };
  }, [isConnected, on, emit, currentChatReportId, recordMessage]);

  // Performance monitoring
  useEffect(() => {
    if (isConnected) {
      endConnectionTimer();
    }
  }, [isConnected, endConnectionTimer]);

  const submitReport = useCallback(async (reportData: Partial<Report>) => {
    if (!isConnected) {
      setError('Cannot submit report: not connected to server');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      emit('submit_report', {
        ...reportData,
        userId: user?.uid,
        userName: user?.displayName || user?.email || 'Anonymous',
        userRole: user?.role || 'resident',
      });
      
      // Optimistic update - add to local state immediately
      const tempReport = {
        ...reportData,
        id: `temp_${Date.now()}`,
        status: 'current',
        timestamp: new Date().toISOString(),
        userName: user?.displayName || user?.email || 'Anonymous',
      } as Report;
      
      setReports(prev => [tempReport, ...prev]);
      
    } catch (err) {
      console.error('Error submitting report:', err);
      setError('Failed to submit report');
    } finally {
      setLoading(false);
    }
  }, [isConnected, emit, user]);

  const joinReportChat = useCallback((reportId: string) => {
    if (!isConnected) {
      setError('Cannot join chat: not connected to server');
      return;
    }

    try {
      setChatLoading(true);
      setCurrentChatReportId(reportId);
      setChatMessages([]);
      
      emit('join_report_chat', { reportId });
    } catch (err) {
      console.error('Error joining chat:', err);
      setChatLoading(false);
    }
  }, [isConnected, emit]);

  const leaveReportChat = useCallback(() => {
    setCurrentChatReportId(null);
    setChatMessages([]);
  }, []);

  const sendMessage = useCallback(async (text: string, imageData?: string) => {
    if (!isConnected || !currentChatReportId) {
      setError('Cannot send message: not connected or no active chat');
      return;
    }

    try {
      const messageData = {
        reportId: currentChatReportId,
        text,
        userName: user?.displayName || user?.email || 'Anonymous',
        userRole: user?.role || 'resident',
        imageData,
        timestamp: new Date().toISOString(),
      };

      // Optimistic update
      setChatMessages(prev => [...prev, messageData]);
      
      emit('report_chat_message', messageData);
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
    }
  }, [isConnected, currentChatReportId, emit, user]);

  const updateReport = useCallback(async (reportId: string, status: string, notes?: string) => {
    if (!isConnected) {
      setError('Cannot update report: not connected to server');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      emit('update_report', {
        reportId,
        status,
        notes,
        updatedBy: user?.uid,
      });
      
      // Optimistic update
      setReports(prev => prev.map(report => 
        report.id === reportId 
          ? { ...report, status, notes: notes || report.notes }
          : report
      ));
      
    } catch (err) {
      console.error('Error updating report:', err);
      setError('Failed to update report');
    } finally {
      setLoading(false);
    }
  }, [isConnected, emit, user]);

  const refreshReports = useCallback(() => {
    if (isConnected) {
      emit('get_reports', {});
    }
  }, [isConnected, emit]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const contextValue: OptimizedSocketContextType = {
    // Connection state
    connected: isConnected,
    connectionState,
    queueLength,
    hasPendingMessages,
    
    // Reports
    reports,
    loading,
    error,
    
    // Chat functionality
    chatMessages,
    chatLoading,
    currentChatReportId,
    
    // Performance metrics
    performanceMetrics,
    
    // Actions
    submitReport,
    joinReportChat,
    leaveReportChat,
    sendMessage,
    updateReport,
    refreshReports,
    clearError,
  };

  return (
    <OptimizedSocketContext.Provider value={contextValue}>
      {children}
    </OptimizedSocketContext.Provider>
  );
};