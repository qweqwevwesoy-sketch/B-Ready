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
      url: `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=en`,
      headers: { 
        'Accept': 'application/json',
        'User-Agent': 'B-READY-App/1.0 (contact@bready.com)'
      } as Record<string, string>
    },
    {
      url: `https://geocode.maps.co/reverse?lat=${lat}&lon=${lng}`,
      headers: { 'Accept': 'application/json' } as Record<string, string>
    },
    {
      url: `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`,
      headers: { 'Accept': 'application/json' } as Record<string, string>
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

      if (service.url.includes('nominatim.openstreetmap.org')) {
        // OpenStreetMap Nominatim format
        if (data && data.display_name) {
          address = data.display_name;
        } else if (data && data.address) {
          const components = [
            data.address.amenity || data.address.house_name || data.address.house_number,
            data.address.road,
            data.address.suburb,
            data.address.city || data.address.town || data.address.village,
            data.address.state,
            data.address.country
          ].filter(Boolean);
          
          address = components.length > 0 ? components.join(', ') : `Coordinates: ${lat}, ${lng}`;
        }
      } else if (service.url.includes('geocode.maps.co')) {
        // Maps.co format
        if (data && data.display_name) {
          address = data.display_name;
        } else if (data && data.address) {
          const components = [
            data.address.amenity || data.address.house_name || data.address.house_number,
            data.address.road,
            data.address.suburb,
            data.address.city || data.address.town || data.address.village,
            data.address.state,
            data.address.country
          ].filter(Boolean);
          
          address = components.length > 0 ? components.join(', ') : `Coordinates: ${lat}, ${lng}`;
        }
      } else if (service.url.includes('bigdatacloud.net')) {
        // BigDataCloud format
        const components = [
          data.city || data.locality,
          data.principalSubdivision,
          data.countryName
        ].filter(Boolean);

        address = components.length > 0 
          ? components.join(', ') + ` ${lat}, ${lng}` 
          : `Coordinates: ${lat}, ${lng}`;
      }

      if (address && address !== 'Coordinates: ' + lat + ', ' + lng) {
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
