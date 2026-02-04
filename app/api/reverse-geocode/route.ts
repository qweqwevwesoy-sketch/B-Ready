import { NextRequest, NextResponse } from 'next/server';

// Server-side reverse geocoding using a reliable CORS-enabled service
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

  // Try multiple reliable reverse geocoding services
  const services = [
    {
      url: `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`,
      headers: { 'Accept': 'application/json' }
    },
    {
      url: `https://api.positionstack.com/v1/reverse?access_key=YOUR_ACCESS_KEY&query=${lat},${lng}`,
      headers: { 'Accept': 'application/json' }
    },
    {
      url: `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lng}&key=YOUR_API_KEY&language=en`,
      headers: { 'Accept': 'application/json' }
    }
  ];

  for (const service of services) {
    try {
      console.log(`🌐 Trying reverse geocoding service: ${service.url.split('?')[0]}`);
      const response = await fetch(service.url, {
        method: 'GET',
        headers: service.headers,
        signal: AbortSignal.timeout(5000)
      });

      if (!response.ok) {
        console.warn(`❌ ${service.url.split('?')[0]} returned ${response.status}`);
        continue;
      }

      const data = await response.json();

      // Handle different response formats
      let address = '';

      if (service.url.includes('bigdatacloud.net')) {
        address = data.city || data.locality || data.principalSubdivision || data.countryName || `Coordinates: ${lat}, ${lng}`;
      } else if (service.url.includes('positionstack.com')) {
        address = data.data[0]?.label || data.data[0]?.name || `Coordinates: ${lat}, ${lng}`;
      } else if (service.url.includes('opencagedata.com')) {
        address = data.results[0]?.formatted || `Coordinates: ${lat}, ${lng}`;
      }

      if (address) {
        console.log('✅ Reverse geocoding successful');
        return NextResponse.json({
          success: true,
          address: address
        });
      } else {
        console.warn(`⚠️ No address found in response from ${service.url.split('?')[0]}`);
      }
    } catch (serviceError) {
      console.warn(`❌ ${service.url.split('?')[0]} failed:`, serviceError instanceof Error ? serviceError.message : serviceError);
      continue; // Try next service
    }
  }

  // If all services failed, return coordinates as fallback
  console.warn('⚠️ All reverse geocoding services failed, returning coordinates');
  return NextResponse.json({
    success: true,
    address: `Coordinates: ${lat}, ${lng}`
  });
}
