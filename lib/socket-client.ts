'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import io, { Socket } from 'socket.io-client';
import type { Report } from '@/types';

// Use the backend server for Socket.IO connections
// We'll determine the URL dynamically in the useSocket hook to avoid hydration issues

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);

  // Determine the correct WebSocket URL dynamically
  const socketUrl = useMemo(() => {
    if (typeof window === 'undefined') return 'http://localhost:3001';

    // Check for environment variable first (for global deployments)
    const envSocketUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
    if (envSocketUrl) {
      return envSocketUrl;
    }

    // For Vercel and Render deployments, disable WebSocket connection
    if (window.location.hostname.includes('vercel.app') || window.location.hostname.includes('onrender.com')) {
      console.log('🔌 WebSocket disabled for cloud deployment (Vercel/Render)');
      // Render doesn't support WebSocket on the same domain, so return null
      return null;
    }

    // If we're running on localhost, use localhost
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:3001';
    }

    // For ngrok URLs, try to use the same domain but port 3001
    // This handles cases where frontend and WebSocket are on different ngrok URLs
    if (window.location.hostname.includes('ngrok.io')) {
      // For ngrok, we need to get the WebSocket URL from localStorage or use a default
      const storedWsUrl = localStorage.getItem('bready_websocket_url');
      if (storedWsUrl) {
        // Ensure we use WSS for HTTPS pages
        if (window.location.protocol === 'https:') {
          return storedWsUrl.replace(/^http:/, 'https:');
        }
        return storedWsUrl;
      }
      // Fallback: assume WebSocket is on the same ngrok domain but port 3001
      return `https://${window.location.hostname}:3001`;
    }

    // Otherwise, use the same hostname but port 3001
    return `http://${window.location.hostname}:3001`;
  }, []);

  useEffect(() => {
    // For Firebase deployments, initialize Firebase Realtime Database
    if (socketUrl && socketUrl.includes('firebaseio.com')) {
      console.log('🔥 Firebase real-time features enabled');
      // Firebase handles connections differently - no Socket.IO needed
      setSocket(null);
      return;
    }

    // Don't create socket connection if no valid URL
    if (!socketUrl) {
      setSocket(null);
      return;
    }

    const socketInstance = io(socketUrl, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      randomizationFactor: 0.5,
      timeout: 20000,
      transports: ['websocket', 'polling'],
      forceNew: true,
      upgrade: true,
    });

    // eslint-disable-next-line react-hooks/rules-of-hooks
    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [socketUrl]);

  return socket;
}

export function useSocketConnection() {
  const socket = useSocket();
  const [connected, setConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
    if (!socket) return;

    const handleConnect = () => {
      console.log('✅ Connected to WebSocket server');
      setConnected(true);
      setConnectionError(null);
    };

    const handleDisconnect = (reason: string) => {
      console.log('❌ Disconnected from WebSocket server:', reason);
      setConnected(false);
    };

    const handleConnectError = (error: Error) => {
      console.error('Connection error:', error);
      setConnected(false);
      setConnectionError(`Connection failed: ${error.message}`);
    };

    const handleReconnectAttempt = (attempt: number) => {
      console.log(`🔄 Reconnection attempt ${attempt}/10`);
    };

    const handleReconnectFailed = () => {
      console.error('❌ Failed to reconnect after all attempts');
      setConnectionError('Failed to reconnect to server after multiple attempts');
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);
    socket.on('reconnect_attempt', handleReconnectAttempt);
    socket.on('reconnect_failed', handleReconnectFailed);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
      socket.off('reconnect_attempt', handleReconnectAttempt);
      socket.off('reconnect_failed', handleReconnectFailed);
    };
  }, [socket]);

  return { socket, connected, connectionError };
}

// Socket event handlers
export const socketEvents = {
  authenticate: (socket: Socket, data: { email: string; userId: string; role: string }) => {
    socket.emit('authenticate', data);
  },

  submitReport: (socket: Socket, report: Partial<Report>) => {
    socket.emit('submit_report', report);
  },

  getReports: (socket: Socket) => {
    socket.emit('get_reports');
  },

  joinReportChat: (socket: Socket, reportId: string) => {
    socket.emit('join_report_chat', { reportId });
  },

  sendChatMessage: (socket: Socket, data: { reportId: string; text: string; userName: string; userRole: string; imageData?: string }) => {
    socket.emit('report_chat_message', data);
  },

  updateReport: (socket: Socket, data: { reportId: string; status: string; notes?: string }) => {
    socket.emit('update_report', data);
  },
};
