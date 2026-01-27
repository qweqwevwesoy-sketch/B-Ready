'use client';

import { useCallback, useRef, useState, useEffect } from 'react';

interface ReconnectionConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  jitter: boolean;
}

interface ReconnectionState {
  isReconnecting: boolean;
  retryCount: number;
  nextRetryTime: number;
  lastError: Error | null;
}

export class ReconnectionManager {
  private static instances = new Map<string, ReconnectionManager>();
  private config: ReconnectionConfig;
  private state: ReconnectionState;
  private retryTimer: NodeJS.Timeout | null = null;
  private isManualReconnect = false;

  static getInstance(config: Partial<ReconnectionConfig> = {}): ReconnectionManager {
    const key = JSON.stringify(config);
    if (!ReconnectionManager.instances.has(key)) {
      ReconnectionManager.instances.set(key, new ReconnectionManager(config));
    }
    return ReconnectionManager.instances.get(key)!;
  }

  private constructor(config: Partial<ReconnectionConfig>) {
    this.config = {
      maxRetries: 10,
      initialDelay: 1000,
      maxDelay: 30000,
      backoffMultiplier: 2,
      jitter: true,
      ...config,
    };
    
    this.state = {
      isReconnecting: false,
      retryCount: 0,
      nextRetryTime: 0,
      lastError: null,
    };
  }

  async attemptReconnection(
    reconnectFn: () => Promise<void>,
    onProgress?: (state: ReconnectionState) => void
  ): Promise<void> {
    if (this.state.isReconnecting) {
      return;
    }

    this.state.isReconnecting = true;
    this.isManualReconnect = true;

    try {
      await reconnectFn();
      this.reset();
      onProgress?.(this.getState());
    } catch (error) {
      this.state.lastError = error instanceof Error ? error : new Error('Reconnection failed');
      this.scheduleRetry(reconnectFn, onProgress);
    }
  }

  handleConnectionFailure(
    reconnectFn: () => Promise<void>,
    onProgress?: (state: ReconnectionState) => void
  ): void {
    if (this.state.isReconnecting || this.isManualReconnect) {
      return;
    }

    this.state.retryCount++;
    
    if (this.state.retryCount > this.config.maxRetries) {
      this.state.isReconnecting = false;
      onProgress?.(this.getState());
      return;
    }

    this.scheduleRetry(reconnectFn, onProgress);
  }

  private scheduleRetry(
    reconnectFn: () => Promise<void>,
    onProgress?: (state: ReconnectionState) => void
  ): void {
    const delay = this.calculateDelay();
    this.state.nextRetryTime = Date.now() + delay;

    this.retryTimer = setTimeout(async () => {
      try {
        await reconnectFn();
        this.reset();
      } catch (error) {
        this.state.lastError = error instanceof Error ? error : new Error('Reconnection failed');
        this.handleConnectionFailure(reconnectFn, onProgress);
      }
      onProgress?.(this.getState());
    }, delay);

    onProgress?.(this.getState());
  }

  private calculateDelay(): number {
    let delay = this.config.initialDelay * Math.pow(this.config.backoffMultiplier, this.state.retryCount - 1);
    
    // Cap the delay
    delay = Math.min(delay, this.config.maxDelay);
    
    // Add jitter to prevent thundering herd
    if (this.config.jitter) {
      delay = delay * (0.5 + Math.random() * 0.5);
    }
    
    return delay;
  }

  public reset(): void {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
    
    this.state = {
      isReconnecting: false,
      retryCount: 0,
      nextRetryTime: 0,
      lastError: null,
    };
    
    this.isManualReconnect = false;
  }

  getState(): ReconnectionState {
    return { ...this.state };
  }

  stop(): void {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
    this.reset();
  }

  isHealthy(): boolean {
    return !this.state.isReconnecting && this.state.retryCount === 0;
  }
}

// React hook for managing reconnection
export function useReconnectionManager(config: Partial<ReconnectionConfig> = {}) {
  const managerRef = useRef<ReconnectionManager | null>(null);
  const [state, setState] = useState<ReconnectionState>({
    isReconnecting: false,
    retryCount: 0,
    nextRetryTime: 0,
    lastError: null,
  });

  useEffect(() => {
    managerRef.current = ReconnectionManager.getInstance(config);
    
    const updateState = (newState: ReconnectionState) => {
      setState(newState);
    };

    // Initial state update
    if (managerRef.current) {
      updateState(managerRef.current.getState());
    }

    return () => {
      if (managerRef.current) {
        managerRef.current.stop();
      }
    };
  }, [config]);

  const attemptReconnection = useCallback(async (reconnectFn: () => Promise<void>) => {
    if (managerRef.current) {
      await managerRef.current.attemptReconnection(reconnectFn, setState);
    }
  }, []);

  const handleConnectionFailure = useCallback((reconnectFn: () => Promise<void>) => {
    if (managerRef.current) {
      managerRef.current.handleConnectionFailure(reconnectFn, setState);
    }
  }, []);

  const reset = useCallback(() => {
    if (managerRef.current) {
      managerRef.current.reset();
      setState(managerRef.current.getState());
    }
  }, []);

  const isHealthy = useCallback(() => {
    return managerRef.current?.isHealthy() ?? true;
  }, []);

  return {
    ...state,
    attemptReconnection,
    handleConnectionFailure,
    reset,
    isHealthy,
  };
}

