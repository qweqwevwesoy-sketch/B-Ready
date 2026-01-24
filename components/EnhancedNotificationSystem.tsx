'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSocketContext } from '@/contexts/SocketContext';
import { notificationManager } from './NotificationManager';

interface Alert {
  id: string;
  type: 'emergency' | 'warning' | 'info' | 'all_clear';
  title: string;
  message: string;
  target: 'all' | 'rescue_teams' | 'residents';
  timestamp: string;
  expiresAt?: string;
  location?: string;
  priority: 'high' | 'medium' | 'low';
}

interface DisasterWarning {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  location: string;
  description: string;
  issuedAt: string;
  expiresAt?: string;
  status: 'active' | 'expired' | 'cancelled';
}

export function EnhancedNotificationSystem() {
  const { user } = useAuth();
  const { reports } = useSocketContext();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [disasterWarnings, setDisasterWarnings] = useState<DisasterWarning[]>([]);
  const [showAlertForm, setShowAlertForm] = useState(false);
  const [alertForm, setAlertForm] = useState({
    type: 'warning' as Alert['type'],
    title: '',
    message: '',
    target: 'all' as Alert['target'],
    location: '',
    priority: 'medium' as Alert['priority'],
    expiresAt: ''
  });

  const loadExistingData = () => {
    const savedAlerts = localStorage.getItem('bready_admin_alerts');
    const savedWarnings = localStorage.getItem('bready_disaster_warnings');
    
    if (savedAlerts) {
      try {
        setAlerts(JSON.parse(savedAlerts));
      } catch (error) {
        console.error('Error loading alerts:', error);
      }
    }
    
    if (savedWarnings) {
      try {
        setDisasterWarnings(JSON.parse(savedWarnings));
      } catch (error) {
        console.error('Error loading warnings:', error);
      }
    }
  };

  const generateDisasterWarnings = () => {
    // Analyze reports to generate disaster warnings
    const currentReports = reports.filter(r => r.status === 'current');
    
    if (currentReports.length > 0) {
      const newWarnings: DisasterWarning[] = [];
      
      // Group reports by type and location
      const reportGroups = currentReports.reduce((acc, report) => {
        const key = `${report.type}-${report.address}`;
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(report);
        return acc;
      }, {} as Record<string, typeof currentReports>);

      Object.entries(reportGroups).forEach(([key, groupReports]) => {
        const type = groupReports[0].type;
        const location = groupReports[0].address;
        const count = groupReports.length;
        
        // Determine severity based on report count and type
        let severity: DisasterWarning['severity'] = 'low';
        if (count >= 5) severity = 'critical';
        else if (count >= 3) severity = 'high';
        else if (count >= 2) severity = 'medium';
        else severity = 'low';

        // Only create warning if it doesn't already exist
        const existingWarning = disasterWarnings.find(w => 
          w.type === type && w.location === location && w.status === 'active'
        );

        if (!existingWarning) {
          const newWarning: DisasterWarning = {
            id: `warning-${Date.now()}`,
            type,
            severity,
            location,
            description: `${count} ${type.toLowerCase()} incident(s) reported in ${location}`,
            issuedAt: new Date().toISOString(),
            status: 'active'
          };
          newWarnings.push(newWarning);
        }
      });

      if (newWarnings.length > 0) {
        const updatedWarnings = [...disasterWarnings, ...newWarnings];
        setDisasterWarnings(updatedWarnings);
        localStorage.setItem('bready_disaster_warnings', JSON.stringify(updatedWarnings));
        
        // Show notification about new warnings
        newWarnings.forEach(warning => {
          notificationManager.warning(`New ${warning.severity} ${warning.type} warning in ${warning.location}`);
        });
      }
    }
  };

  const sendAlert = async () => {
    if (!alertForm.title.trim() || !alertForm.message.trim()) {
      notificationManager.error('Please fill in title and message');
      return;
    }

    const newAlert: Alert = {
      id: `alert-${Date.now()}`,
      type: alertForm.type,
      title: alertForm.title,
      message: alertForm.message,
      target: alertForm.target,
      timestamp: new Date().toISOString(),
      location: alertForm.location || undefined,
      priority: alertForm.priority,
      expiresAt: alertForm.expiresAt || undefined
    };

    const updatedAlerts = [newAlert, ...alerts];
    setAlerts(updatedAlerts);
    localStorage.setItem('bready_admin_alerts', JSON.stringify(updatedAlerts));
    
    // Show success notification
    notificationManager.success(`Alert sent to ${alertForm.target}`);
    
    // Clear form and close
    setAlertForm({
      type: 'warning',
      title: '',
      message: '',
      target: 'all',
      location: '',
      priority: 'medium',
      expiresAt: ''
    });
    setShowAlertForm(false);
  };

  const deleteAlert = (id: string) => {
    const updated = alerts.filter(a => a.id !== id);
    setAlerts(updated);
    localStorage.setItem('bready_admin_alerts', JSON.stringify(updated));
  };

  const deleteWarning = (id: string) => {
    const updated = disasterWarnings.map(w => 
      w.id === id ? { ...w, status: 'cancelled' as const } : w
    );
    setDisasterWarnings(updated);
    localStorage.setItem('bready_disaster_warnings', JSON.stringify(updated));
  };

  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'emergency': return '🚨';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      case 'all_clear': return '✅';
      default: return '📢';
    }
  };

  const getAlertColor = (type: Alert['type']) => {
    switch (type) {
      case 'emergency': return 'border-red-500 bg-red-50';
      case 'warning': return 'border-yellow-500 bg-yellow-50';
      case 'info': return 'border-blue-500 bg-blue-50';
      case 'all_clear': return 'border-green-500 bg-green-50';
      default: return 'border-primary bg-primary/10';
    }
  };

  useEffect(() => {
    // Load existing alerts and warnings
    loadExistingData();
    
    // Generate disaster warnings based on reports
    generateDisasterWarnings();
  }, [reports]);

  const getWarningColor = (severity: DisasterWarning['severity']) => {
    switch (severity) {
      case 'critical': return 'border-red-600 bg-red-100';
      case 'high': return 'border-orange-500 bg-orange-100';
      case 'medium': return 'border-yellow-500 bg-yellow-100';
      case 'low': return 'border-blue-500 bg-blue-100';
      default: return 'border-gray-400 bg-gray-100';
    }
  };

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Alert Broadcasting Section */}
      <div className="bg-white rounded-lg p-6 shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">🚨 Emergency Alert System</h3>
          <button
            onClick={() => setShowAlertForm(!showAlertForm)}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-semibold"
          >
            Send Alert
          </button>
        </div>

        {showAlertForm && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h4 className="font-medium mb-3">Broadcast Emergency Alert</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Alert Type</label>
                <select
                  value={alertForm.type}
                  onChange={(e) => setAlertForm({...alertForm, type: e.target.value as Alert['type']})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="emergency">🚨 Emergency</option>
                  <option value="warning">⚠️ Warning</option>
                  <option value="info">ℹ️ Information</option>
                  <option value="all_clear">✅ All Clear</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Target Audience</label>
                <select
                  value={alertForm.target}
                  onChange={(e) => setAlertForm({...alertForm, target: e.target.value as Alert['target']})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">📢 All Users</option>
                  <option value="rescue_teams">🚒 Rescue Teams</option>
                  <option value="residents">🏠 Residents</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Title</label>
                <input
                  type="text"
                  value={alertForm.title}
                  onChange={(e) => setAlertForm({...alertForm, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Enter alert title..."
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Message</label>
                <textarea
                  value={alertForm.message}
                  onChange={(e) => setAlertForm({...alertForm, message: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Enter detailed alert message..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Location (Optional)</label>
                <input
                  type="text"
                  value={alertForm.location}
                  onChange={(e) => setAlertForm({...alertForm, location: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Specific location..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Priority</label>
                <select
                  value={alertForm.priority}
                  onChange={(e) => setAlertForm({...alertForm, priority: e.target.value as Alert['priority']})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="high">🔴 High</option>
                  <option value="medium">🟡 Medium</option>
                  <option value="low">🟢 Low</option>
                </select>
              </div>
              <div className="md:col-span-2 flex gap-2">
                <button
                  onClick={sendAlert}
                  className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-semibold"
                >
                  🚨 Broadcast Alert
                </button>
                <button
                  onClick={() => setShowAlertForm(false)}
                  className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Recent Alerts */}
        <div>
          <h4 className="font-medium mb-3">Recent Alerts</h4>
          {alerts.length === 0 ? (
            <div className="text-center text-gray-500 py-4">
              No alerts sent yet
            </div>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {alerts.slice(0, 10).map((alert) => (
                <div
                  key={alert.id}
                  className={`border-l-4 rounded-lg p-4 ${getAlertColor(alert.type)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{getAlertIcon(alert.type)}</span>
                        <span className="font-semibold">{alert.title}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          alert.priority === 'high' ? 'bg-red-200 text-red-800' :
                          alert.priority === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                          'bg-green-200 text-green-800'
                        }`}>
                          {alert.priority.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm mb-2">{alert.message}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-600">
                        <span>🎯 {alert.target}</span>
                        <span>⏰ {new Date(alert.timestamp).toLocaleString()}</span>
                        {alert.location && <span>📍 {alert.location}</span>}
                      </div>
                    </div>
                    <button
                      onClick={() => deleteAlert(alert.id)}
                      className="text-red-500 hover:text-red-700 text-sm font-semibold"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Disaster Warnings Section */}
      <div className="bg-white rounded-lg p-6 shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">⚠️ Disaster Warnings</h3>
          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
            {disasterWarnings.filter(w => w.status === 'active').length} Active
          </span>
        </div>

        {disasterWarnings.length === 0 ? (
          <div className="text-center text-gray-500 py-4">
            No active disaster warnings
          </div>
        ) : (
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {disasterWarnings
              .filter(w => w.status === 'active')
              .map((warning) => (
                <div
                  key={warning.id}
                  className={`border-l-4 rounded-lg p-4 ${getWarningColor(warning.severity)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-lg">{warning.type}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          warning.severity === 'critical' ? 'bg-red-200 text-red-800' :
                          warning.severity === 'high' ? 'bg-orange-200 text-orange-800' :
                          warning.severity === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                          'bg-blue-200 text-blue-800'
                        }`}>
                          {warning.severity.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm mb-2">{warning.description}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-600">
                        <span>📍 {warning.location}</span>
                        <span>⏰ {new Date(warning.issuedAt).toLocaleString()}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteWarning(warning.id)}
                      className="text-red-500 hover:text-red-700 text-sm font-semibold"
                    >
                      Cancel Warning
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}