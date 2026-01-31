import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, doc, updateDoc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { app } from '@/lib/firebase';
import { authenticateAdminRequest } from '@/lib/server-auth';

const db = getFirestore(app);
const auth = getAuth(app);

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the admin's authentication token from the request headers
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: No valid token provided' },
        { status: 401 }
      );
    }

    // Use the new authentication helper
    const authResult = await authenticateAdminRequest(request);
    
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error || 'Authentication failed' },
        { status: authResult.error?.includes('Unauthorized') ? 401 : 403 }
      );
    }

    const decodedToken = authResult.decodedToken!;

    const reportId = params.id;
    const reportRef = doc(db, 'reports', reportId);

    // Get the current report data
    const reportSnap = await getDoc(reportRef);
    if (!reportSnap.exists()) {
      return NextResponse.json(
        { success: false, error: 'Report not found' },
        { status: 404 }
      );
    }

    const reportData = reportSnap.data();

    // Parse the request body
    const body = await request.json();
    const { adminResponse, adminId, adminLocation, routeCoordinates, estimatedTimeOfArrival } = body;

    // Validate required fields
    if (!adminResponse || !['en_route', 'on_site'].includes(adminResponse)) {
      return NextResponse.json(
        { success: false, error: 'Invalid admin response type' },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: {
      adminResponse: string;
      updatedAt: string;
      adminId?: string;
      adminLocation?: { lat: number; lng: number };
      routeCoordinates?: Array<{ lat: number; lng: number }> | null;
      estimatedTimeOfArrival?: string | null;
      status?: string;
    } = {
      adminResponse,
      updatedAt: new Date().toISOString()
    };

    // Add admin-specific data based on response type
    if (adminResponse === 'en_route') {
      if (!adminLocation || !routeCoordinates || !estimatedTimeOfArrival) {
        return NextResponse.json(
          { success: false, error: 'Missing required data for en_route response' },
          { status: 400 }
        );
      }

      updateData.adminId = adminId;
      updateData.adminLocation = adminLocation;
      updateData.routeCoordinates = routeCoordinates;
      updateData.estimatedTimeOfArrival = estimatedTimeOfArrival;
      
      // Update report status to indicate admin is responding
      updateData.status = 'admin_responding';
    } else if (adminResponse === 'on_site') {
      // Clear route data when admin arrives on site
      updateData.adminId = adminId;
      updateData.routeCoordinates = null;
      updateData.estimatedTimeOfArrival = null;
      
      // Update report status to indicate admin is on site
      updateData.status = 'admin_on_site';
    }

    // Update the report in Firestore
    await updateDoc(reportRef, updateData);

    // Return success response
    return NextResponse.json({
      success: true,
      message: `Admin response updated to: ${adminResponse}`,
      reportId: reportId
    });

  } catch (error) {
    console.error('Error updating admin response:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const reportId = params.id;
    const reportRef = doc(db, 'reports', reportId);
    const reportSnap = await getDoc(reportRef);

    if (!reportSnap.exists()) {
      return NextResponse.json(
        { success: false, error: 'Report not found' },
        { status: 404 }
      );
    }

    const reportData = reportSnap.data();

    // Return admin response information
    return NextResponse.json({
      success: true,
      adminResponse: reportData.adminResponse || 'none',
      adminId: reportData.adminId,
      adminLocation: reportData.adminLocation,
      routeCoordinates: reportData.routeCoordinates,
      estimatedTimeOfArrival: reportData.estimatedTimeOfArrival,
      status: reportData.status
    });

  } catch (error) {
    console.error('Error fetching admin response:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}