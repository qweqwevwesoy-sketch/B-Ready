'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { useOptimizedSocket, optimizedSocketEvents, useSocketPerformance } from '@/lib/socket-client-optimized';
import type { Report, User, ReportStatus, UserRole } from '@/types';

// Check if we're on the client side
const isClient = typeof window !== 'undefined';

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
  chatMessages: Array<{
    id: string;
    text: string;
    userName: string;
    userRole: string;
    timestamp: string;
    reportId: string;
    imageData?: string;
  }>;
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
  updateReport: (reportId: string, status: ReportStatus, notes?: string) => Promise<void>;
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
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());
  const pollingInterval = useRef<NodeJS.Timeout | null>(null);
  
const [chatMessages, setChatMessages] = useState<Array<{
    id: string;
    text: string;
    userName: string;
    userRole: string;
    timestamp: string;
    reportId: string;
    imageData?: string;
  }>>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [currentChatReportId, setCurrentChatReportId] = useState<string | null>(null);
  const processedMessageIds = useRef(new Set<string>());
  
  const reportsRef = useRef<Report[]>([]);
  const chatMessagesRef = useRef<Array<{
    id: string;
    text: string;
    userName: string;
    userRole: string;
    timestamp: string;
    reportId: string;
    imageData?: string;
  }>>([]);
  const isClientSide = useRef(false);

  // Mark as client-side after first render
  useEffect(() => {
    isClientSide.current = true;
  }, []);

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

