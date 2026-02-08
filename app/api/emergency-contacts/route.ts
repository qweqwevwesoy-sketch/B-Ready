import { NextRequest, NextResponse } from 'next/server';
import { fetchStations } from '@/lib/firebase-service';
import type { EmergencyContact, Station } from '@/types';

console.log('🚀 Emergency Contacts API route loaded - Now using stations data');

export async function GET() {
  try {
    console.log('📡 GET /api/emergency-contacts called');
    
    // Get all stations from Firestore
    const stations = await fetchStations();
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