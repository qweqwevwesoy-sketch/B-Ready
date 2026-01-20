import { NextRequest, NextResponse } from 'next/server';

console.log('🚀 Stations API route loaded');

interface Station {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address: string;
  created_by?: string;
}

// GET /api/stations - Get all stations
export async function GET() {
  console.log('📡 GET /api/stations called');

  try {
    // Try to load from database, fallback to mock data if database fails
    const mysqlConnection = await import('@/lib/mysql-connection').then(mod => mod.mysqlConnection);

    try {
      const rows = await mysqlConnection.query(
        'SELECT id, name, lat, lng, address, created_by, created_at FROM emergency_stations ORDER BY created_at ASC'
      );

      const stations: Station[] = rows.map(row => ({
        id: row.id,
        name: row.name,
        lat: parseFloat(row.lat),
        lng: parseFloat(row.lng),
        address: row.address || '',
        created_by: row.created_by
      }));

      console.log('✅ Returning database stations:', stations.length);
      return NextResponse.json({ success: true, stations });
    } catch (dbError) {
      console.warn('⚠️ Database not available, using mock data:', dbError);
    }
  } catch (importError) {
    console.warn('⚠️ Cannot import database connection, using mock data:', importError);
  }

  // Fallback to mock data
  const mockStations: Station[] = [
    {
      id: 'station_1',
      name: 'Manila Central Fire Station',
      lat: 14.5995,
      lng: 120.9842,
      address: 'Manila, Metro Manila, Philippines'
    },
    {
      id: 'station_2',
      name: 'Cebu City Fire Station',
      lat: 10.3157,
      lng: 123.8854,
      address: 'Cebu City, Cebu, Philippines'
    },
    {
      id: 'station_3',
      name: 'Davao City Fire Station',
      lat: 7.1907,
      lng: 125.4553,
      address: 'Davao City, Davao del Sur, Philippines'
    },
    {
      id: 'station_4',
      name: 'Baguio Emergency Response Center',
      lat: 16.4023,
      lng: 120.5960,
      address: 'Baguio City, Benguet, Philippines'
    }
  ];

  console.log('✅ Returning mock stations:', mockStations.length);
  return NextResponse.json({ success: true, stations: mockStations });
}

// POST /api/stations - Add a new station (admin only)
export async function POST(request: NextRequest) {
  console.log('📡 POST /api/stations called');

  try {
    const mysqlConnection = await import('@/lib/mysql-connection').then(mod => mod.mysqlConnection);

    const { name, lat, lng, address, created_by } = await request.json();

    if (!name || !lat || !lng) {
      return NextResponse.json(
        { success: false, error: 'Name, latitude, and longitude are required' },
        { status: 400 }
      );
    }

    // Generate a unique ID
    const stationId = `station_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Ensure database tables are created
    await mysqlConnection.createTables();

    await mysqlConnection.query(
      'INSERT INTO emergency_stations (id, name, lat, lng, address, created_by) VALUES (?, ?, ?, ?, ?, ?)',
      [stationId, name, lat, lng, address || '', created_by || null]
    );

    const newStation: Station = {
      id: stationId,
      name,
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      address: address || '',
      created_by
    };

    console.log('✅ Station added to database:', stationId);
    return NextResponse.json({ success: true, station: newStation });
  } catch (error) {
    console.error('❌ Error adding station:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add station - database may not be running' },
      { status: 500 }
    );
  }
}

// DELETE /api/stations?id=station_id - Delete a station (admin only)
export async function DELETE(request: NextRequest) {
  console.log('📡 DELETE /api/stations called');

  try {
    const mysqlConnection = await import('@/lib/mysql-connection').then(mod => mod.mysqlConnection);

    const { searchParams } = new URL(request.url);
    const stationId = searchParams.get('id');

    if (!stationId) {
      return NextResponse.json(
        { success: false, error: 'Station ID is required' },
        { status: 400 }
      );
    }

    // Don't allow deleting default stations (they have specific IDs)
    const defaultStationIds = ['station_1', 'station_2', 'station_3', 'station_4'];
    if (defaultStationIds.includes(stationId)) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete default stations' },
        { status: 400 }
      );
    }

    const result = await mysqlConnection.execute(
      'DELETE FROM emergency_stations WHERE id = ?',
      [stationId]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { success: false, error: 'Station not found' },
        { status: 404 }
      );
    }

    console.log('✅ Station deleted from database:', stationId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Error deleting station:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete station - database may not be running' },
      { status: 500 }
    );
  }
}
