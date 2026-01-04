'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { reverseGeocode } from '@/lib/utils';

interface MapPickerProps {
  onSelect: (address: string) => void;
  onClose: () => void;
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

export function MapPicker({ onSelect, onClose }: MapPickerProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [address, setAddress] = useState<string>('Click on the map to select your location');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);

  const updateAddress = async (lat: number, lng: number) => {
    try {
      const addr = await reverseGeocode(lat, lng);
      setAddress(addr);
    } catch {
      setAddress(`Coordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    }
  };

  const searchLocation = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    try {
      // Use a free geocoding service that doesn't require API key
      const response = await fetch(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5&lang=en`
      );
      const data = await response.json();

      if (data.features && data.features.length > 0) {
        const results: SearchResult[] = data.features.map((feature: PhotonFeature, index: number) => ({
          place_id: feature.properties.osm_id || index,
          display_name: feature.properties.name || feature.properties.city || feature.properties.state,
          lat: feature.geometry.coordinates[1].toString(),
          lon: feature.geometry.coordinates[0].toString(),
        })).filter(result => result.display_name); // Filter out empty names

        setSearchResults(results);
        setShowResults(true);
      } else {
        // Fallback: provide some common Philippine locations if no results
        if (query.toLowerCase().includes('manila')) {
          setSearchResults([{
            place_id: 1,
            display_name: 'Manila, Metro Manila, Philippines',
            lat: '14.5995',
            lon: '120.9842'
          }]);
          setShowResults(true);
        } else {
          setSearchResults([]);
          setShowResults(false);
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
    }
  };

  const selectSearchResult = (result: SearchResult) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);

    if (mapRef.current && markerRef.current) {
      mapRef.current.setView([lat, lng], 15);
      markerRef.current.setLatLng([lat, lng]);
      setSelectedLocation({ lat, lng });
      setAddress(result.display_name);
      setSearchQuery('');
      setShowResults(false);
    }
  };

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize map centered on Philippines
    const map = L.map(mapContainerRef.current).setView([14.5995, 120.9842], 13);
    mapRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    // Create marker
    const marker = L.marker([14.5995, 120.9842], { draggable: true }).addTo(map);
    markerRef.current = marker;

    // Try to get current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLatLng: [number, number] = [position.coords.latitude, position.coords.longitude];
          map.setView(userLatLng, 15);
          marker.setLatLng(userLatLng);
          setSelectedLocation({ lat: userLatLng[0], lng: userLatLng[1] });
          updateAddress(userLatLng[0], userLatLng[1]);
        }, 
        () => {
          console.log('Geolocation failed, using default');
        }
      );
    }

    // Handle map clicks
    map.on('click', (e) => {
      const latLng = e.latlng;
      marker.setLatLng(latLng);
      setSelectedLocation({ lat: latLng.lat, lng: latLng.lng });
      updateAddress(latLng.lat, latLng.lng);
    });

    // Handle marker drag
    marker.on('dragend', () => {
      const position = marker.getLatLng();
      setSelectedLocation({ lat: position.lat, lng: position.lng });
      updateAddress(position.lat, position.lng);
    });

    return () => {
      map.remove();
    };
  }, []);

  const handleConfirm = () => {
    if (selectedLocation) {
      onSelect(address);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-bold">📍 Select Your Location</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative mb-4">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search for a location..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                searchLocation(e.target.value);
              }}
              className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none"
            />
            <button
              onClick={() => searchLocation(searchQuery)}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90"
            >
              🔍
            </button>
          </div>

          {/* Search Results */}
          {showResults && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
              {searchResults.map((result) => (
                <button
                  key={result.place_id}
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

        <div
          ref={mapContainerRef}
          className="w-full h-96 rounded-lg overflow-hidden mb-4"
          style={{ minHeight: '400px' }}
        />
        
        <div className="bg-gray-100 p-4 rounded-lg mb-4">
          <strong>Selected Location:</strong>
          <div className="mt-2 font-mono text-sm">{address}</div>
          {selectedLocation && (
            <div className="mt-2 text-sm text-gray-600">
              Lat: {selectedLocation.lat.toFixed(6)}, Lng: {selectedLocation.lng.toFixed(6)}
            </div>
          )}
        </div>
        
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-6 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedLocation}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:opacity-90 disabled:opacity-50"
          >
            Confirm Location
          </button>
        </div>
      </div>
    </div>
  );
}
