'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { notificationManager } from '@/components/NotificationManager';
import type { Station } from '@/types';

// Default offline stations data (copied from Real Time Map)
const DEFAULT_STATIONS: Station[] = [
  {
    id: 'fire_1',
    name: 'Manila Fire Station',
    type: 'fire',
    location: { lat: 14.5820, lng: 120.9730 },
    address: '1015 Padre Burgos Ave, Ermita, Manila',
    capacity: 10,
    currentLoad: 3,
    status: 'operational',
    contact: '+63 2 8527 7000',
    description: 'Main fire station for Manila City',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'police_1',
    name: 'Manila Police Station',
    type: 'police',
    location: { lat: 14.5800, lng: 120.9750 },
    address: '275 Padre Burgos Ave, Ermita, Manila',
    capacity: 20,
    currentLoad: 8,
    status: 'operational',
    contact: '+63 2 8527 0000',
    description: 'Central police station for Manila',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'medical_1',
    name: 'Philippine General Hospital',
    type: 'medical',
    location: { lat: 14.5600, lng: 120.9890 },
    address: 'Taft Avenue, Ermita, Manila',
    capacity: 500,
    currentLoad: 245,
    status: 'operational',
    contact: '+63 2 8554 8400',
    description: 'National university hospital',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'barangay_1',
    name: 'Barangay San Antonio',
    type: 'barangay',
    location: { lat: 14.5800, lng: 120.9700 },
    address: 'San Antonio St, Ermita, Manila',
    capacity: 100,
    currentLoad: 15,
    status: 'operational',
    contact: '+63 2 8527 1234',
    description: 'Local barangay hall for community assistance',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

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
      const response = await fetch('/api/emergency-contacts');
      if (response.ok) {
        const data = await response.json();
        setStations(data.contacts || []);
        
        // Cache data locally for offline access
        try {
          localStorage.setItem('bready_emergency_contacts', JSON.stringify(data.contacts || []));
        } catch (storageError) {
          console.warn('Failed to cache emergency contacts locally:', storageError);
        }
      } else {
        throw new Error('Failed to fetch emergency contacts');
      }
    } catch (error) {
      console.error('Error fetching emergency contacts from API:', error);

      // Try to load from local cache first
      try {
        const cachedContacts = localStorage.getItem('bready_emergency_contacts');

        if (cachedContacts) {
          setStations(JSON.parse(cachedContacts));
          console.log('✅ Loaded emergency contacts from local cache');
        } else {
          // No cached data, use defaults
          setStations(DEFAULT_STATIONS);
          console.log('ℹ️ Using default emergency contacts (no cache available)');
        }
      } catch (cacheError) {
        console.error('Error loading from cache:', cacheError);
        // Use default data
        setStations(DEFAULT_STATIONS);
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
                    <div className="text-sm text-gray-600">{getStationTypeLabel(station.type)}</div>
                    <div className="text-sm text-gray-600 mt-1">📍 {station.address}</div>
                    <div className="flex gap-4 text-sm text-gray-600 mt-2">
                      <span className={`px-2 py-1 rounded text-white text-xs ${getStationStatusColor(station.status)}`}>
                        {getStationStatusText(station.status)}
                      </span>
                    </div>
                    {station.email && (
                      <div className="text-sm text-blue-600 mt-1">
                        <span className="font-medium">Email:</span> {station.email}
                      </div>
                    )}
                    {station.website && (
                      <div className="text-sm text-blue-600 mt-1">
                        <span className="font-medium">Website:</span> {station.website}
                      </div>
                    )}
                  </div>
                </div>
                    <div className="flex flex-col items-end gap-2">
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
