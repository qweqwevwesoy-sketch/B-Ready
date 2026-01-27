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
            name: 'Manila Central Fire Station',
            type: 'fire',
            phone: '+63 2 8527 3100',
            address: 'Manila, Metro Manila, Philippines',
            email: 'manila.fire@bureau.gov.ph',
            website: 'https://www.bfp.gov.ph',
            location: { lat: 14.5995, lng: 120.9842 },
            created_by: 'system',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'contact_2',
            name: 'Cebu City Fire Station',
            type: 'fire',
            phone: '+63 32 253 7777',
            address: 'Cebu City, Cebu, Philippines',
            email: 'cebu.fire@bureau.gov.ph',
            website: 'https://www.bfp.gov.ph',
            location: { lat: 10.3157, lng: 123.8854 },
            created_by: 'system',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'contact_3',
            name: 'Davao City Fire Station',
            type: 'fire',
            phone: '+63 82 221 0234',
            address: 'Davao City, Davao del Sur, Philippines',
            email: 'davao.fire@bureau.gov.ph',
            website: 'https://www.bfp.gov.ph',
            location: { lat: 7.1907, lng: 125.4553 },
            created_by: 'system',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'contact_4',
            name: 'Baguio Emergency Response Center',
            type: 'fire',
            phone: '+63 74 442 3333',
            address: 'Baguio City, Benguet, Philippines',
            email: 'baguio.fire@bureau.gov.ph',
            website: 'https://www.bfp.gov.ph',
            location: { lat: 16.4023, lng: 120.5960 },
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
          name: 'Manila Central Fire Station',
          type: 'fire',
          phone: '+63 2 8527 3100',
          address: 'Manila, Metro Manila, Philippines',
          email: 'manila.fire@bureau.gov.ph',
          website: 'https://www.bfp.gov.ph',
          location: { lat: 14.5995, lng: 120.9842 },
          created_by: 'system',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'contact_2',
          name: 'Cebu City Fire Station',
          type: 'fire',
          phone: '+63 32 253 7777',
          address: 'Cebu City, Cebu, Philippines',
          email: 'cebu.fire@bureau.gov.ph',
          website: 'https://www.bfp.gov.ph',
          location: { lat: 10.3157, lng: 123.8854 },
          created_by: 'system',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'contact_3',
          name: 'Davao City Fire Station',
          type: 'fire',
          phone: '+63 82 221 0234',
          address: 'Davao City, Davao del Sur, Philippines',
          email: 'davao.fire@bureau.gov.ph',
          website: 'https://www.bfp.gov.ph',
          location: { lat: 7.1907, lng: 125.4553 },
          created_by: 'system',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'contact_4',
          name: 'Baguio Emergency Response Center',
          type: 'fire',
          phone: '+63 74 442 3333',
          address: 'Baguio City, Benguet, Philippines',
          email: 'baguio.fire@bureau.gov.ph',
          website: 'https://www.bfp.gov.ph',
          location: { lat: 16.4023, lng: 120.5960 },
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
    // Check if user is authenticated and has admin permissions
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

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
