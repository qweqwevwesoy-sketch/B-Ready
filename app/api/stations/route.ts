import { NextRequest, NextResponse } from 'next/server';
import { createStation, updateStation, deleteStation, fetchStations, fetchStationById, fetchStationsByType, fetchStationsByStatus } from '@/lib/firebase-service';

console.log('🚀 Stations API route loaded - Firestore version');

interface Station {
  id: string;
  name: string;
  type: 'fire' | 'police' | 'medical' | 'barangay';
  location: {
    lat: number;
    lng: number;
  };
  address: string;
  capacity: number;
  currentLoad: number;
  status: 'operational' | 'overloaded' | 'closed';
  contact: string;
  phone?: string;
  email?: string;
  website?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

// GET /api/stations - Get all stations
export async function getAllStations() {
  console.log('📡 GET /api/stations called - Firestore version');

  try {
    const stations = await fetchStations();
    console.log('✅ Successfully fetched stations from Firestore:', stations.length);
    return NextResponse.json({
      success: true,
      stations: stations
    });
  } catch (error) {
    console.error('❌ Error fetching stations:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stations' },
      { status: 500 }
    );
  }
}

// GET /api/stations?id=station_id - Get station by ID
export async function getStationById(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const stationId = searchParams.get('id');

  if (!stationId) {
    return NextResponse.json(
      { success: false, error: 'Station ID is required' },
      { status: 400 }
    );
  }

  try {
    const station = await fetchStationById(stationId);
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
  } catch (error) {
    console.error('❌ Error fetching station by ID:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch station' },
      { status: 500 }
    );
  }
}

// GET /api/stations?type=fire - Get stations by type
export async function getStationsByType(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') as Station['type'];

  if (!type) {
    return NextResponse.json(
      { success: false, error: 'Station type is required' },
      { status: 400 }
    );
  }

  try {
    const stations = await fetchStationsByType(type);
    console.log('✅ Successfully fetched stations by type:', type);
    return NextResponse.json({
      success: true,
      stations: stations
    });
  } catch (error) {
    console.error('❌ Error fetching stations by type:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stations by type' },
      { status: 500 }
    );
  }
}

// GET /api/stations?status=operational - Get stations by status
export async function getStationsByStatus(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') as Station['status'];

  if (!status) {
    return NextResponse.json(
      { success: false, error: 'Station status is required' },
      { status: 400 }
    );
  }

  try {
    const stations = await fetchStationsByStatus(status);
    console.log('✅ Successfully fetched stations by status:', status);
    return NextResponse.json({
      success: true,
      stations: stations
    });
  } catch (error) {
    console.error('❌ Error fetching stations by status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stations by status' },
      { status: 500 }
    );
  }
}

// POST /api/stations - Add a new station (admin only)
export async function POST(request: NextRequest) {
  console.log('📡 POST /api/stations called - Firestore version');

  try {
const { name, type, location, address, capacity, currentLoad, status, contact, phone, email, website, description } = await request.json();

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Station name is required' },
        { status: 400 }
      );
    }

    const stationData = {
      name,
      type: type || 'medical',
      location: location || { lat: 0, lng: 0 },
      address: address || 'Unknown',
      capacity: capacity || 0,
      currentLoad: currentLoad || 0,
      status: status || 'operational',
      contact: contact || 'Unknown',
      phone: phone || '',
      email: email || '',
      website: website || '',
      description: description || ''
    };

    const stationId = await createStation(stationData);
    const station = await fetchStationById(stationId);

    console.log('✅ Station added to Firestore:', stationId);
    return NextResponse.json({ success: true, station: station });
  } catch (error) {
    console.error('❌ Error adding station:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add station' },
      { status: 500 }
    );
  }
}

// PUT /api/stations - Update a station (admin only)
export async function PUT(request: NextRequest) {
  console.log('📡 PUT /api/stations called - Firestore version');

  try {
    const { id, name, type, location, address, capacity, currentLoad, status, contact, phone, email, website, description } = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Station ID is required' },
        { status: 400 }
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
      description
    };

    await updateStation(id, stationData);
    const updatedStation = await fetchStationById(id);

    console.log('✅ Station updated in Firestore:', id);
    return NextResponse.json({ success: true, station: updatedStation });
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
  console.log('📡 DELETE /api/stations called - Firestore version');

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
    const defaultStationIds = ['station_1', 'station_2', 'station_3', 'station_4'];
    if (defaultStationIds.includes(stationId)) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete default stations' },
        { status: 400 }
      );
    }

    await deleteStation(stationId);

    console.log('✅ Station deleted from Firestore:', stationId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Error deleting station:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete station' },
      { status: 500 }
    );
  }
}