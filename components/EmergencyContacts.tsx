'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { notificationManager } from '@/components/NotificationManager';
import type { Station } from '@/types';

// No default stations - will fetch from Firebase
const DEFAULT_STATIONS: Station[] = [];

interface EmergencyContactsProps {
  userLocation?: { lat: number; lng: number } | null;
  variant?: 'admin' | 'display' | 'safety-tips';
}

export function EmergencyContacts({ userLocation, variant = 'display' }: EmergencyContactsProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmergencyContacts();
  }, []);

  const fetchEmergencyContacts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/stations');
      if (response.ok) {
        const data = await response.json();
        setStations(data.stations || []);
        
        // Cache data locally for offline access
        try {
          localStorage.setItem('bready_stations', JSON.stringify(data.stations || []));
        } catch (storageError) {
          console.warn('Failed to cache stations locally:', storageError);
        }
      } else {
        throw new Error('Failed to fetch stations');
      }
    } catch (error) {
      console.error('Error fetching stations from API:', error);

      // Try to load from local cache first
      try {
        const cachedStations = localStorage.getItem('bready_stations');

        if (cachedStations) {
          setStations(JSON.parse(cachedStations));
          console.log('✅ Loaded stations from local cache');
        } else {
          // No cached data, use empty array
          setStations([]);
          console.log('ℹ️ No stations available (no cache or API response)');
        }
      } catch (cacheError) {
        console.error('Error loading from cache:', cacheError);
        // Use empty array
        setStations([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const getStationIcon = (type: string) => {
    switch (type) {
      case 'fire': return '🔥';
      case 'police': return '🚓';
      case 'medical': return '🏥';
      case 'barangay': return '🏘️';
      default: return '🏢';
    }
  };

  const getStationTypeLabel = (type: string) => {
    switch (type) {
      case 'fire': return 'Fire Station';
      case 'police': return 'Police Station';
      case 'medical': return 'Medical Center';
      case 'barangay': return 'Barangay Hall';
      default: return 'Station';
    }
  };

  const getStationStatusColor = (status: string) => {
    switch (status) {
      case 'operational': return 'bg-green-500';
      case 'overloaded': return 'bg-yellow-500';
      case 'closed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStationStatusText = (status: string) => {
    switch (status) {
      case 'operational': return 'Operational';
      case 'overloaded': return 'Overloaded';
      case 'closed': return 'Closed';
      default: return '';
    }
  };

  const handleEditStations = () => {
    router.push('/real-time-map');
  };

  const handleCallStation = (contact: string) => {
    if (typeof window !== 'undefined') {
      window.open(`tel:${contact}`);
    }
  };

  // Admin variant - show edit stations button
  if (variant === 'admin' && (!user || user.role !== 'admin')) {
    return null;
  }

  // Admin view
  if (variant === 'admin') {
    return (
      <div className="bg-white rounded-lg p-6 shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Emergency Stations</h3>
          <button
            onClick={handleEditStations}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
          >
            📍 Edit Stations
          </button>
        </div>

        {loading ? (
          <div className="text-center py-4">Loading stations...</div>
        ) : stations.length === 0 ? (
          <div className="text-center py-4 text-gray-500">No stations found</div>
        ) : (
          <div className="space-y-4">
            {stations.map((station) => (
              <div key={station.id} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-lg font-semibold">{station.name}</h4>
                      <span className="text-sm text-gray-500 capitalize">{getStationTypeLabel(station.type)}</span>
                    </div>
                    <div className="text-sm text-gray-600 mb-1">
                      📞 {station.phone || station.contact || 'No contact available'}
                    </div>
                    <div className="text-sm text-gray-500 mb-2">📍 {station.address}</div>
                    <div className="flex gap-4 text-sm text-gray-600 mb-2">
                      <span className={`px-2 py-1 rounded text-white text-xs ${getStationStatusColor(station.status)}`}>
                        {getStationStatusText(station.status)}
                      </span>
                    </div>
                    {station.location && (
                      <div className="text-xs text-gray-400 mb-2">
                        Coordinates: {station.location.lat.toFixed(6)}, {station.location.lng.toFixed(6)}
                      </div>
                    )}
                    {station.description && (
                      <div className="text-sm text-gray-600">
                        {station.description}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))} 
          </div>
        )}
      </div>
    );
  }

  // Display variant - user-facing
  if (variant === 'display') {
    return (
      <div className="mt-8 bg-white rounded-xl p-6 shadow-lg border">
        <h2 className="text-2xl font-bold mb-6">Emergency Stations</h2>
        
        {loading ? (
          <div className="text-center py-4">Loading stations...</div>
        ) : stations.length === 0 ? (
          <div className="text-center py-4 text-gray-500">No stations available</div>
        ) : (
          <div className="space-y-4">
            {stations.map((station) => (
              <div key={station.id} className="border rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-lg font-semibold">{station.name}</h4>
                      <span className="text-sm text-blue-600 capitalize bg-blue-100 px-2 py-1 rounded">
                        {getStationTypeLabel(station.type)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mb-1">
                      <span className="font-medium">Contact:</span> {station.phone || station.contact || 'No contact available'}
                    </div>
                    <div className="text-sm text-gray-500 mb-2">
                      <span className="font-medium">Address:</span> {station.address}
                    </div>
                    <div className="flex gap-4 text-sm text-gray-600 mb-2">
                      <span className={`px-2 py-1 rounded text-white text-xs ${getStationStatusColor(station.status)}`}>
                        {getStationStatusText(station.status)}
                      </span>
                    </div>
                    {station.location && (
                      <div className="text-xs text-gray-400 mb-2">
                        <span className="font-medium">Location:</span> {station.location.lat.toFixed(6)}, {station.location.lng.toFixed(6)}
                      </div>
                    )}
                    {station.description && (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Details:</span> {station.description}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleCallStation(station.contact)}
                      className="px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm"
                    >
                      Call
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Safety Tips variant - simplified display for safety tips page
  return (
    <div className="bg-white rounded-lg p-6 shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Emergency Contacts</h3>
      </div>

      {loading ? (
        <div className="text-center text-gray-500 py-4">
          Loading stations...
        </div>
      ) : stations.length === 0 ? (
        <div className="text-center text-gray-500 py-4">
          <p>No emergency stations available yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {stations.map((station) => (
            <div
              key={station.id}
              className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-bold text-lg">
                    {getStationIcon(station.type)}
                  </div>
                  <div>
                    <div className="font-bold text-lg">{station.name}</div>
                    <div className="text-sm text-blue-600 capitalize bg-blue-100 px-2 py-1 rounded mt-1 mb-2">
                      {getStationTypeLabel(station.type)}
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      📞 <a href={`tel:${station.phone || station.contact}`} className="text-blue-600 hover:text-blue-800 underline">
                        {station.phone || station.contact || 'No contact available'}
                      </a>
                    </div>
                    <div className="text-sm text-gray-500 mb-2">📍 {station.address}</div>
                    {station.email && (
                      <div className="text-sm text-blue-600 mt-1 mb-1">
                        ✉️ <a href={`mailto:${station.email}`} className="hover:text-blue-800 underline">
                          {station.email}
                        </a>
                      </div>
                    )}
                    {station.website && (
                      <div className="text-sm text-blue-600 mt-1 mb-1">
                        🌐 <a href={station.website} target="_blank" rel="noopener noreferrer" className="hover:text-blue-800 underline">
                          {station.website}
                        </a>
                      </div>
                    )}
                    {station.description && (
                      <div className="text-sm text-gray-600 mt-2">
                        {station.description}
                      </div>
                    )}
                    {station.emergencyContacts && station.emergencyContacts.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="text-sm font-semibold mb-2">Emergency Contacts:</div>
                        <div className="space-y-1">
                          {station.emergencyContacts.map((contact) => (
                            <div key={contact.id} className="text-sm text-gray-600">
                              <div className="flex justify-between items-center">
                                <span>{contact.name} ({contact.type})</span>
                                <a href={`tel:${contact.phone}`} className="text-blue-600 hover:text-blue-800 underline">
                                  {contact.phone}
                                </a>
                              </div>
                              {contact.address && (
                                <div className="text-xs text-gray-500 mt-1">
                                  {contact.address}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="text-sm text-blue-800">
          <strong>Note:</strong> Emergency stations are displayed based on your location and the type of emergency.
        </div>
      </div>
    </div>
  );
}
