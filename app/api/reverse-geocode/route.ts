import { NextRequest, NextResponse } from 'next/server';

// Server-side reverse geocoding to avoid CORS issues
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');

  if (!lat || !lng) {
    return NextResponse.json(
      { success: false, error: 'Latitude and longitude are required' },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'B-Ready-Emergency-App/1.0'
        }
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: `Reverse geocoding failed with status ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const address = data.display_name || `Coordinates: ${lat}, ${lng}`;

    return NextResponse.json({
      success: true,
      address: address
    });
  } catch (error) {
    console.error('❌ Reverse geocoding error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to perform reverse geocoding' },
      { status: 500 }
    );
  }
}