import { NextRequest, NextResponse } from 'next/server';
import type { EmergencyContact, Station } from '@/types';

// Mock stations data (temporary solution)
const mockStations: Station[] = [
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
  },
  {
    id: 'station_3',
    name: 'Test Medical Station',
    type: 'medical',
    location: { lat: 14.61, lng: 120.99 },
    address: 'Test Medical Address',
    capacity: 0,
    currentLoad: 0,
    status: 'operational',
    contact: '555-1234',
    phone: '555-1234',
    email: 'medical@example.com',
    website: 'https://medical.example.com',
    description: 'Test medical station for emergency response',
    created_by: 'admin_user_456',
    emergencyContacts: [],
    created_at: '2026-02-09T17:36:35.615Z',
    updated_at: '2026-02-09T17:36:35.615Z'
  }
];

console.log('🚀 Emergency Contacts API route loaded - Mock version');

export async function GET() {
  try {
    console.log('📡 GET /api/emergency-contacts called');
    
    // Get all stations from mock data
    const stations = mockStations;
    console.log('✅ Successfully fetched stations:', stations.length);
    
    // Extract emergency contacts from stations
    const allContacts: Array<EmergencyContact & { stationId: string; stationName: string; stationType: string }> = [];
    stations.forEach(station => {
      if (station.emergencyContacts && Array.isArray(station.emergencyContacts) && station.emergencyContacts.length > 0) {
        station.emergencyContacts.forEach(contact => {
          allContacts.push({
            ...contact,
            stationId: station.id,
            stationName: station.name,
            stationType: station.type
          });
        });
      }
    });
    
    console.log('✅ Extracted emergency contacts from stations:', allContacts.length);
    
    return NextResponse.json({
      success: true,
      contacts: allContacts
    });
  } catch (error) {
    console.error('❌ Error fetching emergency contacts:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch emergency contacts' },
      { status: 500 }
    );
  }
}

// POST /api/emergency-contacts - Add a new emergency contact to a station (admin only)
export async function POST(request: NextRequest) {
  return NextResponse.json(
    { success: false, error: 'Emergency contacts must be managed through station management' },
    { status: 405 }
  );
}

// DELETE /api/emergency-contacts - Delete an emergency contact (admin only)
export async function DELETE(request: NextRequest) {
  return NextResponse.json(
    { success: false, error: 'Emergency contacts must be managed through station management' },
    { status: 405 }
  );
}