// Smart retry logic for different types of operations
export class SmartRetryManager {
  private static instances = new Map<string, SmartRetryManager>();
  private retryCounts = new Map<string, number>();
  private lastRetryTime = new Map<string, number>();

  static getInstance(): SmartRetryManager {
    if (!SmartRetryManager.instances.has('default')) {
      SmartRetryManager.instances.set('default', new SmartRetryManager());
    }
    return SmartRetryManager.instances.get('default')!;
  }

  async executeWithRetry<T>(
    operation: string,
    fn: () => Promise<T>,
    options: {
      maxRetries?: number;
      baseDelay?: number;
      maxDelay?: number;
      exponentialBackoff?: boolean;
    } = {}
  ): Promise<T> {
    const {
      maxRetries = 3,
      baseDelay = 1000,
      maxDelay = 10000,
      exponentialBackoff = true,
    } = options;

    const retryCount = this.retryCounts.get(operation) || 0;
    
    if (retryCount >= maxRetries) {
      throw new Error(`Max retries exceeded for operation: ${operation}`);
    }

    try {
      const result = await fn();
      this.retryCounts.set(operation, 0);
      this.lastRetryTime.set(operation, 0);
      return result;
    } catch (error) {
      this.retryCounts.set(operation, retryCount + 1);
      this.lastRetryTime.set(operation, Date.now());

      const delay = exponentialBackoff 
        ? Math.min(baseDelay * Math.pow(2, retryCount), maxDelay)
        : baseDelay;

      await new Promise(resolve => setTimeout(resolve, delay));
      
      return this.executeWithRetry(operation, fn, options);
    }
  }

  getRetryCount(operation: string): number {
    return this.retryCounts.get(operation) || 0;
  }

  getLastRetryTime(operation: string): number {
    return this.lastRetryTime.get(operation) || 0;
  }

  resetOperation(operation: string): void {
    this.retryCounts.delete(operation);
    this.lastRetryTime.delete(operation);
  }

  resetAll(): void {
    this.retryCounts.clear();
    this.lastRetryTime.clear();
  }
}

// Network quality monitor
export class NetworkQualityMonitor {
  private static instances = new Map<string, NetworkQualityMonitor>();
  private rttMeasurements: number[] = [];
  private packetLossRate = 0;
  private isUnreliable = false;

  static getInstance(): NetworkQualityMonitor {
    if (!NetworkQualityMonitor.instances.has('default')) {
      NetworkQualityMonitor.instances.set('default', new NetworkQualityMonitor());
    }
    return NetworkQualityMonitor.instances.get('default')!;
  }

  measureRTT(): Promise<number> {
    return new Promise((resolve) => {
      const start = performance.now();
      
      // Simple ping using fetch
      fetch('/api/health', { 
        method: 'HEAD',
        cache: 'no-cache'
      }).then(() => {
        const rtt = performance.now() - start;
        this.recordRTT(rtt);
        resolve(rtt);
      }).catch(() => {
        resolve(Infinity);
      });
    });
  }

  private recordRTT(rtt: number): void {
    this.rttMeasurements.push(rtt);
    
    // Keep only last 10 measurements
    if (this.rttMeasurements.length > 10) {
      this.rttMeasurements.shift();
    }

    this.updateNetworkQuality();
  }

  private updateNetworkQuality(): void {
    if (this.rttMeasurements.length < 3) return;

    const avgRTT = this.rttMeasurements.reduce((a, b) => a + b, 0) / this.rttMeasurements.length;
    const maxRTT = Math.max(...this.rttMeasurements);
    
    // Consider network unreliable if:
    // - Average RTT > 1000ms
    // - Max RTT > 3000ms
    // - High variance in RTT
    this.isUnreliable = avgRTT > 1000 || maxRTT > 3000;
  }

  isNetworkUnreliable(): boolean {
    return this.isUnreliable;
  }

  getAverageRTT(): number {
    if (this.rttMeasurements.length === 0) return 0;
    return this.rttMeasurements.reduce((a, b) => a + b, 0) / this.rttMeasurements.length;
  }
}