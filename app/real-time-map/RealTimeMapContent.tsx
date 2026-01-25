'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useSocketContext } from '@/contexts/SocketContext';
import { Header } from '@/components/Header';
import { getCurrentLocation } from '@/lib/utils';
import L from 'leaflet';

// Import Leaflet CSS for proper map rendering
import 'leaflet/dist/leaflet.css';

declare global {
  interface Window {
    removeStation?: (id: string) => void;
    editStation?: (id: string) => void;
  }
}

interface Station {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address: string;
  phone?: string;
  email?: string;
  website?: string;
  description?: string;
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

export default function RealTimeMapContent() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { reports } = useSocketContext();
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [stations, setStations] = useState<Station[]>([]);
  const [stationsLoading, setStationsLoading] = useState(true);
  const [addingStation, setAddingStation] = useState(false);
  const [newStationName, setNewStationName] = useState('');
  const [newStationPhone, setNewStationPhone] = useState('');
  const [newStationEmail, setNewStationEmail] = useState('');
  const [newStationWebsite, setNewStationWebsite] = useState('');
  const [newStationDescription, setNewStationDescription] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [mapKey, setMapKey] = useState(() => Date.now()); // Unique key to force re-mount
  const [mapReady, setMapReady] = useState(false); // Track when map is ready
  const [mapError, setMapError] = useState<string | null>(null); // Track map errors
  const [mapLoading, setMapLoading] = useState(true); // Track map loading state
  const stationIdCounter = useRef(0);
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInitializedRef = useRef(false);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const reportMarkersRef = useRef<L.Marker[]>([]);
  const stationMarkersRef = useRef<L.Marker[]>([]);
  const locationTrackingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Filter all active reports (not just today's)
  const activeReports = reports?.filter(report => {
    if (report.status !== 'current') return false;
    if (!report.location) return false;
    return true;
  }) || [];

  // Initialize stationIdCounter based on loaded stations
  useEffect(() => {
    if (stations.length > 0) {
      const maxId = Math.max(...stations.map((s: Station) => parseInt(s.id.split('_')[1]) || 0), 0);
      stationIdCounter.current = maxId + 1;
    }
  }, [stations]);

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

  // Debounced search effect
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(async () => {
      if (searchQuery.trim()) {
        await searchLocation(searchQuery);
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    }, 300); // 300ms debounce

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Load stations from API on component mount
  useEffect(() => {
    const loadStations = async () => {
      try {
        const response = await fetch('/api/stations');
        const data = await response.json();

        if (data.success) {
          setStations(data.stations);
        } else {
          console.error('Failed to load stations:', data.error);
        }
      } catch (error) {
        console.error('Error loading stations:', error);
      } finally {
        setStationsLoading(false);
      }
    };

    loadStations();
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const removeStation = async (stationId: string) => {
    try {
      const response = await fetch(`/api/stations?id=${stationId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setStations(prev => prev.filter(s => s.id !== stationId));
      } else {
        console.error('Failed to remove station:', data.error);
        alert('Failed to remove station: ' + data.error);
      }
    } catch (error) {
      console.error('Error removing station:', error);
      alert('Error removing station');
    }
  };

  const editStation = async (stationId: string) => {
    const station = stations.find(s => s.id === stationId);
    if (!station) return;

    // Set the station data for editing
    setEditingStation(station);
    setEditingStationId(stationId);
    setEditingStationName(station.name);
    setEditingStationPhone(station.phone || '');
    setEditingStationEmail(station.email || '');
    setEditingStationWebsite(station.website || '');
    setEditingStationDescription(station.description || '');
    setShowEditModal(true);
  };

  const updateStation = async () => {
    if (!editingStationId || !editingStationName.trim()) {
      alert('Please provide a station name');
      return;
    }

    try {
      const response = await fetch(`/api/stations?id=${editingStationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editingStationName,
          phone: editingStationPhone,
          email: editingStationEmail,
          website: editingStationWebsite,
          description: editingStationDescription,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setStations(prev => prev.map(s => 
          s.id === editingStationId 
            ? { ...s, ...data.station }
            : s
        ));
        setShowEditModal(false);
        setEditingStationId(null);
        setEditingStationName('');
        setEditingStationPhone('');
        setEditingStationEmail('');
        setEditingStationWebsite('');
        setEditingStationDescription('');
      } else {
        console.error('Failed to update station:', data.error);
        alert('Failed to update station: ' + data.error);
      }
    } catch (error) {
      console.error('Error updating station:', error);
      alert('Error updating station');
    }
  };

  const [editingStation, setEditingStation] = useState<Station | null>(null);
  const [editingStationId, setEditingStationId] = useState<string | null>(null);
  const [editingStationName, setEditingStationName] = useState('');
  const [editingStationPhone, setEditingStationPhone] = useState('');
  const [editingStationEmail, setEditingStationEmail] = useState('');
  const [editingStationWebsite, setEditingStationWebsite] = useState('');
  const [editingStationDescription, setEditingStationDescription] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);

  const addStation = async (lat: number, lng: number) => {
    if (!newStationName.trim()) {
      return;
    }

    try {
      // Reverse geocode to get address
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await response.json();
      const address = data.display_name || `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`;

      // Add station via API with contact information
      const apiResponse = await fetch('/api/stations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newStationName,
          lat,
          lng,
          address,
          phone: newStationPhone || user?.phone || '',
          email: newStationEmail || '',
          website: newStationWebsite || '',
          description: newStationDescription || '',
          created_by: user?.uid || null,
        }),
      });

      const apiData = await apiResponse.json();

      if (apiData.success) {
        setStations(prev => [...prev, apiData.station]);
        setNewStationName('');
        setNewStationPhone('');
        setNewStationEmail('');
        setNewStationWebsite('');
        setNewStationDescription('');
        setAddingStation(false);
      } else {
        console.error('Failed to add station:', apiData.error);
        alert('Failed to add station: ' + apiData.error);
      }
    } catch (error) {
      console.error('Error adding station:', error);
      alert('Error adding station');
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
    if (!mapContainerRef.current) return;

    // Set map as loading
    setMapLoading(true);
    setMapError(null);

    try {
      // Initialize map centered on Philippines - IMMEDIATE INITIALIZATION
      const map = L.map(mapContainerRef.current, {
        zoomControl: true,
        scrollWheelZoom: true,
        doubleClickZoom: true,
        dragging: true,
        touchZoom: true,
        bounceAtZoomLimits: true,
        preferCanvas: true, // Use canvas for better performance
        fadeAnimation: false, // Disable animations for faster loading
        zoomAnimation: false,
        markerZoomAnimation: false
      }).setView([14.5995, 120.9842], 8);

      mapRef.current = map;
      setMapReady(true);

      // Add tile layer with optimized settings
      const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
        maxNativeZoom: 19,
        detectRetina: true,
        updateWhenIdle: true,
        updateWhenZooming: true,
        keepBuffer: 1, // Reduced buffer for faster loading
      });

      tileLayer.addTo(map);

      // Handle tile loading errors
      tileLayer.on('tileerror', (error) => {
        console.error('Tile loading error:', error);
        setMapError('Failed to load map tiles. Please check your internet connection.');
      });

      // IMMEDIATELY mark as loaded to show map instantly
      setMapLoading(false);

      // Try to get current location in background without blocking
      const setInitialLocation = async () => {
        try {
          const location = await getCurrentLocation();
          setUserLocation(location);
          
          const userIcon = L.divIcon({
            html: '<div style="background-color: #10b981; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
            className: 'user-location-marker',
            iconSize: [20, 20],
            iconAnchor: [10, 10],
          });

          L.marker([location.lat, location.lng], {
            icon: userIcon,
            zIndexOffset: 1000
          }).addTo(map).bindPopup('<strong>You are here</strong><br><small>Location detected</small>');

          // Smoothly fly to user location
          map.flyTo([location.lat, location.lng], 14, {
            animate: true,
            duration: 0.5 // Faster animation
          });
        } catch (error) {
          console.log('Location tracking failed - using default view');
        }
      };

      // Run location detection in background
      setInitialLocation();

      // Handle map loading completion
      map.whenReady(() => {
        console.log('Map loaded successfully');
      });

      return () => {
        try {
          map.remove();
        } catch (error) {
          console.error('Error removing map:', error);
        }
      };
    } catch (error) {
      console.error('Map initialization error:', error);
      setMapError('Failed to initialize map. Please refresh the page.');
      setMapLoading(false);
    }
  }, []); // Only run once on mount

  // Update map click handler when addingStation changes
  useEffect(() => {
    if (!mapRef.current || user?.role !== 'admin') return;

    let clickTimeout: NodeJS.Timeout | null = null;
    let hasDragged = false;

    const handleClick = (e: L.LeafletMouseEvent) => {
      if (!addingStation) return;

      // Delay the click action to allow drag detection
      clickTimeout = setTimeout(() => {
        if (!hasDragged) {
          const latLng = e.latlng;
          addStation(latLng.lat, latLng.lng);
        }
        hasDragged = false; // Reset for next click
      }, 200); // Small delay to detect drags
    };

    const handleDragStart = () => {
      hasDragged = true;
      // Cancel the pending click
      if (clickTimeout) {
        clearTimeout(clickTimeout);
        clickTimeout = null;
      }
    };

    const handleDragEnd = () => {
      // Reset drag flag after a short delay
      setTimeout(() => {
        hasDragged = false;
      }, 100);
    };

    // Remove existing handlers
    mapRef.current.off('click', handleClick);
    mapRef.current.off('dragstart', handleDragStart);
    mapRef.current.off('dragend', handleDragEnd);

    // Add new handlers
    mapRef.current.on('click', handleClick);
    mapRef.current.on('dragstart', handleDragStart);
    mapRef.current.on('dragend', handleDragEnd);



    return () => {
      if (mapRef.current) {
        mapRef.current.off('click', handleClick);
        mapRef.current.off('dragstart', handleDragStart);
        mapRef.current.off('dragend', handleDragEnd);
      }
      // Clear any pending timeout
      if (clickTimeout) {
        clearTimeout(clickTimeout);
      }
    };
  }, [addingStation, user?.role, newStationName]);

  // Update report markers when reports change
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing report markers
    reportMarkersRef.current.forEach(marker => {
      mapRef.current!.removeLayer(marker);
    });
    reportMarkersRef.current = [];

    // Add new report markers (red pins, 1.4x bigger = ~22px)
    activeReports.forEach(report => {
      if (!report.location) return;

      const reportIcon = L.divIcon({
        html: '<div style="background-color: #ef4444; width: 22px; height: 22px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
        className: 'report-marker',
        iconSize: [22, 22],
        iconAnchor: [11, 11],
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

  // Update station markers when stations change or map becomes available
  useEffect(() => {
    if (!mapReady || !mapRef.current || stations.length === 0) return;

    // Clear existing station markers
    stationMarkersRef.current.forEach(marker => {
      if (mapRef.current!.hasLayer(marker)) {
        mapRef.current!.removeLayer(marker);
      }
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
            ${station.phone ? `<p class="text-sm text-blue-600 mt-2"><strong>Contact:</strong> ${station.phone}</p>` : ''}
            ${station.email ? `<p class="text-sm text-blue-600 mt-1"><strong>Email:</strong> ${station.email}</p>` : ''}
            ${station.website ? `<p class="text-sm text-blue-600 mt-1"><strong>Website:</strong> ${station.website}</p>` : ''}
            ${station.description ? `<p class="text-sm text-gray-600 mt-2"><strong>Description:</strong> ${station.description}</p>` : ''}
            ${user?.role === 'admin' ? `
              <div class="mt-3 flex gap-2">
                <button class="px-2 py-1 bg-yellow-500 text-white text-xs rounded hover:bg-yellow-600" onclick="window.editStation('${station.id}')">
                  ✏️ Edit
                </button>
                <button class="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600" onclick="window.removeStation('${station.id}')">
                  🗑️ Delete
                </button>
              </div>
            ` : '<p class="text-xs text-gray-500 mt-3">Emergency Response Station</p>'}
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
      window.editStation = editStation;
    }

    // Cleanup global function on unmount or when user role changes
    return () => {
      if (typeof window !== 'undefined') {
        delete window.removeStation;
      }
    };
  }, [stations, user?.role, mapReady]); // Use mapReady instead of mapRef.current

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear location tracking interval
      if (locationTrackingIntervalRef.current) {
        clearTimeout(locationTrackingIntervalRef.current);
        locationTrackingIntervalRef.current = null;
      }

      // Clear search timeout
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = null;
      }

      // Remove map if it exists
      if (mapRef.current) {
        try {
          mapRef.current.remove();
        } catch (error) {
          console.error('Error removing map on cleanup:', error);
        }
        mapRef.current = null;
      }

      // Clear global function
      if (typeof window !== 'undefined') {
        delete window.removeStation;
      }

      // Reset initialization flag
      mapInitializedRef.current = false;
    };
  }, []);

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
                onChange={(e) => setSearchQuery(e.target.value)}
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
                {searchResults.map((result: SearchResult, index: number) => (
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
            {mapLoading && (
              <div className="flex items-center justify-center h-[70vh] min-h-[500px]">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading map...</p>
                </div>
              </div>
            )}
            {mapError && (
              <div className="flex items-center justify-center h-[70vh] min-h-[500px]">
                <div className="text-center p-6 bg-red-50 border border-red-200 rounded-lg">
                  <div className="text-red-500 text-4xl mb-2">⚠️</div>
                  <h3 className="text-red-700 font-semibold mb-2">Map Error</h3>
                  <p className="text-red-600 mb-4">{mapError}</p>
                  <button
                    onClick={() => {
                      setMapError(null);
                      setMapLoading(true);
                      // Force re-initialization
                      setMapKey(Date.now());
                    }}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                  >
                    Retry Map
                  </button>
                </div>
              </div>
            )}
            {!mapLoading && !mapError && (
              <div
                ref={mapContainerRef}
                className="w-full rounded-xl"
                style={{
                  height: '70vh',
                  minHeight: '500px',
                  position: 'relative'
                }}
              />
            )}
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
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                <span className="text-sm">Emergency Station</span>
              </div>
            </div>

            {/* Location Status & Controls */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Location Status:</span>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${userLocation ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                  <span className="text-xs text-gray-600">
                    {userLocation ? 'Active' : 'Detecting...'}
                  </span>
                </div>
              </div>

              {userLocation && (
                <div className="text-xs text-gray-500 mb-2">
                  Lat: {userLocation.lat.toFixed(6)}, Lng: {userLocation.lng.toFixed(6)}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    try {
                      const location = await getCurrentLocation();
                      setUserLocation(location);
                      if (mapRef.current && userMarkerRef.current) {
                        userMarkerRef.current.setLatLng([location.lat, location.lng]);
                        mapRef.current.setView([location.lat, location.lng], 16);
                      }
                      console.log('Location refreshed successfully');
                    } catch (error) {
                      console.error('Failed to refresh location:', error);
                      alert('Unable to detect your location. Please check your browser permissions.');
                    }
                  }}
                  className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                >
                  🔄 Refresh Location
                </button>

                <button
                  onClick={() => {
                    if (mapRef.current) {
                      // Let user click to set their location manually
                      alert('Click on the map to set your location manually.');

                      const handleManualLocation = (e: L.LeafletMouseEvent) => {
                        const location = { lat: e.latlng.lat, lng: e.latlng.lng };
                        setUserLocation(location);

                        // Save to localStorage for persistence
                        localStorage.setItem('user_manual_location', JSON.stringify(location));

                        if (userMarkerRef.current) {
                          userMarkerRef.current.setLatLng([location.lat, location.lng]);
                        } else if (mapRef.current) {
                          const userIcon = L.divIcon({
                            html: '<div style="background-color: #10b981; width: 10px; height: 10px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
                            className: 'user-location-marker',
                            iconSize: [10, 10],
                            iconAnchor: [10, 10],
                          });

                          const marker = L.marker([location.lat, location.lng], {
                            icon: userIcon,
                            zIndexOffset: 1000
                          }).addTo(mapRef.current);
                          marker.bindPopup('<strong>You are here</strong><br><small>Manually set location</small>');
                          userMarkerRef.current = marker;
                        }

                        if (mapRef.current) {
                          mapRef.current.off('click', handleManualLocation);
                        }
                        console.log('Manual location set:', location);
                      };

                      mapRef.current.on('click', handleManualLocation);
                    }
                  }}
                  className="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                >
                  📍 Set Location Manually
                </button>
              </div>
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

              {/* Contact Info Fields - Show when adding station */}
              {addingStation && (
                <div className="mt-4 p-3 bg-white rounded-lg border border-gray-200">
                  <h4 className="font-medium mb-2 text-blue-600">Contact Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      type="tel"
                      placeholder="Phone number"
                      value={newStationPhone}
                      onChange={(e) => setNewStationPhone(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    <input
                      type="email"
                      placeholder="Email address"
                      value={newStationEmail}
                      onChange={(e) => setNewStationEmail(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    <input
                      type="url"
                      placeholder="Website URL"
                      value={newStationWebsite}
                      onChange={(e) => setNewStationWebsite(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    <input
                      type="text"
                      placeholder="Description"
                      value={newStationDescription}
                      onChange={(e) => setNewStationDescription(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
              )}

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
                          {station.phone && <p className="text-xs text-blue-600">📞 {station.phone}</p>}
                          {station.email && <p className="text-xs text-blue-600">✉️ {station.email}</p>}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => editStation(station.id)}
                            className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => removeStation(station.id)}
                            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Edit Station Modal */}
          {showEditModal && editingStation && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold">Edit Station</h3>
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="text-gray-500 hover:text-gray-700 text-2xl"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Station Name</label>
                    <input
                      type="text"
                      value={editingStationName}
                      onChange={(e) => setEditingStationName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-primary focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      value={editingStationPhone}
                      onChange={(e) => setEditingStationPhone(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-primary focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      value={editingStationEmail}
                      onChange={(e) => setEditingStationEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-primary focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Website URL</label>
                    <input
                      type="url"
                      value={editingStationWebsite}
                      onChange={(e) => setEditingStationWebsite(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-primary focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <input
                      type="text"
                      value={editingStationDescription}
                      onChange={(e) => setEditingStationDescription(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-6">
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={updateStation}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90"
                  >
                    Update Station
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Resident View - Stations Only */}
          {user.role === 'resident' && stations.length > 0 && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-semibold mb-3">Emergency Response Stations</h3>
              <div className="space-y-2">
                {stations.map(station => (
                  <div key={station.id} className="flex justify-between items-center bg-white p-3 rounded-lg">
                    <div>
                      <strong>{station.name}</strong>
                      <p className="text-sm text-gray-600">{station.address}</p>
                      {station.phone && <p className="text-xs text-blue-600">📞 {station.phone}</p>}
                      {station.email && <p className="text-xs text-blue-600">✉️ {station.email}</p>}
                    </div>
                    <p className="text-xs text-gray-500">Emergency Response Station</p>
                  </div>
                ))}
              </div>
            </div>
          )}


          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{activeReports.length}</div>
              <div className="text-sm text-red-600">Active Emergencies</div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{stations.length}</div>
              <div className="text-sm text-blue-600">Emergency Stations</div>
            </div>
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
