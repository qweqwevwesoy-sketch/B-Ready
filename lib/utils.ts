export async function getCurrentLocation(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }

    // Check if we're on HTTPS or localhost (required for geolocation in most browsers)
    const isSecure = location.protocol === 'https:' ||
                     location.hostname === 'localhost' ||
                     location.hostname === '127.0.0.1' ||
                     location.hostname.startsWith('192.168.');

    if (!isSecure) {
      reject(new Error('Geolocation requires HTTPS. Please ensure you\'re accessing the site over a secure connection.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        // For development, provide fallback coordinates if geolocation fails
        if (process.env.NODE_ENV === 'development' && error.code === 1) {
          console.warn('⚠️ Geolocation denied, using fallback coordinates for development');
          resolve({
            lat: 14.5995, // Manila coordinates as fallback
            lng: 120.9842,
          });
        } else {
          reject(error);
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  });
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
