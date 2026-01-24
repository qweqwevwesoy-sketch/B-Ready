import { NextRequest, NextResponse } from 'next/server';
import { mysqlConnection } from '@/lib/mysql-connection';

console.log('🚀 Stations API route loaded - Database version');

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
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

// GET /api/stations - Get all stations
export async function GET() {
  console.log('📡 GET /api/stations called - Database version');

  try {
    const rows = await mysqlConnection.query(
      'SELECT * FROM emergency_stations ORDER BY name'
    );

    return NextResponse.json({
      success: true,
      stations: rows as Station[]
    });
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
  console.log('📡 POST /api/stations called - Database version');

  try {
    const { name, lat, lng, address, phone, email, website, description, created_by } = await request.json();

    if (!name || lat === undefined || lng === undefined) {
      return NextResponse.json(
        { success: false, error: 'Name, latitude, and longitude are required' },
        { status: 400 }
      );
    }

    // Generate a unique ID
    const stationId = `station_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await mysqlConnection.execute(
      'INSERT INTO emergency_stations (id, name, lat, lng, address, phone, email, website, description, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        stationId,
        name,
        parseFloat(lat),
        parseFloat(lng),
        address || null,
        phone || null,
        email || null,
        website || null,
        description || null,
        created_by || null
      ]
    );

    // Fetch the newly created station
    const [newStation] = await mysqlConnection.query(
      'SELECT * FROM emergency_stations WHERE id = ?',
      [stationId]
    );

    console.log('✅ Station added to database:', stationId);
    return NextResponse.json({ success: true, station: newStation as Station });
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
  console.log('📡 DELETE /api/stations called - Database version');

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
      { success: false, error: 'Failed to delete station' },
      { status: 500 }
    );
  }
}

// PUT /api/stations - Update a station (admin only)
export async function PUT(request: NextRequest) {
  console.log('📡 PUT /api/stations called - Database version');

  try {
    const { id, name, lat, lng, address, phone, email, website, description } = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Station ID is required' },
        { status: 400 }
      );
    }

    // Build update query dynamically based on provided fields
    const updates: string[] = [];
    const params: (string | number | null)[] = [];

    if (name !== undefined) { updates.push('name = ?'); params.push(name); }
    if (lat !== undefined) { updates.push('lat = ?'); params.push(parseFloat(lat)); }
    if (lng !== undefined) { updates.push('lng = ?'); params.push(parseFloat(lng)); }
    if (address !== undefined) { updates.push('address = ?'); params.push(address); }
    if (phone !== undefined) { updates.push('phone = ?'); params.push(phone); }
    if (email !== undefined) { updates.push('email = ?'); params.push(email); }
    if (website !== undefined) { updates.push('website = ?'); params.push(website); }
    if (description !== undefined) { updates.push('description = ?'); params.push(description); }

    if (updates.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No fields to update' },
        { status: 400 }
      );
    }

    params.push(id); // Add ID for WHERE clause

    const query = `UPDATE emergency_stations SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;

    const result = await mysqlConnection.execute(query, params);

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { success: false, error: 'Station not found' },
        { status: 404 }
      );
    }

    // Fetch the updated station
    const [updatedStation] = await mysqlConnection.query(
      'SELECT * FROM emergency_stations WHERE id = ?',
      [id]
    );

    console.log('✅ Station updated in database:', id);
    return NextResponse.json({ success: true, station: updatedStation as Station });
  } catch (error) {
    console.error('❌ Error updating station:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update station' },
      { status: 500 }
    );
  }
}
