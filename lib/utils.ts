export async function getCurrentLocation(): Promise<{ lat: number; lng: number }> {
  return new Promise(async (resolve, reject) => {
    // First, check if user has manually set their location
    const manualLocation = localStorage.getItem('user_manual_location');
    if (manualLocation) {
      try {
        const locationData = JSON.parse(manualLocation);
        console.log('📍 Using manually set location:', locationData);
        resolve({ lat: locationData.lat, lng: locationData.lng });
        return;
      } catch (error) {
        console.warn('⚠️ Invalid manual location data, continuing with automatic detection');
        localStorage.removeItem('user_manual_location'); // Clean up invalid data
      }
    }

    // Check if we're on HTTPS or localhost (required for geolocation in most browsers)
    const isSecure = location.protocol === 'https:' ||
                     location.hostname === 'localhost' ||
                     location.hostname === '127.0.0.1';

    if (!navigator.geolocation) {
      console.log('📍 Geolocation not supported, trying IP-based location');
      try {
        const ipLocation = await getLocationByIP();
        resolve(ipLocation);
      } catch (ipError) {
        console.log('📍 IP-based location also failed, using fallback location');
        resolve(getFallbackLocation());
      }
      return;
    }

    // Try geolocation with multiple attempts for better accuracy
    let attempts = 0;
    const maxAttempts = 3;

    const tryGeolocation = () => {
      attempts++;
      console.log(`📍 Attempting geolocation (attempt ${attempts}/${maxAttempts})`);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          console.log(`📍 Geolocation successful: ${location.lat}, ${location.lng} (accuracy: ${position.coords.accuracy}m)`);
          resolve(location);
        },
        async (error) => {
          console.log(`📍 Geolocation attempt ${attempts} failed:`, error.message);

          if (attempts < maxAttempts) {
            // Wait a bit and try again with slightly different options
            setTimeout(tryGeolocation, 1000 * attempts); // Progressive delay
          } else {
            // All geolocation attempts failed, try IP-based location
            console.log('📍 All geolocation attempts failed, trying IP-based location');
            try {
              const ipLocation = await getLocationByIP();
              resolve(ipLocation);
            } catch (ipError) {
              console.log('📍 IP-based location also failed, using fallback location');
              resolve(getFallbackLocation());
            }
          }
        },
        {
          enableHighAccuracy: true,
          timeout: isSecure ? 10000 : 5000, // Longer timeout for secure connections
          maximumAge: 300000 // 5 minute cache
        }
      );
    };

    // If not secure, try IP-based first, then fall back to geolocation
    if (!isSecure) {
      console.log('📍 HTTP environment detected, trying IP-based location first');
      try {
        const ipLocation = await getLocationByIP();
        resolve(ipLocation);
        return;
      } catch (ipError) {
        console.log('📍 IP-based location failed in HTTP environment, trying geolocation anyway');
        tryGeolocation();
      }
    } else {
      // Secure environment, try geolocation first
      tryGeolocation();
    }
  });
}

// Fallback location function to avoid CORS issues with IP-based geolocation
function getFallbackLocation(): { lat: number; lng: number } {
  console.log('📍 Using Philippines center as fallback location');
  return {
    lat: 14.5995, // Manila coordinates as fallback
    lng: 120.9842,
  };
}

// Get location based on IP address (more accurate than fixed coordinates)
async function getLocationByIP(): Promise<{ lat: number; lng: number }> {
  try {
    console.log('🌐 Getting location by IP address...');

    // Try multiple IP geolocation services for better accuracy
    const services = [
      'https://ipapi.co/json/',
      'https://api.ipify.org?format=json', // For IP first, then geolocate
      'https://api.ip.sb/geoip', // Alternative service
    ];

    for (const serviceUrl of services) {
      try {
        const response = await fetch(serviceUrl);
        const data = await response.json();

        // Handle different API response formats
        let lat, lng, city, region, country;

        if (serviceUrl.includes('ipapi.co')) {
          lat = data.latitude;
          lng = data.longitude;
          city = data.city;
          region = data.region;
          country = data.country_name;
        } else if (serviceUrl.includes('ip.sb')) {
          lat = data.latitude;
          lng = data.longitude;
          city = data.city;
          region = data.region;
          country = data.country;
        }

        if (lat && lng) {
          console.log(`📍 IP-based location: ${city || 'Unknown'}, ${region || 'Unknown'}, ${country || 'Unknown'}`);
          console.log(`📍 Coordinates: ${lat}, ${lng}`);
          return { lat: parseFloat(lat), lng: parseFloat(lng) };
        }
      } catch (serviceError) {
        console.warn(`❌ ${serviceUrl} failed:`, serviceError);
        continue; // Try next service
      }
    }

    // If all services failed, try a more comprehensive geolocation service
    try {
      console.log('🌐 Trying comprehensive IP geolocation...');
      const response = await fetch('https://api.ipgeolocation.io/ipgeo?apiKey=free');
      const data = await response.json();

      if (data.latitude && data.longitude) {
        console.log(`📍 Comprehensive IP location: ${data.city}, ${data.state_prov}, ${data.country_name}`);
        return {
          lat: parseFloat(data.latitude),
          lng: parseFloat(data.longitude),
        };
      }
    } catch (comprehensiveError) {
      console.warn('❌ Comprehensive geolocation failed:', comprehensiveError);
    }

  } catch (error) {
    console.warn('❌ All IP geolocation services failed:', error);
  }

  // If user is clearly not in Manila area, provide more regional fallbacks
  console.warn('⚠️ Using regional fallback based on common Philippine locations');

  // Try to determine a reasonable fallback based on common locations
  // For now, we'll use Cebu as it's a common alternative to Manila
  return {
    lat: 10.3157, // Cebu City coordinates as regional fallback
    lng: 123.8854,
  };
}

export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
    );
    const data = await response.json();
    return data.display_name || `Coordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  } catch {
    return `Coordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  }
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString();
}
