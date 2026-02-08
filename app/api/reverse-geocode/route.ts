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
      url: `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
      headers: { 
        'Accept': 'application/json',
        'User-Agent': 'B-READY Emergency Response App (https://b-ready.example.com)'
      }
    },
    {
      url: `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`,
      headers: { 
        'Accept': 'application/json',
        'User-Agent': 'B-READY Emergency Response App (https://b-ready.example.com)'
      }
    },
    {
      url: `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lng}&key=YOUR_API_KEY&language=en`,
      headers: { 
        'Accept': 'application/json',
        'User-Agent': 'B-READY Emergency Response App (https://b-ready.example.com)'
      }
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

      if (service.url.includes('nominatim')) {
        // Use the display_name from Nominatim for a complete address
        if (data.display_name) {
          address = data.display_name;
        } else {
          // Fallback to building address components if available
          const components = [
            data.address?.road,
            data.address?.building,
            data.address?.neighbourhood,
            data.address?.suburb,
            data.address?.city,
            data.address?.region,
            data.address?.postcode,
            data.address?.country
          ].filter(Boolean);
          
          address = components.length > 0 ? components.join(', ') : 'Location not specified';
        }
      } else if (service.url.includes('bigdatacloud.net')) {
        // Build address format from available data
        const components = [
          // Try to get street-level details if available (fallback to locality)
          data.address?.road || data.address?.building || data.locality,
          data.address?.suburb,
          data.address?.district,
          data.city,
          data.principalSubdivision,
          data.postcode,
          data.countryName.replace(' (the)', '') // Clean up country name
        ].filter(Boolean);

        // Remove duplicate components
        const uniqueComponents = [];
        const seen = new Set();
        for (const component of components) {
          if (!seen.has(component)) {
            seen.add(component);
            uniqueComponents.push(component);
          }
        }

        address = uniqueComponents.length > 0 
          ? uniqueComponents.join(', ') 
          : 'Location not specified';
      } else if (service.url.includes('opencagedata.com')) {
        // Use formatted address if available
        address = data.results[0]?.formatted || 'Location not specified';
      } else if (service.url.includes('positionstack.com')) {
        // Use the label if available, otherwise build from components
        address = data.data[0]?.label || 
                 (data.data[0]?.name && data.data[0].name) ||
                 'Location not specified';
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

  // If all services failed, return a proper fallback
  console.warn('⚠️ All reverse geocoding services failed');
  return NextResponse.json({
    success: true,
    address: 'Location not specified'
  });
}