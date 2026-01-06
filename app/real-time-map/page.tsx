'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useSocketContext } from '@/contexts/SocketContext';
import { Header } from '@/components/Header';
import L from 'leaflet';

declare global {
  interface Window {
    removeStation: (id: string) => void;
  }
}

interface Station {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address: string;
}

interface SearchResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

interface GeocodingResult {
  formatted: string;
  geometry: {
    lat: number;
    lng: number;
  };
  annotations: {
    geohash?: string;
  };
}

interface PhotonFeature {
  type: string;
  geometry: {
    coordinates: [number, number];
    type: string;
  };
  properties: {
    osm_id?: number;
    name?: string;
    city?: string;
    state?: string;
    country?: string;
  };
}

interface PhotonResponse {
  features: PhotonFeature[];
}

export default function RealTimeMapPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { reports } = useSocketContext();
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [stations, setStations] = useState<Station[]>([]);
  const [addingStation, setAddingStation] = useState(false);
  const [newStationName, setNewStationName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const stationIdCounter = useRef(0);
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const reportMarkersRef = useRef<L.Marker[]>([]);
  const stationMarkersRef = useRef<L.Marker[]>([]);

  // Get today's date for filtering active reports
  const today = new Date();
  const todayString = today.toISOString().split('T')[0];

  // Filter active reports from today
  const activeReports = reports.filter(report => {
    if (report.status !== 'current') return false;
    if (!report.location) return false;

    // Check if report is from today
    const reportDate = new Date(report.timestamp).toISOString().split('T')[0];
    return reportDate === todayString;
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const removeStation = (stationId: string) => {
    setStations(prev => prev.filter(s => s.id !== stationId));
  };

  const addStation = async (lat: number, lng: number) => {
    if (!newStationName.trim()) return;

    try {
      // Reverse geocode to get address
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await response.json();
      const address = data.display_name || `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`;

      const newStation: Station = {
        id: `station_${stationIdCounter.current++}`,
        name: newStationName,
        lat,
        lng,
        address,
      };

      setStations(prev => [...prev, newStation]);
      setNewStationName('');
      setAddingStation(false);
    } catch (error) {
      console.error('Error adding station:', error);
    }
  };

  const searchLocation = async (query: string): Promise<SearchResult[]> => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return [];
    }

    try {
      // Use a free geocoding service that doesn't require API key
      const response = await fetch(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5&lang=en`
      );
      const data = await response.json();

      if (data.features && data.features.length > 0) {
        const results: SearchResult[] = data.features.map((feature: PhotonFeature, index: number) => ({
          place_id: feature.properties.osm_id || `${feature.geometry.coordinates[0]}-${feature.geometry.coordinates[1]}-${index}`,
          display_name: feature.properties.name || feature.properties.city || feature.properties.state,
          lat: feature.geometry.coordinates[1].toString(),
          lon: feature.geometry.coordinates[0].toString(),
        })).filter(result => result.display_name); // Filter out empty names

        setSearchResults(results);
        setShowResults(true);
        return results;
      } else {
        // Fallback: provide some common Philippine locations if no results
        if (query.toLowerCase().includes('manila')) {
          const results = [{
            place_id: 1,
            display_name: 'Manila, Metro Manila, Philippines',
            lat: '14.5995',
            lon: '120.9842'
          }];
          setSearchResults(results);
          setShowResults(true);
          return results;
        } else {
          setSearchResults([]);
          setShowResults(false);
          return [];
        }
      }
    } catch (error) {
      console.error('Search error:', error);
      // Fallback to some common locations
      const fallbackResults = [
        { place_id: 1, display_name: 'Manila, Metro Manila', lat: '14.5995', lon: '120.9842' },
        { place_id: 2, display_name: 'Cebu City, Cebu', lat: '10.3157', lon: '123.8854' },
        { place_id: 3, display_name: 'Davao City, Davao del Sur', lat: '7.1907', lon: '125.4553' }
      ].filter(location =>
        location.display_name.toLowerCase().includes(query.toLowerCase())
      );

      setSearchResults(fallbackResults);
      setShowResults(fallbackResults.length > 0);
      return fallbackResults;
    }
  };

  const selectSearchResult = (result: SearchResult) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);

    if (mapRef.current) {
      mapRef.current.setView([lat, lng], 18);
      setSearchQuery('');
      setShowResults(false);
    }
  };

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Wait for the container to be properly sized and ready
    const initMap = () => {
      if (!mapContainerRef.current || mapRef.current) return;

      // Check if container has dimensions
      const rect = mapContainerRef.current.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        // Container not ready yet, try again
        setTimeout(initMap, 100);
        return;
      }

      try {
        // Initialize map centered on Philippines
        const map = L.map(mapContainerRef.current).setView([14.5995, 120.9842], 12);
        mapRef.current = map;

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19,
        }).addTo(map);

        // Force map to recalculate size after initialization
        setTimeout(() => {
          if (map) {
            map.invalidateSize();
          }
        }, 100);

        // Add user location marker (green)
        if (navigator.geolocation) {
          navigator.geolocation.watchPosition(
            (position) => {
              const lat = position.coords.latitude;
              const lng = position.coords.longitude;
              setUserLocation({ lat, lng });

              if (userMarkerRef.current && map) {
                userMarkerRef.current.setLatLng([lat, lng]);
              } else if (map) {
                const userIcon = L.divIcon({
                  html: '<div style="background-color: #10b981; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
                  className: 'user-location-marker',
                  iconSize: [20, 20],
                  iconAnchor: [10, 10],
                });

                const marker = L.marker([lat, lng], { icon: userIcon }).addTo(map);
                marker.bindPopup('<strong>You are here</strong>');
                userMarkerRef.current = marker;
              }

              // Center map on user location first time
              try {
                if (map && map.getBounds && !map.getBounds().contains([lat, lng])) {
                  map.setView([lat, lng], 14);
                }
              } catch (error) {
                // Map might not be fully initialized yet, set view anyway
                if (map) {
                  map.setView([lat, lng], 14);
                }
              }
            },
            (error) => {
              console.log('Geolocation error:', error);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
          );
        }

        // Handle map clicks for adding stations (admin only)
        if (user?.role === 'admin') {
          const handleMapClick = (e: L.LeafletMouseEvent) => {
            if (addingStation) {
              const latLng = e.latlng;
              addStation(latLng.lat, latLng.lng);
            }
          };
          map.on('click', handleMapClick);
        }
      } catch (error) {
        console.error('Error initializing map:', error);
      }
    };

    // Use requestAnimationFrame for better timing
    const checkReady = () => {
      if (mapContainerRef.current) {
        const rect = mapContainerRef.current.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          initMap();
        } else {
          requestAnimationFrame(checkReady);
        }
      }
    };

    requestAnimationFrame(checkReady);

    return () => {
      if (mapRef.current) {
        try {
          mapRef.current.remove();
        } catch (error) {
          console.error('Error removing map:', error);
        }
        mapRef.current = null;
      }
    };
  }, []); // Remove dependencies that cause re-initialization

  // Update map click handler when addingStation changes
  useEffect(() => {
    if (!mapRef.current || user?.role !== 'admin') return;

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      console.log('Map clicked:', e.latlng, 'addingStation:', addingStation);
      if (addingStation) {
        console.log('Adding station at:', e.latlng);
        const latLng = e.latlng;
        addStation(latLng.lat, latLng.lng);
      }
    };

    // Remove existing click handler and add new one
    mapRef.current.off('click');
    mapRef.current.on('click', handleMapClick);
    console.log('Map click handler registered, addingStation:', addingStation);

    return () => {
      if (mapRef.current) {
        mapRef.current.off('click', handleMapClick);
      }
    };
  }, [addingStation, user?.role]);

  // Update report markers when reports change
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing report markers
    reportMarkersRef.current.forEach(marker => {
      mapRef.current!.removeLayer(marker);
    });
    reportMarkersRef.current = [];

    // Add new report markers (red pins)
    activeReports.forEach(report => {
      if (!report.location) return;

      const reportIcon = L.divIcon({
        html: '<div style="background-color: #ef4444; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
        className: 'report-marker',
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });

      const marker = L.marker([report.location.lat, report.location.lng], { icon: reportIcon })
        .addTo(mapRef.current!)
        .bindPopup(`
          <div class="p-2">
            <h3 class="font-bold text-lg">${report.type}</h3>
            <p class="text-sm text-gray-600">${report.address || 'Location not specified'}</p>
            <p class="text-sm"><strong>Reported by:</strong> ${report.userName}</p>
            <p class="text-sm"><strong>Status:</strong> ${report.status}</p>
            <p class="text-sm"><strong>Time:</strong> ${new Date(report.timestamp).toLocaleTimeString()}</p>
          </div>
        `);

      reportMarkersRef.current.push(marker);
    });
  }, [activeReports]);

  // Update station markers when stations change
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing station markers
    stationMarkersRef.current.forEach(marker => {
      mapRef.current!.removeLayer(marker);
    });
    stationMarkersRef.current = [];

    // Add new station markers (blue pins)
    stations.forEach(station => {
      const stationIcon = L.divIcon({
        html: '<div style="background-color: #3b82f6; width: 18px; height: 18px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
        className: 'station-marker',
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });

      const marker = L.marker([station.lat, station.lng], { icon: stationIcon })
        .addTo(mapRef.current!)
        .bindPopup(`
          <div class="p-2">
            <h3 class="font-bold">${station.name}</h3>
            <p class="text-sm text-gray-600">${station.address}</p>
            ${user?.role === 'admin' ? '<button class="mt-2 px-2 py-1 bg-red-500 text-white text-xs rounded" onclick="window.removeStation(\'' + station.id + '\')">Remove</button>' : ''}
          </div>
        `);

      // Add click handler for admin to remove station
      if (user?.role === 'admin') {
        marker.on('click', () => {
          // The popup will show the remove button
        });
      }

      stationMarkersRef.current.push(marker);
    });

    // Add global function for popup button
    if (typeof window !== 'undefined' && user?.role === 'admin') {
      window.removeStation = removeStation;
    }
  }, [stations]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200">
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white/95 backdrop-blur-lg rounded-2xl p-8 shadow-xl mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">🗺️ Real-Time Disaster Map</h1>
              <p className="text-gray-600">
                Live tracking of active emergencies and emergency stations
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative mb-6">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Search for a location..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  searchLocation(e.target.value);
                }}
                onKeyDown={async (e) => {
                  if (e.key === 'Enter') {
                    const results = await searchLocation(searchQuery);
                    if (results.length > 0) selectSearchResult(results[0]);
                  }
                }}
                className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none"
              />
              <button
                onClick={async () => {
                  const results = await searchLocation(searchQuery);
                  if (results.length > 0) selectSearchResult(results[0]);
                }}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90"
              >
                🔍
              </button>
            </div>

            {/* Search Results */}
            {showResults && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                {searchResults.map((result, index) => (
                  <button
                    key={index}
                    onClick={() => selectSearchResult(result)}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 border-b border-gray-200 last:border-b-0"
                  >
                    <div className="font-medium text-sm">{result.display_name.split(',')[0]}</div>
                    <div className="text-xs text-gray-600 truncate">{result.display_name}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Map Container */}
          <div className="bg-gray-100 rounded-xl overflow-hidden mb-6">
            <div
              ref={mapContainerRef}
              className="w-full rounded-xl"
              style={{
                height: '70vh',
                minHeight: '500px',
                position: 'relative'
              }}
            />
          </div>

          {/* Legend */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold mb-3">Map Legend</h3>
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                <span className="text-sm">Active Emergency</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                <span className="text-sm">Your Location</span>
              </div>
              {user.role === 'admin' && (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                  <span className="text-sm">Emergency Station</span>
                </div>
              )}
            </div>
          </div>

          {/* Admin Controls */}
          {user.role === 'admin' && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-semibold mb-3">Admin Controls</h3>
              <div className="flex flex-wrap gap-4 items-center">
                {!addingStation ? (
                  <button
                    onClick={() => setAddingStation(true)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    ➕ Add Station
                  </button>
                ) : (
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      placeholder="Station name"
                      value={newStationName}
                      onChange={(e) => setNewStationName(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    <button
                      onClick={() => setAddingStation(false)}
                      className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                {addingStation && (
                  <p className="text-sm text-blue-600">
                    Click on the map to place the station
                  </p>
                )}
              </div>

              {/* Stations List */}
              {stations.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Stations ({stations.length})</h4>
                  <div className="space-y-2">
                    {stations.map(station => (
                      <div key={station.id} className="flex justify-between items-center bg-white p-3 rounded-lg">
                        <div>
                          <strong>{station.name}</strong>
                          <p className="text-sm text-gray-600">{station.address}</p>
                        </div>
                        <button
                          onClick={() => removeStation(station.id)}
                          className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{activeReports.length}</div>
              <div className="text-sm text-red-600">Active Emergencies Today</div>
            </div>
            {user.role === 'admin' && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{stations.length}</div>
                <div className="text-sm text-blue-600">Emergency Stations</div>
              </div>
            )}
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{userLocation ? '1' : '0'}</div>
              <div className="text-sm text-green-600">Your Location Tracked</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
