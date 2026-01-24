'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { notificationManager } from '@/components/NotificationManager';

interface DisasterWarning {
  id: string;
  type: 'typhoon' | 'flood' | 'earthquake' | 'fire' | 'landslide' | 'volcano';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  location: string;
  timestamp: string;
  expiresAt: string;
  active: boolean;
}

export function DisasterWarnings() {
  const { user } = useAuth();
  const [warnings, setWarnings] = useState<DisasterWarning[]>([]);
  const [showDetails, setShowDetails] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role === 'resident') {
      // Load warnings from localStorage or API
      const savedWarnings = localStorage.getItem('bready_warnings');
      if (savedWarnings) {
        try {
          setWarnings(JSON.parse(savedWarnings));
        } catch (error) {
          console.error('Error parsing warnings:', error);
        }
      } else {
        // Create some sample warnings
        const sampleWarnings: DisasterWarning[] = [
          {
            id: '1',
            type: 'typhoon',
            title: 'Typhoon Warning',
            description: 'Typhoon "Maring" is approaching the northern region. Expect heavy rainfall and strong winds.',
            severity: 'high',
            location: 'Northern Philippines',
            timestamp: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            active: true
          },
          {
            id: '2',
            type: 'flood',
            title: 'Flood Alert',
            description: 'Heavy rainfall has caused flooding in low-lying areas. Avoid traveling to affected zones.',
            severity: 'medium',
            location: 'Metro Manila',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
            active: true
          },
          {
            id: '3',
            type: 'earthquake',
            title: 'Earthquake Warning',
            description: 'Seismic activity detected. Be prepared for possible aftershocks.',
            severity: 'low',
            location: 'Central Luzon',
            timestamp: new Date(Date.now() - 7200000).toISOString(),
            expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
            active: true
          }
        ];
        setWarnings(sampleWarnings);
        localStorage.setItem('bready_warnings', JSON.stringify(sampleWarnings));
      }
    }
  }, [user?.role]);

  const getWarningIcon = (type: string) => {
    switch (type) {
      case 'typhoon': return '🌀';
      case 'flood': return '🌊';
      case 'earthquake': return '🌋';
      case 'fire': return '🔥';
      case 'landslide': return '⛰️';
      case 'volcano': return '🌋';
      default: return '⚠️';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getSeverityText = (severity: string) => {
    switch (severity) {
      case 'critical': return 'CRITICAL';
      case 'high': return 'HIGH';
      case 'medium': return 'MEDIUM';
      case 'low': return 'LOW';
      default: return 'UNKNOWN';
    }
  };

  const dismissWarning = (id: string) => {
    const updated = warnings.map(w => 
      w.id === id ? { ...w, active: false } : w
    );
    setWarnings(updated);
    localStorage.setItem('bready_warnings', JSON.stringify(updated));
    notificationManager.success('Warning dismissed');
  };

  const refreshWarnings = () => {
    // In a real app, this would fetch from an API
    notificationManager.info('Checking for new warnings...');
  };

  if (!user || user.role !== 'resident') {
    return null;
  }

  const activeWarnings = warnings.filter(w => w.active);

  return (
    <div className="bg-white rounded-lg p-6 shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Disaster Warnings</h3>
        <div className="flex gap-2">
          <button
            onClick={refreshWarnings}
            className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:opacity-90 text-sm"
          >
            🔄 Refresh
          </button>
          {activeWarnings.length > 0 && (
            <span className="px-2 py-1 bg-red-500 text-white text-sm rounded-full">
              {activeWarnings.length}
            </span>
          )}
        </div>
      </div>

      {activeWarnings.length === 0 ? (
        <div className="text-center text-gray-500 py-4">
          <div className="text-4xl mb-2">✅</div>
          <p>No active warnings in your area</p>
        </div>
      ) : (
        <div className="space-y-4">
          {activeWarnings.map((warning) => (
            <div
              key={warning.id}
              className={`border border-gray-200 rounded-lg p-4 ${
                warning.severity === 'critical' ? 'bg-red-50' : 
                warning.severity === 'high' ? 'bg-orange-50' : 
                warning.severity === 'medium' ? 'bg-yellow-50' : 'bg-blue-50'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 ${getSeverityColor(warning.severity)} rounded-full flex items-center justify-center text-white font-bold`}>
                    {getWarningIcon(warning.type)}
                  </div>
                  <div>
                    <div className="font-bold text-lg">{warning.title}</div>
                    <div className="text-sm text-gray-600">{warning.location}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`px-2 py-1 rounded-full text-xs font-semibold text-white ${getSeverityColor(warning.severity)}`}>
                    {getSeverityText(warning.severity)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Expires: {new Date(warning.expiresAt).toLocaleString()}
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-700 mb-3">{warning.description}</p>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowDetails(showDetails === warning.id ? null : warning.id)}
                  className="px-3 py-1 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-sm"
                >
                  {showDetails === warning.id ? 'Hide Details' : 'More Info'}
                </button>
                <button
                  onClick={() => dismissWarning(warning.id)}
                  className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm"
                >
                  Dismiss
                </button>
              </div>

              {showDetails === warning.id && (
                <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200">
                  <div className="text-sm space-y-2">
                    <div><strong>Type:</strong> {warning.type}</div>
                    <div><strong>Location:</strong> {warning.location}</div>
                    <div><strong>Issued:</strong> {new Date(warning.timestamp).toLocaleString()}</div>
                    <div><strong>Expires:</strong> {new Date(warning.expiresAt).toLocaleString()}</div>
                    <div><strong>Severity:</strong> {getSeverityText(warning.severity)}</div>
                  </div>
                  <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="text-sm text-yellow-800">
                      <strong>Safety Tips:</strong>
                      {warning.type === 'typhoon' && ' Stay indoors, secure loose objects, and avoid coastal areas.'}
                      {warning.type === 'flood' && ' Avoid walking or driving through floodwaters. Move to higher ground if necessary.'}
                      {warning.type === 'earthquake' && ' Drop, cover, and hold on. Stay away from windows and heavy objects.'}
                      {warning.type === 'fire' && ' Stay away from the fire area. Follow evacuation orders if issued.'}
                      {warning.type === 'landslide' && ' Avoid slopes and hillsides. Move to stable ground immediately.'}
                      {warning.type === 'volcano' && ' Follow evacuation orders. Avoid ash fall areas and wear protective masks.'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="text-sm text-blue-800">
          <strong>Note:</strong> This is a sample warning system. In a production environment, 
          you would integrate with official disaster monitoring agencies for real-time alerts.
        </div>
      </div>
    </div>
  );
}