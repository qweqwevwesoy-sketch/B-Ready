import { NextRequest, NextResponse } from 'next/server';
import mysqlConnection from '@/lib/mysql-connection';

export async function GET() {
  try {
    const rows = await mysqlConnection.query('SELECT * FROM emergency_contacts ORDER BY name ASC');
    
    return NextResponse.json({
      success: true,
      contacts: rows
    });
  } catch (error) {
    console.error('Error fetching emergency contacts:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch emergency contacts'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, phoneNumber, type, location, description } = body;
    
    if (!name || !phoneNumber || !type) {
      return NextResponse.json({
        success: false,
        error: 'Name, phone number, and type are required'
      }, { status: 400 });
    }

    const result = await mysqlConnection.execute(
      'INSERT INTO emergency_contacts (name, phone_number, type, location, description) VALUES (?, ?, ?, ?, ?)',
      [name, phoneNumber, type, location || null, description || null]
    );
    
    return NextResponse.json({
      success: true,
      contact: {
        id: result.insertId,
        name,
        phoneNumber,
        type,
        location,
        description
      }
    });
  } catch (error) {
    console.error('Error adding emergency contact:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to add emergency contact'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Contact ID is required'
      }, { status: 400 });
    }

    const result = await mysqlConnection.execute(
      'DELETE FROM emergency_contacts WHERE id = ?',
      [id]
    );
    
    if (result.affectedRows === 0) {
      return NextResponse.json({
        success: false,
        error: 'Contact not found'
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true
    });
  } catch (error) {
    console.error('Error deleting emergency contact:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to delete emergency contact'
    }, { status: 500 });
  }
}
