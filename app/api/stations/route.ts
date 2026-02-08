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
export async function GET(request: NextRequest) {
  console.log('📡 GET /api/stations called - Firestore version');

  const { searchParams } = new URL(request.url);
  const stationId = searchParams.get('id');
  const type = searchParams.get('type');
  const status = searchParams.get('status');

  try {
    if (stationId) {
      // Get station by ID
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
    } else if (type) {
      // Get stations by type
      const validTypes = ['fire', 'police', 'medical', 'barangay'];
      if (!validTypes.includes(type)) {
        return NextResponse.json(
          { success: false, error: 'Invalid station type' },
          { status: 400 }
        );
      }
      
      const stations = await fetchStationsByType(type as 'fire' | 'police' | 'medical' | 'barangay');
      console.log('✅ Successfully fetched stations by type:', type);
      return NextResponse.json({
        success: true,
        stations: stations
      });
    } else if (status) {
      // Get stations by status
      const validStatuses = ['operational', 'overloaded', 'closed'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { success: false, error: 'Invalid station status' },
          { status: 400 }
        );
      }
      
      const stations = await fetchStationsByStatus(status as 'operational' | 'overloaded' | 'closed');
      console.log('✅ Successfully fetched stations by status:', status);
      return NextResponse.json({
        success: true,
        stations: stations
      });
    } else {
      // Get all stations
      const stations = await fetchStations();
      console.log('✅ Successfully fetched stations from Firestore:', stations.length);
      return NextResponse.json({
        success: true,
        stations: stations
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
  console.log('📡 POST /api/stations called - Firestore version');

  try {
    const { name, lat, lng, address, phone, email, website, description, created_by } = await request.json();
    console.log('📡 Received station data:', { name, lat, lng, address, phone, email, website, description, created_by });

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Station name is required' },
        { status: 400 }
      );
    }

    const stationData = {
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
      description: description || ''
    };

    console.log('📡 Creating station with data:', stationData);
    const stationId = await createStation(stationData);
    console.log('📡 Station created with ID:', stationId);
    const station = await fetchStationById(stationId);
    console.log('📡 Fetched station data:', station);

    return NextResponse.json({ success: true, station: station });
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