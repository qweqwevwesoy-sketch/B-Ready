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

    // Check if geolocation is available
    if (!navigator.geolocation) {
      console.log('📍 Geolocation not supported by browser, trying IP-based location');
      try {
        const ipLocation = await getLocationByIP();
        resolve(ipLocation);
      } catch (ipError) {
        console.log('📍 IP-based location also failed, using fallback location');
        resolve(getFallbackLocation());
      }
      return;
    }

    // Check if we're on HTTPS or localhost (affects geolocation behavior)
    const isSecure = location.protocol === 'https:' ||
                     location.hostname === 'localhost' ||
                     location.hostname === '127.0.0.1';

    console.log(`📍 Environment: ${isSecure ? 'Secure (HTTPS/localhost)' : 'HTTP environment'}`);

    // Always try geolocation first for accuracy, regardless of HTTP/HTTPS
    // This is crucial for emergency response apps where precision matters
    let attempts = 0;
    const maxAttempts = 3;

    const tryGeolocation = () => {
      attempts++;
      console.log(`📍 Attempting precise geolocation (attempt ${attempts}/${maxAttempts})`);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          console.log(`✅ Geolocation successful: ${location.lat}, ${location.lng} (accuracy: ${position.coords.accuracy}m)`);
          resolve(location);
        },
        async (error) => {
          console.log(`⚠️ Geolocation attempt ${attempts} failed:`, getGeolocationErrorMessage(error));

          if (attempts < maxAttempts) {
            // Progressive backoff with longer timeouts for better accuracy
            const delay = 2000 * attempts; // 2s, 4s, 6s delays
            console.log(`⏳ Retrying geolocation in ${delay}ms...`);
            setTimeout(tryGeolocation, delay);
          } else {
            // All geolocation attempts failed, fall back to IP-based location
            console.log('❌ All geolocation attempts failed, falling back to IP-based location');
            console.log('💡 For better accuracy, consider:');
            console.log('   - Granting location permissions when prompted');
            console.log('   - Using HTTPS in production');
            console.log('   - Ensuring GPS/location services are enabled on device');

            try {
              const ipLocation = await getLocationByIP();
              resolve(ipLocation);
            } catch (ipError) {
              console.log('❌ IP-based location also failed, using regional fallback');
              resolve(getFallbackLocation());
            }
          }
        },
        {
          enableHighAccuracy: true, // Critical for emergency response accuracy
          timeout: isSecure ? 15000 : 10000, // Longer timeout to get accurate position
          maximumAge: 300000 // 5 minute cache
        }
      );
    };

    // Start with geolocation - prioritize accuracy over protocol
    tryGeolocation();
  });
}

// Helper function to provide user-friendly geolocation error messages
function getGeolocationErrorMessage(error: GeolocationPositionError): string {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return 'Location permission denied. Please enable location access for accurate emergency reporting.';
    case error.POSITION_UNAVAILABLE:
      return 'Location information unavailable. Check GPS/location services on your device.';
    case error.TIMEOUT:
      return 'Location request timed out. Try again or check your GPS signal.';
    default:
      return `Location error: ${error.message}`;
  }
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

    // Use services that work over HTTP without CORS issues
    const services = [
      // Use a CORS-enabled service that works over HTTP
      {
        url: 'https://ipapi.co/json/',
        headers: { 'Accept': 'application/json' }
      },
      // Alternative service that might work
      {
        url: 'https://api.ip.sb/geoip',
        headers: { 'Accept': 'application/json' }
      },
      // JSONP approach for services that support it
      {
        url: 'https://api.ipgeolocation.io/ipgeo?apiKey=free',
        headers: { 'Accept': 'application/json' }
      }
    ];

    for (const service of services) {
      try {
        console.log(`🌐 Trying ${service.url}...`);
        const response = await fetch(service.url, {
          method: 'GET',
          headers: service.headers,
          // Add timeout to prevent hanging
          signal: AbortSignal.timeout(5000)
        });

        if (!response.ok) {
          console.warn(`❌ ${service.url} returned ${response.status}`);
          continue;
        }

        const data = await response.json();
        console.log('📍 IP API response:', data);

        // Handle different API response formats
        let lat, lng, city, region, country;

        if (service.url.includes('ipapi.co')) {
          lat = data.latitude;
          lng = data.longitude;
          city = data.city;
          region = data.region;
          country = data.country_name;
        } else if (service.url.includes('ip.sb')) {
          lat = data.latitude;
          lng = data.longitude;
          city = data.city;
          region = data.region;
          country = data.country;
        } else if (service.url.includes('ipgeolocation.io')) {
          lat = data.latitude;
          lng = data.longitude;
          city = data.city;
          region = data.state_prov;
          country = data.country_name;
        }

        if (lat && lng && !isNaN(parseFloat(lat)) && !isNaN(parseFloat(lng))) {
          console.log(`✅ IP-based location successful: ${city || 'Unknown'}, ${region || 'Unknown'}, ${country || 'Unknown'}`);
          console.log(`📍 Coordinates: ${lat}, ${lng}`);
          return { lat: parseFloat(lat), lng: parseFloat(lng) };
        } else {
          console.warn(`⚠️ Invalid coordinates from ${service.url}:`, { lat, lng });
        }
      } catch (serviceError) {
        console.warn(`❌ ${service.url} failed:`, serviceError instanceof Error ? serviceError.message : serviceError);
        continue; // Try next service
      }
    }

    // If all external services failed, try a different approach
    console.log('🌐 All external IP services failed, trying alternative method...');

    // Try using a service that supports JSONP or has CORS enabled
    try {
      // Use a reliable CORS-enabled service
      const response = await fetch('https://api.ipify.org?format=json', {
        signal: AbortSignal.timeout(3000)
      });
      const ipData = await response.json();

      if (ipData.ip) {
        console.log(`📍 Got IP address: ${ipData.ip}`);

        // For now, return a reasonable default for Philippines
        // In production, you might want to implement server-side IP geolocation
        console.log('📍 Using regional default for IP-based location (Philippines)');
        return {
          lat: 14.5995, // Manila coordinates
          lng: 120.9842,
        };
      }
    } catch (ipError) {
      console.warn('❌ Could not get IP address:', ipError);
    }

  } catch (error) {
    console.warn('❌ All IP geolocation services failed:', error);
  }

  // Regional fallback for Philippines
  console.warn('⚠️ Using Philippines regional fallback location');
  console.log('💡 Tip: For accurate location, grant browser location permissions or use HTTPS');

  return {
    lat: 14.5995, // Manila coordinates as final fallback
    lng: 120.9842,
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