// Authenticate user and request initial reports when connected
  useEffect(() => {
    if (!isConnected || !user) return;

    const authenticateAndFetchReports = async () => {
      try {
        console.log('🔐 Authenticating user:', user.email);
        
        // Authenticate with the server
        emit('authenticate', {
          email: user.email,
          userId: user.uid,
          role: user.role,
        });

        // Request initial reports after authentication
        console.log('📋 Requesting initial reports');
        emit('get_reports', {});

      } catch (error) {
        console.error('Error during authentication or report fetching:', error);
        setError('Failed to authenticate or fetch reports');
      }
    };

    authenticateAndFetchReports();
  }, [isConnected, user, emit]);

  // Polling fallback for when WebSocket connection fails
  useEffect(() => {
    if (!isConnected) {
      // Start polling every 10 seconds
      pollingInterval.current = setInterval(() => {
        if (!isConnected && user) {
          console.log('🔄 Polling for reports (WebSocket disconnected)');
          emit('get_reports', {});
          setLastUpdate(Date.now());
        }
      }, 10000);
    }

    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
        pollingInterval.current = null;
      }
    };
  }, [isConnected, emit, user]);

  // Set up socket event listeners
  useEffect(() => {
    if (!isConnected) return;

const handleReportsUpdate = (data: unknown) => {
      try {
        // Handle both direct objects and stringified JSON
        let reportsData: { reports: Report[] };
        
        if (typeof data === 'string') {
          try {
            reportsData = JSON.parse(data);
          } catch (parseError) {
            console.warn('📡 Failed to parse reports data as JSON:', data);
            return;
          }
        } else if (data && typeof data === 'object' && 'reports' in data) {
          reportsData = data as { reports: Report[] };
        } else {
          console.warn('📡 Invalid reports data received:', data);
          return;
        }

        if (reportsData && Array.isArray(reportsData.reports)) {
          console.log('📡 Received reports update:', reportsData.reports.length, 'reports');
          setReports(reportsData.reports);
          recordMessage();
          setLastUpdate(Date.now());
        } else {
          console.warn('📡 Invalid reports array received:', reportsData);
        }
      } catch (error) {
        console.error('Error handling reports update:', error);
      }
    };

    const handleNewReport = (data: unknown) => {
      try {
        // Handle both direct objects and stringified JSON
        let reportData: { report: Report };
        
        if (typeof data === 'string') {
          try {
            reportData = JSON.parse(data);
          } catch (parseError) {
            console.warn('📡 Failed to parse new report data as JSON:', data);
            return;
          }
        } else if (data && typeof data === 'object' && 'report' in data) {
          reportData = data as { report: Report };
        } else {
          console.warn('📡 Invalid new report data received:', data);
          return;
        }

        if (reportData && reportData.report) {
          setReports(prev => {
            const newReports = [reportData.report, ...prev];
            return newReports;
          });
          recordMessage();
        }
      } catch (error) {
        console.error('Error handling new report:', error);
      }
    };

    const handleReportUpdate = (data: unknown) => {
      try {
        // Handle both direct objects and stringified JSON
        let reportData: { report: Report };
        
        if (typeof data === 'string') {
          try {
            reportData = JSON.parse(data);
          } catch (parseError) {
            console.warn('📡 Failed to parse report update data as JSON:', data);
            return;
          }
        } else if (data && typeof data === 'object' && 'report' in data) {
          reportData = data as { report: Report };
        } else {
          console.warn('📡 Invalid report update data received:', data);
          return;
        }

        if (reportData && reportData.report) {
          setReports(prev => {
            return prev.map(report => 
              report.id === reportData.report.id ? reportData.report : report
            );
          });
          recordMessage();
        }
      } catch (error) {
        console.error('Error handling report update:', error);
      }
    };

  // Centralized message processing function to prevent duplicates
  const processChatMessage = useCallback((messageData: {
    id: string;
    text: string;
    userName: string;
    userRole: string;
    timestamp: string;
    reportId: string;
    imageData?: string;
  }) => {
    if (!messageData || !messageData.id) {
      console.warn('📝 Invalid message data received:', messageData);
      return;
    }

    // Only update messages for the current chat report or if no specific report is active
    if (messageData.reportId === currentChatReportId || !currentChatReportId) {
      // Check if message ID has already been processed
      if (processedMessageIds.current.has(messageData.id)) {
        console.log('📝 Message already processed, skipping duplicate:', messageData.id);
        return;
      }

      // Mark message as processed
      processedMessageIds.current.add(messageData.id);

      setChatMessages(prev => {
        console.log('📝 Adding new message:', messageData.id, 'from', messageData.userName);
        return [...prev, messageData];
      });
      recordMessage();
    }
  }, [currentChatReportId, recordMessage]);

  // Unified chat message handler - handles all chat message types
  const handleChatMessage = useCallback((data: unknown) => {
    try {
      let messageData: {
        id: string;
        text: string;
        userName: string;
        userRole: string;
        timestamp: string;
        reportId: string;
        imageData?: string;
      };
      
      // Handle both direct objects and stringified JSON
      if (typeof data === 'string') {
        try {
          messageData = JSON.parse(data);
        } catch (parseError) {
          console.warn('📡 Failed to parse chat message data as JSON:', data);
          return;
        }
      } else {
        messageData = data as {
          id: string;
          text: string;
          userName: string;
          userRole: string;
          timestamp: string;
          reportId: string;
          imageData?: string;
        };
      }

      if (messageData) {
        processChatMessage(messageData);
      }
    } catch (error) {
      console.error('Error handling chat message:', error);
    }
  }, [processChatMessage]);

  // Handle new chat message events (real-time updates)
  const handleNewChatMessage = useCallback((data: unknown) => {
    try {
      let messageData: {
        message: {
          id: string;
          text: string;
          userName: string;
          userRole: string;
          timestamp: string;
          reportId: string;
          imageData?: string;
        };
        reportId: string;
      };
      
      // Handle both direct objects and stringified JSON
      if (typeof data === 'string') {
        try {
          messageData = JSON.parse(data);
        } catch (parseError) {
          console.warn('📡 Failed to parse new chat message data as JSON:', data);
          return;
        }
      } else {
        messageData = data as {
          message: {
            id: string;
            text: string;
            userName: string;
            userRole: string;
            timestamp: string;
            reportId: string;
            imageData?: string;
          };
          reportId: string;
        };
      }

      if (messageData && messageData.message) {
        processChatMessage(messageData.message);
      }
    } catch (error) {
      console.error('Error handling new chat message:', error);
    }
  }, [processChatMessage]);

  const handleChatHistory = useCallback((data: unknown) => {
    try {
      // Handle both direct objects and stringified JSON
      let historyData: { reportId: string; messages: Array<{
        id: string;
        text: string;
        userName: string;
        userRole: string;
        timestamp: string;
        reportId: string;
        imageData?: string;
      }> };
      
      if (typeof data === 'string') {
        try {
          historyData = JSON.parse(data);
        } catch (parseError) {
          console.warn('📡 Failed to parse chat history data as JSON:', data);
          return;
        }
      } else if (data && typeof data === 'object' && 'messages' in data && 'reportId' in data) {
        historyData = data as { reportId: string; messages: Array<{
          id: string;
          text: string;
          userName: string;
          userRole: string;
          timestamp: string;
          reportId: string;
          imageData?: string;
        }> };
      } else {
        console.warn('📡 Invalid chat history data received:', data);
        return;
      }

      if (historyData && Array.isArray(historyData.messages)) {
        console.log('📡 Received chat history for report:', historyData.reportId, 'with', historyData.messages.length, 'messages');
        
        // Clear processed IDs when loading new history to avoid conflicts
        processedMessageIds.current.clear();
        
        // Mark all history messages as processed
        historyData.messages.forEach(msg => {
          if (msg.id) {
            processedMessageIds.current.add(msg.id);
          }
        });
        
        setChatMessages(historyData.messages);
        setChatLoading(false);
        recordMessage();
      } else {
        console.warn('📡 Invalid chat history array received:', historyData);
        setChatLoading(false);
      }
    } catch (error) {
      console.error('Error handling chat history:', error);
      setChatLoading(false);
    }
  }, [recordMessage]);

    const handleConnectionError = (error: unknown) => {
      try {
        let errorMessage = 'Unknown connection error';
        if (typeof error === 'string') {
          errorMessage = error;
        } else if (error && typeof error === 'object' && 'message' in error) {
          errorMessage = (error as { message?: string }).message || 'Unknown error';
        }
        
        console.error('Socket connection error:', error);
        setError('Connection error: ' + errorMessage);
      } catch (err) {
        console.error('Error handling connection error:', err);
        setError('Connection error occurred');
      }
    };

    const handleReconnect = () => {
      console.log('Socket reconnected');
      setError(null);
      if (currentChatReportId) {
        console.log('🔄 Rejoining chat room after reconnection:', currentChatReportId);
        joinReportChat(currentChatReportId);
      }
    };

    // Subscribe to events
    const unsubscribeReports = on('reports_update', handleReportsUpdate);
    const unsubscribeNewReport = on('new_report', handleNewReport);
    const unsubscribeReportUpdate = on('report_updated', handleReportUpdate);
    const unsubscribeChatMessage = on('report_chat_message', handleChatMessage);
    const unsubscribeNewChatMessage = on('new_chat_message', handleNewChatMessage);
    const unsubscribeChatHistory = on('report_chat_history', handleChatHistory);
    const unsubscribeError = on('error', handleConnectionError);
    const unsubscribeReconnect = on('reconnect', handleReconnect);

    // Request initial reports
    console.log('📋 Requesting initial reports after connection');
    emit('get_reports', {});

    return () => {
      unsubscribeReports();
      unsubscribeNewReport();
      unsubscribeReportUpdate();
      unsubscribeChatMessage();
      unsubscribeNewChatMessage();
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
        userName: user ? `${user.firstName} ${user.lastName}` : 'Anonymous',
        userRole: user?.role || 'resident',
      });
      
      // Optimistic update - add to local state immediately
      const tempReport = {
        ...reportData,
        id: `temp_${Date.now()}`,
        status: 'current' as ReportStatus,
        timestamp: new Date().toISOString(),
        userName: user ? `${user.firstName} ${user.lastName}` : 'Anonymous',
        userId: user?.uid || '',
        userRole: user?.role || 'resident',
        severity: reportData.severity || 'medium',
        adminResponse: 'none',
        adminId: null,
        adminLocation: null,
        responseTimestamp: null,
        routeCoordinates: null,
        estimatedTimeOfArrival: null,
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
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        reportId: currentChatReportId,
        text,
        userName: user ? `${user.firstName} ${user.lastName}` : 'Anonymous',
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

  const updateReport = useCallback(async (reportId: string, status: ReportStatus, notes?: string) => {
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
      setLastUpdate(Date.now());
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