import { NextRequest, NextResponse } from 'next/server';

console.log('🚀 Stations API route loaded - Deployed version');

// For deployed environments, use localStorage simulation
// In production, stations are managed by the WebSocket server

interface Station {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

// In-memory storage for deployed version (will be replaced by WebSocket data)
let stations: Station[] = [
  {
    id: 'station_default_1',
    name: 'Manila Central Fire Station',
    lat: 14.5995,
    lng: 120.9842,
    address: 'Manila, Metro Manila, Philippines',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'station_default_2',
    name: 'Cebu City Fire Station',
    lat: 10.3157,
    lng: 123.8854,
    address: 'Cebu City, Cebu, Philippines',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'station_default_3',
    name: 'Davao City Fire Station',
    lat: 7.1907,
    lng: 125.4553,
    address: 'Davao City, Davao del Sur, Philippines',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

// GET /api/stations - Get all stations
export async function GET() {
  console.log('📡 GET /api/stations called - Deployed version');

  // In deployed version, return the in-memory stations
  // Real data comes from WebSocket server
  console.log('✅ Returning stations:', stations.length);
  return NextResponse.json({ success: true, stations });
}

// POST /api/stations - Add a new station (admin only)
export async function POST(request: NextRequest) {
  console.log('📡 POST /api/stations called - Deployed version');

  try {
    const { name, lat, lng, address, created_by } = await request.json();

    if (!name || lat === undefined || lng === undefined) {
      return NextResponse.json(
        { success: false, error: 'Name, latitude, and longitude are required' },
        { status: 400 }
      );
    }

    // Generate a unique ID
    const stationId = `station_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const newStation: Station = {
      id: stationId,
      name,
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      address: address || '',
      created_by: created_by || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Add to in-memory storage
    stations.push(newStation);

    console.log('✅ Station added to memory:', stationId);
    return NextResponse.json({ success: true, station: newStation });
  } catch (error) {
    console.error('❌ Error adding station:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add station' },
      { status: 500 }
    );
  }
}

// DELETE /api/stations?id=station_id - Delete a station (admin only)
export async function DELETE(request: NextRequest) {
  console.log('📡 DELETE /api/stations called - Deployed version');

  try {
    const { searchParams } = new URL(request.url);
    const stationId = searchParams.get('id');

    if (!stationId) {
      return NextResponse.json(
        { success: false, error: 'Station ID is required' },
        { status: 400 }
      );
    }

    // Don't allow deleting default stations
    const defaultStationIds = ['station_default_1', 'station_default_2', 'station_default_3'];
    if (defaultStationIds.includes(stationId)) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete default stations' },
        { status: 400 }
      );
    }

    // Remove from in-memory storage
    const initialLength = stations.length;
    stations = stations.filter(s => s.id !== stationId);

    if (stations.length === initialLength) {
      return NextResponse.json(
        { success: false, error: 'Station not found' },
        { status: 404 }
      );
    }

    console.log('✅ Station deleted from memory:', stationId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Error deleting station:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete station' },
      { status: 500 }
    );
  }
}
