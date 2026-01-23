import { NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';

console.log('🚀 Stations API route loaded - Firebase version');

// Initialize Firebase Admin (reuse if already initialized)
if (!admin.apps.length) {
  try {
    const serviceAccount = {
      type: "service_account",
      project_id: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID!,
      private_key: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL!,
      client_id: process.env.FIREBASE_CLIENT_ID!,
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL!
    };

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    });
    console.log('✅ Firebase Admin initialized in stations API');
  } catch (firebaseError) {
    console.warn('⚠️ Firebase Admin initialization failed:', firebaseError instanceof Error ? firebaseError.message : String(firebaseError));
  }
}

const db = admin.apps.length > 0 ? admin.firestore() : null;

interface Station {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

// GET /api/stations - Get all stations
export async function GET() {
  console.log('📡 GET /api/stations called - Firebase version');

  try {
    if (!db) {
      console.warn('⚠️ Firebase not available, returning empty stations');
      return NextResponse.json({ success: true, stations: [] });
    }

    const stationsRef = db.collection('stations');
    const snapshot = await stationsRef.get();

    const stations: Station[] = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      stations.push({
        id: doc.id,
        name: data.name || '',
        lat: parseFloat(data.lat) || 0,
        lng: parseFloat(data.lng) || 0,
        address: data.address || '',
        created_by: data.created_by,
        created_at: data.created_at?.toDate?.()?.toISOString() || data.created_at,
        updated_at: data.updated_at?.toDate?.()?.toISOString() || data.updated_at
      });
    });

    console.log('✅ Returning Firebase stations:', stations.length);
    return NextResponse.json({ success: true, stations });
  } catch (error) {
    console.error('❌ Error loading stations from Firebase:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load stations from Firebase' },
      { status: 500 }
    );
  }
}

// POST /api/stations - Add a new station (admin only)
export async function POST(request: NextRequest) {
  console.log('📡 POST /api/stations called - Firebase version');

  try {
    if (!db) {
      return NextResponse.json(
        { success: false, error: 'Firebase not available' },
        { status: 503 }
      );
    }

    const { name, lat, lng, address, created_by } = await request.json();

    if (!name || lat === undefined || lng === undefined) {
      return NextResponse.json(
        { success: false, error: 'Name, latitude, and longitude are required' },
        { status: 400 }
      );
    }

    // Generate a unique ID
    const stationId = `station_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const stationData = {
      name,
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      address: address || '',
      created_by: created_by || null,
      created_at: admin.firestore.Timestamp.fromDate(new Date()),
      updated_at: admin.firestore.Timestamp.fromDate(new Date())
    };

    // Add to Firebase
    await db.collection('stations').doc(stationId).set(stationData);

    const newStation: Station = {
      id: stationId,
      ...stationData,
      created_at: stationData.created_at.toDate().toISOString(),
      updated_at: stationData.updated_at.toDate().toISOString()
    };

    console.log('✅ Station added to Firebase:', stationId);
    return NextResponse.json({ success: true, station: newStation });
  } catch (error) {
    console.error('❌ Error adding station to Firebase:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add station to Firebase' },
      { status: 500 }
    );
  }
}

// DELETE /api/stations?id=station_id - Delete a station (admin only)
export async function DELETE(request: NextRequest) {
  console.log('📡 DELETE /api/stations called - Firebase version');

  try {
    if (!db) {
      return NextResponse.json(
        { success: false, error: 'Firebase not available' },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const stationId = searchParams.get('id');

    if (!stationId) {
      return NextResponse.json(
        { success: false, error: 'Station ID is required' },
        { status: 400 }
      );
    }

    // Delete from Firebase
    await db.collection('stations').doc(stationId).delete();

    console.log('✅ Station deleted from Firebase:', stationId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Error deleting station from Firebase:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete station from Firebase' },
      { status: 500 }
    );
  }
}
