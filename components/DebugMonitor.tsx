'use client';

import { useEffect, useState, useRef } from 'react';
import { useOptimizedSocketContext } from '@/contexts/OptimizedSocketContext';
import { useAuth } from '@/contexts/AuthContext';

interface DebugStats {
  reportsCount: number;
  reportsSize: number;
  reportsLastUpdate: string;
  connectionState: string;
  connected: boolean;
  queueLength: number;
  hasPendingMessages: boolean;
  lastMessageTime: string;
  userLocation: string;
  mapReady: boolean;
  stationsCount: number;
  errorCount: number;
  retryCount: number;
}

export function DebugMonitor() {
  const { reports, connected, connectionState, queueLength, hasPendingMessages, refreshReports } = useOptimizedSocketContext();
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [stats, setStats] = useState<DebugStats>({
    reportsCount: 0,
    reportsSize: 0,
    reportsLastUpdate: '',
    connectionState: 'unknown',
    connected: false,
    queueLength: 0,
    hasPendingMessages: false,
    lastMessageTime: '',
    userLocation: 'unknown',
    mapReady: false,
    stationsCount: 0,
    errorCount: 0,
    retryCount: 0
  });
  const statsRef = useRef(stats);

  // Update stats periodically
  useEffect(() => {
    const updateStats = () => {
      const newStats: DebugStats = {
        reportsCount: reports?.length || 0,
        reportsSize: JSON.stringify(reports).length,
        reportsLastUpdate: reports ? new Date().toISOString() : '',
        connectionState,
        connected,
        queueLength,
        hasPendingMessages,
        lastMessageTime: new Date().toISOString(),
        userLocation: 'unknown', // Would need to be passed from parent
        mapReady: false, // Would need to be passed from parent
        stationsCount: 0, // Would need to be passed from parent
        errorCount: 0, // Would need to be passed from parent
        retryCount: 0 // Would need to be passed from parent
      };

      statsRef.current = newStats;
      setStats(newStats);
    };

    updateStats();

    // Update every 2 seconds
    const interval = setInterval(updateStats, 2000);
    return () => clearInterval(interval);
  }, [reports, connected, connectionState, queueLength, hasPendingMessages]);

  // Toggle visibility with keyboard shortcut
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'd') {
        setIsVisible(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-gray-800 text-white px-3 py-2 rounded-lg text-sm opacity-50 hover:opacity-100 transition-opacity z-50"
        title="Ctrl+Shift+D to toggle debug monitor"
      >
        🐛 Debug
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border-2 border-gray-300 rounded-lg shadow-xl p-4 max-w-md z-50">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-sm">Debug Monitor</h3>
        <div className="flex gap-2">
          <button
            onClick={() => {
              console.log('🔄 Force refreshing reports from debug monitor...');
              refreshReports();
            }}
            className="px-2 py-1 bg-purple-500 text-white text-xs rounded hover:bg-purple-600"
          >
            Refresh
          </button>
          <button
            onClick={() => setIsVisible(false)}
            className="px-2 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600"
          >
            Hide
          </button>
        </div>
      </div>

      <div className="space-y-2 text-xs">
        {/* Connection Status */}
        <div className="border-t border-gray-200 pt-2">
          <div className="font-semibold mb-1">📡 Connection</div>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                connected ? 'bg-green-500' : 
                connectionState === 'connecting' || connectionState === 'reconnecting' ? 'bg-yellow-500 animate-pulse' :
                'bg-red-500'
              }`}></div>
              <span className="text-gray-600">Status: {connected ? 'Connected' : connectionState}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-600">Queue: {queueLength}</span>
              {hasPendingMessages && <span className="text-orange-600 bg-orange-100 px-1 rounded">Pending</span>}
            </div>
          </div>
        </div>

        {/* Reports Status */}
        <div className="border-t border-gray-200 pt-2">
          <div className="font-semibold mb-1">📋 Reports</div>
          <div className="grid grid-cols-2 gap-2">
            <div className="text-gray-600">Count: {stats.reportsCount}</div>
            <div className="text-gray-600">Size: {(stats.reportsSize / 1024).toFixed(2)} KB</div>
            <div className="text-gray-600">Last Update: {stats.reportsLastUpdate}</div>
            <div className="text-gray-600">Active: {reports?.filter(r => r.status === 'current' || r.status === 'approved').length || 0}</div>
          </div>
        </div>

        {/* User Info */}
        <div className="border-t border-gray-200 pt-2">
          <div className="font-semibold mb-1">👤 User</div>
          <div className="text-gray-600">Role: {user?.role || 'unknown'}</div>
          <div className="text-gray-600">UID: {user?.uid || 'unknown'}</div>
        </div>

        {/* Performance Indicators */}
        <div className="border-t border-gray-200 pt-2">
          <div className="font-semibold mb-1">⚡ Performance</div>
          <div className="grid grid-cols-2 gap-2">
            <div className="text-gray-600">Map Ready: {stats.mapReady ? 'Yes' : 'No'}</div>
            <div className="text-gray-600">Stations: {stats.stationsCount}</div>
            <div className="text-gray-600">Errors: {stats.errorCount}</div>
            <div className="text-gray-600">Retries: {stats.retryCount}</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="border-t border-gray-200 pt-2">
          <div className="font-semibold mb-1">🔧 Actions</div>
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => console.log('📊 Current stats:', stats)}
              className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
            >
              Log Stats
            </button>
            <button
              onClick={() => console.log('📡 Socket context:', { reports, connected, connectionState, queueLength, hasPendingMessages })}
              className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
            >
              Log Context
            </button>
            <button
              onClick={() => console.log('👤 User context:', user)}
              className="px-2 py-1 bg-yellow-500 text-white text-xs rounded hover:bg-yellow-600"
            >
              Log User
            </button>
            <button
              onClick={() => {
                console.log('🔍 Detailed report analysis:');
                if (reports) {
                  console.log('All reports:', reports);
                  console.log('Active reports:', reports.filter(r => r.status === 'current' || r.status === 'approved'));
                  console.log('Report types:', Array.from(new Set(reports.map(r => r.type))));
                  console.log('Report locations:', reports.map(r => r.location));
                }
              }}
              className="px-2 py-1 bg-purple-500 text-white text-xs rounded hover:bg-purple-600"
            >
              Analyze Reports
            </button>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="border-t border-gray-200 pt-2">
          <div className="font-semibold mb-1">🚦 Status</div>
          <div className="flex flex-wrap gap-2">
            {connected && <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Connected</span>}
            {queueLength > 0 && <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded">Queue: {queueLength}</span>}
            {stats.reportsCount > 0 && <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Reports: {stats.reportsCount}</span>}
            {stats.reportsSize > 50000 && <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">Large Payload</span>}
          </div>
        </div>
      </div>
    </div>
  );
}