import { NextRequest, NextResponse } from 'next/server';
import type { Station } from '@/types';

console.log('🚀 Stations API route loaded - Mock version');

// Mock data for stations (temporary solution)
let mockStations: Station[] = [
  {
    id: 'station_1',
    name: 'Test Fire Station',
    type: 'fire',
    location: { lat: 14.5995, lng: 120.9842 },
    address: 'Test Address',
    capacity: 50,
    currentLoad: 0,
    status: 'operational',
    contact: '123-456-7890',
    phone: '123-456-7890',
    email: 'test@example.com',
    website: 'https://example.com',
    description: 'Test fire station for emergency response',
    emergencyContacts: [
      {
        id: 'contact_1',
        name: 'Fire Chief',
        type: 'fire',
        phone: '123-456-7890',
        address: 'Test Address',
        location: { lat: 14.5995, lng: 120.9842 },
        description: 'Fire chief contact',
        created_at: '2026-02-09T17:13:31.187Z',
        updated_at: '2026-02-09T17:13:31.188Z'
      }
    ],
    created_at: '2026-02-09T17:13:31.187Z',
    updated_at: '2026-02-09T17:13:31.188Z'
  },
  {
    id: 'station_2',
    name: 'Test Police Station',
    type: 'medical',
    location: { lat: 14.6, lng: 120.985 },
    address: 'Test Police Address',
    capacity: 0,
    currentLoad: 0,
    status: 'operational',
    contact: '987-654-3210',
    phone: '987-654-3210',
    email: 'police@example.com',
    website: 'https://police.example.com',
    description: 'Test police station for emergency response',
    created_by: 'test_user_123',
    emergencyContacts: [
      {
        id: 'contact_2',
        name: 'Police Chief',
        type: 'police',
        phone: '987-654-3210',
        address: 'Test Police Address',
        location: { lat: 14.6, lng: 120.985 },
        description: 'Police chief contact',
        created_at: '2026-02-09T17:13:31.187Z',
        updated_at: '2026-02-09T17:13:31.188Z'
      }
    ],
    created_at: '2026-02-09T17:36:35.615Z',
    updated_at: '2026-02-09T17:36:35.615Z'
  }
];

// GET /api/stations - Get all stations
export async function GET(request: NextRequest) {
  console.log('📡 GET /api/stations called - Mock version');

  const { searchParams } = new URL(request.url);
  const stationId = searchParams.get('id');

  try {
    if (stationId) {
      // Get station by ID
      const station = mockStations.find(s => s.id === stationId);
      
      if (!station) {
        return NextResponse.json(
          { success: false, error: 'Station not found' },
          { status: 404 }
        );
      }

      console.log('✅ Successfully fetched station by ID:', stationId);
      return NextResponse.json({
        success: true,
        station: station
      });
    } else {
      // Get all stations
      console.log('✅ Successfully fetched stations from mock data:', mockStations.length);
      return NextResponse.json({
        success: true,
        stations: mockStations
      });
    }
  } catch (error) {
    console.error('❌ Error fetching stations:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stations' },
      { status: 500 }
    );
  }
}

// POST /api/stations - Add a new station (admin only)
export async function POST(request: NextRequest) {
  console.log('📡 POST /api/stations called - Mock version');

  try {
    const { name, lat, lng, address, phone, email, website, description, created_by } = await request.json();
    console.log('📡 Received station data:', { name, lat, lng, address, phone, email, website, description, created_by });

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Station name is required' },
        { status: 400 }
      );
    }

    const stationData: Station = {
      id: `station_${Date.now()}`,
      name,
      type: 'medical' as const,
      location: { lat, lng },
      address: address || 'Unknown',
      capacity: 0,
      currentLoad: 0,
      status: 'operational' as const,
      contact: phone || 'Unknown',
      phone: phone || '',
      email: email || '',
      website: website || '',
      description: description || '',
      created_by: created_by || null,
      emergencyContacts: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('📡 Creating station with data:', stationData);
    mockStations.push(stationData);
    
    console.log('📡 Station created in mock data:', stationData.id);
    return NextResponse.json({ 
      success: true, 
      station: stationData 
    });
  } catch (error) {
    console.error('❌ Error adding station:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add station: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

// PUT /api/stations - Update a station (admin only)
export async function PUT(request: NextRequest) {
  console.log('📡 PUT /api/stations called - Mock version');

  try {
    const { id, name, type, location, address, capacity, currentLoad, status, contact, phone, email, website, description } = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Station ID is required' },
        { status: 400 }
      );
    }

    const index = mockStations.findIndex(s => s.id === id);
    if (index === -1) {
      return NextResponse.json(
        { success: false, error: 'Station not found' },
        { status: 404 }
      );
    }

    const stationData: Partial<Station> = {
      name,
      type,
      location,
      address,
      capacity,
      currentLoad,
      status,
      contact,
      phone,
      email,
      website,
      description,
      updated_at: new Date().toISOString()
    };

    mockStations[index] = { ...mockStations[index], ...stationData };

    console.log('✅ Station updated in mock data:', id);
    return NextResponse.json({ 
      success: true, 
      station: mockStations[index] 
    });
  } catch (error) {
    console.error('❌ Error updating station:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update station' },
      { status: 500 }
    );
  }
}

// DELETE /api/stations?id=station_id - Delete a station (admin only)
export async function DELETE(request: NextRequest) {
  console.log('📡 DELETE /api/stations called - Mock version');

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
    const defaultStationIds = ['station_1', 'station_2'];
    if (defaultStationIds.includes(stationId)) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete default stations' },
        { status: 400 }
      );
    }

    const index = mockStations.findIndex(s => s.id === stationId);
    if (index === -1) {
      return NextResponse.json(
        { success: false, error: 'Station not found' },
        { status: 404 }
      );
    }

    mockStations.splice(index, 1);

    console.log('✅ Station deleted from mock data:', stationId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Error deleting station:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete station' },
      { status: 500 }
    );
  }
}