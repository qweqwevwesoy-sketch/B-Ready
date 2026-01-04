'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import io, { Socket } from 'socket.io-client';
import type { Report } from '@/types';

// Use the backend server for Socket.IO connections
const SOCKET_URL = 'http://localhost:3001';

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const socketInstance = io(SOCKET_URL, {
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

    setSocket(socketInstance); // eslint-disable-line react-hooks/rules-of-hooks

    return () => {
      socketInstance.disconnect();
    };
  }, []);

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

  sendChatMessage: (socket: Socket, data: { reportId: string; text: string; userName: string; userRole: string }) => {
    socket.emit('report_chat_message', data);
  },

  updateReport: (socket: Socket, data: { reportId: string; status: string; notes?: string }) => {
    socket.emit('update_report', data);
  },
};
