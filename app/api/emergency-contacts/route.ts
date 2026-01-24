import { NextRequest, NextResponse } from 'next/server';
import { mysqlConnection } from '@/lib/mysql-connection';

interface EmergencyContact {
  id: string;
  name: string;
  type: 'fire' | 'police' | 'medical' | 'other';
  phone: string;
  address?: string;
  location?: {
    lat: number;
    lng: number;
  };
  created_by: string;
  created_at: string;
  updated_at: string;
}

export async function GET() {
  try {
    const rows = await mysqlConnection.query(
      'SELECT * FROM emergency_contacts ORDER BY type, name'
    );
    
    return NextResponse.json({
      success: true,
      contacts: rows as EmergencyContact[]
    });
  } catch (error) {
    console.error('Error fetching emergency contacts:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch emergency contacts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, type, phone, address, location } = body;
    
    // Validate required fields
    if (!name || !type || !phone) {
      return NextResponse.json(
        { success: false, error: 'Name, type, and phone are required' },
        { status: 400 }
      );
    }
    
    await mysqlConnection.execute(
      'INSERT INTO emergency_contacts (name, type, phone, address, location_lat, location_lng, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, type, phone, address || null, location?.lat || null, location?.lng || null, 'admin']
    );
    
    return NextResponse.json({
      success: true,
      message: 'Emergency contact added successfully'
    });
  } catch (error) {
    console.error('Error adding emergency contact:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add emergency contact' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Contact ID is required' },
        { status: 400 }
      );
    }
    
    const result = await mysqlConnection.execute(
      'DELETE FROM emergency_contacts WHERE id = ?',
      [id]
    );
    
    if (result.affectedRows === 0) {
      return NextResponse.json(
        { success: false, error: 'Contact not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Emergency contact deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting emergency contact:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete emergency contact' },
      { status: 500 }
    );
  }
}
