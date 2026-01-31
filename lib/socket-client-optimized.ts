'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import io, { Socket } from 'socket.io-client';
import type { Report } from '@/types';

// Connection state types
type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';

// Message compression utilities
const compressMessage = (data: unknown): string => {
  try {
    return JSON.stringify(data);
  } catch (error) {
    console.warn('Failed to compress message:', error);
    return JSON.stringify({ error: 'compression_failed', data });
  }
};

const decompressMessage = (data: string): unknown => {
  try {
    return JSON.parse(data);
  } catch (error) {
    console.warn('Failed to decompress message:', error);
    return null;
  }
};

// Connection pool manager
class SocketConnectionPool {
  private static instance: SocketConnectionPool;
  private socket: Socket | null = null;
  private subscribers: Set<(state: ConnectionState) => void> = new Set();
  private connectionState: ConnectionState = 'disconnected';
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 1000;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private messageQueue: Array<{ event: string; data: unknown }> = [];
  private isProcessingQueue = false;

  static getInstance(): SocketConnectionPool {
    if (!SocketConnectionPool.instance) {
      SocketConnectionPool.instance = new SocketConnectionPool();
    }
    return SocketConnectionPool.instance;
  }

  private constructor() {}

  private determineSocketUrl(): string | null {
    try {
      if (typeof window === 'undefined') return 'http://localhost:3001';

      // Check for environment variable first
      const envSocketUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
      if (envSocketUrl) {
        console.log('🌐 Using WebSocket URL from environment:', envSocketUrl);
        return envSocketUrl;
      }

      // For cloud deployments, use the server deployment URL with correct port
      if (window.location.hostname.includes('onrender.com')) {
        // Use the server deployment URL for WebSocket connections with port 10000
        const renderUrl = 'https://b-ready.onrender.com:10000';
        console.log('🌐 Using Render WebSocket URL:', renderUrl);
        return renderUrl;
      }

      // For Vercel deployments, use the server deployment URL
      if (window.location.hostname.includes('vercel.app')) {
        const vercelUrl = 'https://b-ready.onrender.com:10000';
        console.log('🌐 Using Vercel WebSocket URL:', vercelUrl);
        return vercelUrl;
      }

      // For localhost
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        const localUrl = 'http://localhost:3001';
        console.log('🏠 Using localhost WebSocket URL:', localUrl);
        return localUrl;
      }

      // For ngrok URLs
      if (window.location.hostname.includes('ngrok.io')) {
        const storedWsUrl = localStorage.getItem('bready_websocket_url');
        if (storedWsUrl) {
          const secureUrl = window.location.protocol === 'https:' 
            ? storedWsUrl.replace(/^http:/, 'https:')
            : storedWsUrl;
          console.log('🔒 Using stored WebSocket URL for ngrok:', secureUrl);
          return secureUrl;
        }
        const ngrokUrl = `https://${window.location.hostname}:3001`;
        console.log('🔄 Using fallback WebSocket URL for ngrok:', ngrokUrl);
        return ngrokUrl;
      }

      // For other domains, try to connect to the server deployment with port
      const fallbackUrl = 'https://b-ready.onrender.com:10000';
      console.log('🌐 Using fallback WebSocket URL:', fallbackUrl);
      return fallbackUrl;
    } catch (error) {
      console.error('Error determining WebSocket URL:', error);
      return null;
    }
  }

  private updateConnectionState(state: ConnectionState) {
    this.connectionState = state;
    this.subscribers.forEach(callback => callback(state));
  }

  private async processMessageQueue() {
    if (this.isProcessingQueue || !this.socket || this.connectionState !== 'connected') {
      return;
    }

    this.isProcessingQueue = true;
    
    while (this.messageQueue.length > 0 && this.connectionState === 'connected') {
      const { event, data } = this.messageQueue.shift()!;
      
      try {
        this.socket.emit(event, data);
      } catch (error) {
        console.error('Failed to send queued message:', error);
        // Re-queue the message
        this.messageQueue.unshift({ event, data });
        break;
      }
    }
    
    this.isProcessingQueue = false;
  }

  private setupSocketEvents() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ Connected to WebSocket server');
      console.log('📡 Connection details:', {
        id: this.socket?.id,
        connected: this.socket?.connected,
        transport: this.socket?.io?.engine?.transport?.name
      });
      this.updateConnectionState('connected');
      this.reconnectAttempts = 0;
      this.processMessageQueue();
    });

    this.socket.on('disconnect', (reason: string) => {
      console.log('❌ Disconnected from WebSocket server:', reason);
      console.log('📡 Disconnection details:', {
        id: this.socket?.id,
        connected: this.socket?.connected,
        reason
      });
      this.updateConnectionState('disconnected');
    });

    this.socket.on('connect_error', (error: Error) => {
      console.error('Connection error:', error);
      console.error('📡 Connection error details:', {
        message: error.message,
        stack: error.stack,
        url: this.determineSocketUrl()
      });
      this.updateConnectionState('error');
      this.scheduleReconnect();
    });

    this.socket.on('reconnect_attempt', (attempt: number) => {
      console.log(`🔄 Reconnection attempt ${attempt}/${this.maxReconnectAttempts}`);
      console.log('📡 Reconnection attempt details:', {
        attempt,
        maxAttempts: this.maxReconnectAttempts,
        delay: Math.min(this.reconnectDelay * Math.pow(2, attempt), 30000)
      });
      this.updateConnectionState('reconnecting');
    });

    this.socket.on('reconnect_failed', () => {
      console.error('❌ Failed to reconnect after all attempts');
      console.error('📡 Reconnection failure details:', {
        attempts: this.reconnectAttempts,
        maxAttempts: this.maxReconnectAttempts
      });
      this.updateConnectionState('error');
    });

    // Add debug events for troubleshooting
    this.socket.on('error', (error) => {
      console.error('📡 Socket error event:', error);
    });

    this.socket.on('ping', () => {
      console.log('📡 Socket ping received');
    });

    this.socket.on('pong', (latency: number) => {
      console.log(`📡 Socket pong received, latency: ${latency}ms`);
    });
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached');
      this.updateConnectionState('error');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts), 30000); // Cap at 30s
    
    console.log(`🔄 Scheduling reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    this.reconnectTimer = setTimeout(() => {
      if (this.connectionState === 'disconnected' || this.connectionState === 'error') {
        this.connect();
      }
    }, delay);
  }

  public connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket && this.connectionState === 'connected') {
        resolve();
        return;
      }

      const socketUrl = this.determineSocketUrl();
      if (!socketUrl) {
        this.updateConnectionState('error');
        reject(new Error('No valid WebSocket URL available'));
        return;
      }

      this.updateConnectionState('connecting');

      this.socket = io(socketUrl, {
        autoConnect: true,
        reconnection: false, // We handle reconnection manually
        timeout: 10000,
        transports: ['websocket', 'polling'],
        forceNew: true,
        upgrade: true,
      });

      this.setupSocketEvents();

      // Set up connection timeout
      const timeout = setTimeout(() => {
        if (this.connectionState !== 'connected') {
          this.updateConnectionState('error');
          reject(new Error('Connection timeout'));
        }
      }, 10000);

      this.socket.on('connect', () => {
        clearTimeout(timeout);
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
  }

  public disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.updateConnectionState('disconnected');
  }

  public emit(event: string, data: unknown) {
    if (this.connectionState === 'connected' && this.socket) {
      try {
        const compressedData = compressMessage(data);
        this.socket.emit(event, compressedData);
      } catch (error) {
        console.error('Failed to emit message:', error);
      }
    } else {
      // Queue the message for when connection is restored
      this.messageQueue.push({ event, data });
      console.log(`📡 Message queued (${event}) - ${this.messageQueue.length} messages pending`);
    }
  }

  public on(event: string, callback: (data: unknown) => void) {
    if (!this.socket) return () => {};

    const handler = (data: string) => {
      try {
        const decompressedData = decompressMessage(data);
        if (decompressedData) {
          callback(decompressedData);
        }
      } catch (error) {
        console.error('Failed to handle message:', error);
      }
    };

    this.socket.on(event, handler);
    return () => {
      this.socket?.off(event, handler);
    };
  }

  public getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  public subscribe(callback: (state: ConnectionState) => void) {
    this.subscribers.add(callback);
    callback(this.connectionState);
    return () => this.subscribers.delete(callback);
  }

  public getQueueLength(): number {
    return this.messageQueue.length;
  }
}

// Optimized hook for real-time connections
export function useOptimizedSocket() {
  const pool = useMemo(() => SocketConnectionPool.getInstance(), []);
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [queueLength, setQueueLength] = useState(0);
  const reconnectRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const unsubscribe = pool.subscribe((state) => {
      setConnectionState(state);
    });

    // Update queue length periodically
    const queueInterval = setInterval(() => {
      setQueueLength(pool.getQueueLength());
    }, 1000);

    return () => {
      unsubscribe();
      clearInterval(queueInterval);
      if (reconnectRef.current) {
        clearTimeout(reconnectRef.current);
      }
    };
  }, [pool]);

  const connect = useCallback(async () => {
    try {
      await pool.connect();
    } catch (error) {
      console.error('Failed to connect:', error);
    }
  }, [pool]);

  const disconnect = useCallback(() => {
    pool.disconnect();
  }, [pool]);

  const emit = useCallback((event: string, data: unknown) => {
    pool.emit(event, data);
  }, [pool]);

  const on = useCallback((event: string, callback: (data: unknown) => void) => {
    return pool.on(event, callback);
  }, [pool]);

  return {
    connect,
    disconnect,
    emit,
    on,
    connectionState,
    queueLength,
    isConnected: connectionState === 'connected',
    isConnecting: connectionState === 'connecting' || connectionState === 'reconnecting',
    hasPendingMessages: queueLength > 0,
  };
}

// Socket event handlers with compression
export const optimizedSocketEvents = {
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

// Performance monitoring hook
export function useSocketPerformance() {
  const [metrics, setMetrics] = useState({
    connectionTime: 0,
    messageRate: 0,
    lastMessageTime: 0,
    totalMessages: 0,
  });

  const messageCount = useRef(0);
  const startTime = useRef(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const timeElapsed = (now - startTime.current) / 1000;
      const rate = timeElapsed > 0 ? Math.round(messageCount.current / timeElapsed) : 0;
      
      setMetrics(prev => ({
        ...prev,
        messageRate: rate,
        totalMessages: messageCount.current,
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const recordMessage = useCallback(() => {
    messageCount.current++;
    setMetrics(prev => ({
      ...prev,
      lastMessageTime: Date.now(),
    }));
  }, []);

  const startConnectionTimer = useCallback(() => {
    startTime.current = Date.now();
  }, []);

  const endConnectionTimer = useCallback(() => {
    const connectionTime = Date.now() - startTime.current;
    setMetrics(prev => ({
      ...prev,
      connectionTime,
    }));
  }, []);

  return {
    metrics,
    recordMessage,
    startConnectionTimer,
    endConnectionTimer,
  };
}
