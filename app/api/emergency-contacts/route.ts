import { NextRequest, NextResponse } from 'next/server';
import { mysqlConnection } from '@/lib/mysql-connection';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

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
    // Try database first
    const rows = await mysqlConnection.query(
      'SELECT * FROM emergency_contacts ORDER BY type, name'
    );

    return NextResponse.json({
      success: true,
      contacts: rows as EmergencyContact[]
    });
  } catch (error) {
    console.error('❌ Database error fetching emergency contacts:', error);

    // Fallback to Firebase if database fails
    try {
      console.log('🔥 Falling back to Firebase for emergency contacts data');
      const contactsCollection = collection(db, 'emergency_contacts');
      const snapshot = await getDocs(contactsCollection);

      const contacts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as EmergencyContact[];

      // If Firebase also fails or returns empty, return default contacts
      if (contacts.length === 0) {
        console.log('📋 Using default emergency contacts as fallback');
        const defaultContacts = [
          {
            id: 'contact_1',
            name: 'Manila Fire Department',
            type: 'fire',
            phone: '911',
            address: 'Manila, Metro Manila',
            location: { lat: 14.5995, lng: 120.9842 },
            created_by: 'system',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'contact_2',
            name: 'Manila Police Department',
            type: 'police',
            phone: '117',
            address: 'Manila, Metro Manila',
            location: { lat: 14.5995, lng: 120.9842 },
            created_by: 'system',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'contact_3',
            name: 'Manila Medical Center',
            type: 'medical',
            phone: '160',
            address: 'Manila, Metro Manila',
            location: { lat: 14.5995, lng: 120.9842 },
            created_by: 'system',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ];

        return NextResponse.json({
          success: true,
          contacts: defaultContacts
        });
      }

      return NextResponse.json({
        success: true,
        contacts: contacts
      });
    } catch (firebaseError) {
      console.error('❌ Firebase error fetching emergency contacts:', firebaseError);

      // Return default contacts as last resort
      const defaultContacts = [
        {
          id: 'contact_1',
          name: 'Manila Fire Department',
          type: 'fire',
          phone: '911',
          address: 'Manila, Metro Manila',
          location: { lat: 14.5995, lng: 120.9842 },
          created_by: 'system',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'contact_2',
          name: 'Manila Police Department',
          type: 'police',
          phone: '117',
          address: 'Manila, Metro Manila',
          location: { lat: 14.5995, lng: 120.9842 },
          created_by: 'system',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'contact_3',
          name: 'Manila Medical Center',
          type: 'medical',
          phone: '160',
          address: 'Manila, Metro Manila',
          location: { lat: 14.5995, lng: 120.9842 },
          created_by: 'system',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      return NextResponse.json({
        success: true,
        contacts: defaultContacts
      });
    }
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
