'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useOptimizedSocketContext } from '@/contexts/OptimizedSocketContext';
import { useReconnectionManager } from '@/lib/reconnection-manager';
import { NetworkQualityMonitor } from '@/lib/reconnection-manager';

interface PerformanceMetrics {
  connectionTime: number;
  messageRate: number;
  lastMessageTime: number;
  totalMessages: number;
  queueLength: number;
  rtt: number;
  isHealthy: boolean;
  retryCount: number;
}

export function PerformanceMonitor() {
  const socketContext = useOptimizedSocketContext();
  const reconnectionManager = useReconnectionManager({
    maxRetries: 5,
    initialDelay: 500,
    maxDelay: 10000,
  });
  
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    connectionTime: 0,
    messageRate: 0,
    lastMessageTime: 0,
    totalMessages: 0,
    queueLength: 0,
    rtt: 0,
    isHealthy: true,
    retryCount: 0,
  });

  const [isMonitoring, setIsMonitoring] = useState(false);
  const [networkQuality, setNetworkQuality] = useState<'excellent' | 'good' | 'fair' | 'poor'>('excellent');
  const monitorRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialMount = useRef(true);

  const networkMonitor = NetworkQualityMonitor.getInstance();

  // Move updateMetrics function before useEffect
  const updateMetrics = async () => {
    const newMetrics: PerformanceMetrics = {
      connectionTime: socketContext.performanceMetrics.connectionTime,
      messageRate: socketContext.performanceMetrics.messageRate,
      lastMessageTime: socketContext.performanceMetrics.lastMessageTime,
      totalMessages: socketContext.performanceMetrics.totalMessages,
      queueLength: socketContext.queueLength,
      rtt: await networkMonitor.measureRTT(),
      isHealthy: reconnectionManager.isHealthy(),
      retryCount: reconnectionManager.retryCount || 0,
    };

    // Determine network quality
    let quality: 'excellent' | 'good' | 'fair' | 'poor' = 'excellent';
    if (newMetrics.rtt > 2000) quality = 'poor';
    else if (newMetrics.rtt > 1000) quality = 'fair';
    else if (newMetrics.rtt > 500) quality = 'good';

    setMetrics(newMetrics);
    setNetworkQuality(quality);
  };

  useEffect(() => {
    if (isMonitoring) {
      monitorRef.current = setInterval(updateMetrics, 2000);
    } else {
      // Clear interval when monitoring stops
      if (monitorRef.current) {
        clearInterval(monitorRef.current);
        monitorRef.current = null;
      }
    }

    return () => {
      if (monitorRef.current) {
        clearInterval(monitorRef.current);
      }
    };
  }, [isMonitoring]);

  // Initial metrics update when component mounts
  useEffect(() => {
    updateMetrics();
  }, [socketContext, reconnectionManager]);

  const startMonitoring = () => {
    setIsMonitoring(true);
    updateMetrics();
  };

  const stopMonitoring = () => {
    setIsMonitoring(false);
    if (monitorRef.current) {
      clearInterval(monitorRef.current);
    }
  };

  const resetMetrics = () => {
    // Reset socket performance metrics
    // Note: This would need to be implemented in the socket context
    updateMetrics();
  };

  const getHealthStatus = () => {
    const { connected, hasPendingMessages } = socketContext;
    const { isHealthy, retryCount } = reconnectionManager;
    
    if (!connected) return { status: 'disconnected', color: 'red', icon: '🔴' };
    if (!isHealthy && retryCount > 0) return { status: 'reconnecting', color: 'yellow', icon: '🟡' };
    if (hasPendingMessages) return { status: 'syncing', color: 'blue', icon: '🔄' };
    if (networkQuality === 'poor') return { status: 'unreliable', color: 'orange', icon: '⚠️' };
    
    return { status: 'healthy', color: 'green', icon: '🟢' };
  };

  const health = getHealthStatus();

  const getNetworkQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'fair': return 'text-yellow-600';
      case 'poor': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getHealthColor = (color: string) => {
    switch (color) {
      case 'green': return 'text-green-600';
      case 'yellow': return 'text-yellow-600';
      case 'red': return 'text-red-600';
      case 'blue': return 'text-blue-600';
      case 'orange': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">📊</span>
          <h2 className="text-lg font-semibold">Performance Monitor</h2>
          <span className={`px-2 py-1 rounded text-sm ${
            isMonitoring ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
          }`}>
            {isMonitoring ? 'Monitoring' : 'Stopped'}
          </span>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={isMonitoring ? stopMonitoring : startMonitoring}
            className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100"
          >
            {isMonitoring ? 'Stop' : 'Start'} Monitoring
          </button>
          <button 
            onClick={resetMetrics}
            className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100"
            disabled={!isMonitoring}
          >
            Reset
          </button>
        </div>
      </div>

      {/* Health Status */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="flex items-center gap-2 text-lg font-semibold mb-2">
          <span className={getHealthColor(health.color)}>{health.icon}</span>
          System Health: {health.status}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Connection Status */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className={socketContext.connected ? 'text-green-500' : 'text-red-500'}>📡</span>
              <span className="text-sm font-medium">Connection</span>
            </div>
            <div className="text-2xl font-bold">
              {socketContext.connected ? 'Connected' : 'Disconnected'}
            </div>
          </div>

          {/* Network Quality */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className={getNetworkQualityColor(networkQuality)}>📈</span>
              <span className="text-sm font-medium">Network Quality</span>
            </div>
            <div className="text-2xl font-bold capitalize">{networkQuality}</div>
          </div>

          {/* Message Rate */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-blue-500">⚡</span>
              <span className="text-sm font-medium">Message Rate</span>
            </div>
            <div className="text-2xl font-bold">{metrics.messageRate}/s</div>
          </div>

          {/* Queue Length */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className={metrics.queueLength > 0 ? 'text-yellow-500' : 'text-green-500'}>📦</span>
              <span className="text-sm font-medium">Queue Length</span>
            </div>
            <div className="text-2xl font-bold">{metrics.queueLength}</div>
          </div>
        </div>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Connection Metrics */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-3">Connection Metrics</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Connection Time</span>
              <span className="font-mono">{metrics.connectionTime}ms</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">RTT (Round Trip Time)</span>
              <span className="font-mono">{metrics.rtt}ms</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Last Message</span>
              <span className="font-mono">
                {metrics.lastMessageTime ? new Date(metrics.lastMessageTime).toLocaleTimeString() : 'Never'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Messages</span>
              <span className="font-mono">{metrics.totalMessages}</span>
            </div>
          </div>
        </div>

        {/* Reconnection Metrics */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-3">Reconnection Metrics</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Is Healthy</span>
              <span className={`font-mono ${metrics.isHealthy ? 'text-green-600' : 'text-red-600'}`}>
                {metrics.isHealthy ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Retry Count</span>
              <span className={`font-mono ${metrics.retryCount > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                {metrics.retryCount}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Connection State</span>
              <span className="font-mono capitalize">{socketContext.connectionState}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Has Pending Messages</span>
              <span className={`font-mono ${socketContext.hasPendingMessages ? 'text-yellow-600' : 'text-green-600'}`}>
                {socketContext.hasPendingMessages ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Tips */}
      {metrics.rtt > 1000 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="flex items-center gap-2 text-yellow-800 font-semibold mb-2">
            <span>⚠️</span>
            Performance Warning
          </h3>
          <p className="text-yellow-700 mb-2">
            High network latency detected ({metrics.rtt}ms). Consider:
          </p>
          <ul className="text-yellow-600 space-y-1 text-sm">
            <li>• Checking your internet connection</li>
            <li>• Moving closer to your router</li>
            <li>• Reducing network congestion</li>
            <li>• Using a wired connection if possible</li>
          </ul>
        </div>
      )}

      {metrics.queueLength > 10 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <h3 className="flex items-center gap-2 text-orange-800 font-semibold mb-2">
            <span>⏰</span>
            Message Queue Warning
          </h3>
          <p className="text-orange-700 mb-2">
            High message queue ({metrics.queueLength} messages). This may indicate:
          </p>
          <ul className="text-orange-600 space-y-1 text-sm">
            <li>• Network connectivity issues</li>
            <li>• Server overload</li>
            <li>• Client processing delays</li>
          </ul>
        </div>
      )}
    </div>
  );
}