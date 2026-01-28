import { getCurrentLocation } from './utils';
import { mapTileCache } from './map-tile-cache';

export interface Location {
  lat: number;
  lng: number;
  accuracy?: number;
  timestamp: number;
  source: 'gps' | 'profile' | 'manual' | 'fallback';
}

export interface LocationManagerOptions {
  cacheRadius?: number; // miles
  enableAutoCache?: boolean;
  enableLocationTracking?: boolean;
  cacheOnLocationChange?: boolean;
}

class LocationManager {
  private currentLocation: Location | null = null;
  private locationListeners: Array<(location: Location | null) => void> = [];
  private cacheRadius: number;
  private enableAutoCache: boolean;
  private enableLocationTracking: boolean;
  private cacheOnLocationChange: boolean;
  private locationTrackingInterval: NodeJS.Timeout | null = null;
  private lastCacheTime: number = 0;
  private cacheCooldown: number = 5 * 60 * 1000; // 5 minutes between auto-caches

  constructor(options: LocationManagerOptions = {}) {
    this.cacheRadius = options.cacheRadius || 5;
    this.enableAutoCache = options.enableAutoCache !== false; // Default true
    this.enableLocationTracking = options.enableLocationTracking !== false; // Default true
    this.cacheOnLocationChange = options.cacheOnLocationChange !== false; // Default true

    this.initializeLocation();
  }

  /**
   * Initialize location detection with priority order:
   * 1. Manual location (highest priority)
   * 2. GPS location (real-time)
   * 3. Profile address (fallback)
   * 4. Default fallback (lowest priority)
   */
  private async initializeLocation(): Promise<void> {
    try {
      // Check for manual location first
      const manualLocation = this.getManualLocation();
      if (manualLocation) {
        this.updateLocation({
          ...manualLocation,
          source: 'manual',
          timestamp: Date.now(),
        });
        return;
      }

      // Try GPS location
      const gpsLocation = await this.getGPSLocation();
      if (gpsLocation) {
        this.updateLocation({
          ...gpsLocation,
          source: 'gps',
          timestamp: Date.now(),
        });
        return;
      }

      // Try profile address
      const profileLocation = await this.getProfileLocation();
      if (profileLocation) {
        this.updateLocation({
          ...profileLocation,
          source: 'profile',
          timestamp: Date.now(),
        });
        return;
      }

      // Use default fallback
      this.updateLocation({
        lat: 14.5995, // Manila coordinates
        lng: 120.9842,
        source: 'fallback',
        timestamp: Date.now(),
      });

    } catch (error) {
      console.error('❌ Failed to initialize location:', error);
      // Fallback to default location
      this.updateLocation({
        lat: 14.5995,
        lng: 120.9842,
        source: 'fallback',
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Get current location
   */
  getCurrentLocation(): Location | null {
    return this.currentLocation;
  }

  /**
   * Get GPS location with high accuracy
   */
  private async getGPSLocation(): Promise<{ lat: number; lng: number; accuracy?: number } | null> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
        },
        (error) => {
          console.warn('⚠️ GPS location failed:', error.message);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes
        }
      );
    });
  }

  /**
   * Get location from user profile
   */
  private async getProfileLocation(): Promise<{ lat: number; lng: number } | null> {
    try {
      // Try to get address from localStorage (cached user profile)
      const cachedUser = localStorage.getItem('bready_user_location');
      if (cachedUser) {
        const userData = JSON.parse(cachedUser);
        if (userData.address) {
          // For now, return a default location for the Philippines
          // In a full implementation, you'd use a geocoding service
          return {
            lat: 14.5995,
            lng: 120.9842,
          };
        }
      }

      // Try to get manual location from localStorage
      const manualLocation = this.getManualLocation();
      if (manualLocation) {
        return manualLocation;
      }

      return null;
    } catch (error) {
      console.error('❌ Failed to get profile location:', error);
      return null;
    }
  }

  /**
   * Get manually set location from localStorage
   */
  private getManualLocation(): { lat: number; lng: number } | null {
    try {
      const manualLocation = localStorage.getItem('user_manual_location');
      if (manualLocation) {
        return JSON.parse(manualLocation);
      }
      return null;
    } catch (error) {
      console.error('❌ Failed to get manual location:', error);
      return null;
    }
  }

  /**
   * Update current location and notify listeners
   */
  private updateLocation(newLocation: Location): void {
    const oldLocation = this.currentLocation;
    this.currentLocation = newLocation;

    console.log(`📍 Location updated: ${newLocation.source} - ${newLocation.lat.toFixed(6)}, ${newLocation.lng.toFixed(6)}`);

    // Notify listeners
    this.locationListeners.forEach(listener => {
      try {
        listener(newLocation);
      } catch (error) {
        console.error('❌ Error in location listener:', error);
      }
    });

    // Handle location change events
    this.handleLocationChange(oldLocation, newLocation);
  }

  /**
   * Handle location changes and trigger appropriate actions
   */
  private handleLocationChange(oldLocation: Location | null, newLocation: Location): void {
    // Check if location source changed to GPS (highest priority)
    if (newLocation.source === 'gps' && oldLocation && oldLocation.source !== 'gps') {
      console.log('🚀 GPS location detected - transitioning from fallback');
      this.handleGPSTransition(oldLocation, newLocation);
    }

    // Auto-cache if enabled and cooldown period has passed
    if (this.cacheOnLocationChange && this.enableAutoCache) {
      const now = Date.now();
      if (now - this.lastCacheTime > this.cacheCooldown) {
        this.preCacheCurrentLocation();
        this.lastCacheTime = now;
      }
    }
  }

  /**
   * Handle transition from fallback to GPS location
   */
  private handleGPSTransition(oldLocation: Location, newLocation: Location): void {
    console.log('🔄 Smooth transition from fallback to GPS location');

    // Remove manual location flag since GPS is now active
    localStorage.removeItem('user_manual_location');

    // Cache the new GPS location area
    this.preCacheCurrentLocation();

    // Optional: Show transition notification to user
    this.showLocationTransitionNotification(oldLocation, newLocation);
  }

  /**
   * Show notification about location transition
   */
  private showLocationTransitionNotification(oldLocation: Location, newLocation: Location): void {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification('📍 Location Updated', {
          body: `Switched from ${oldLocation.source} to GPS location`,
          icon: '/BLogo.png',
        });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification('📍 Location Updated', {
              body: `Switched from ${oldLocation.source} to GPS location`,
              icon: '/BLogo.png',
            });
          }
        });
      }
    }
  }

  /**
   * Pre-cache tiles around current location
   */
  private async preCacheCurrentLocation(): Promise<void> {
    if (!this.currentLocation || !this.enableAutoCache) return;

    try {
      console.log(`🚀 Pre-caching tiles around current location: ${this.currentLocation.lat}, ${this.currentLocation.lng}`);
      await mapTileCache.preCacheLocation(
        this.currentLocation.lat,
        this.currentLocation.lng,
        this.cacheRadius
      );
    } catch (error) {
      console.error('❌ Failed to pre-cache location:', error);
    }
  }

  /**
   * Set manual location override
   */
  async setManualLocation(lat: number, lng: number): Promise<void> {
    const manualLocation = { lat, lng };

    // Store in localStorage
    localStorage.setItem('user_manual_location', JSON.stringify(manualLocation));

    // Update current location
    this.updateLocation({
      ...manualLocation,
      source: 'manual',
      timestamp: Date.now(),
    });

    console.log('📍 Manual location set:', manualLocation);
  }

  /**
   * Clear manual location override
   */
  clearManualLocation(): void {
    localStorage.removeItem('user_manual_location');
    
    // Re-initialize location detection
    this.initializeLocation();
  }

  /**
   * Start location tracking
   */
  startLocationTracking(): void {
    if (!this.enableLocationTracking || this.locationTrackingInterval) {
      return;
    }

    console.log('📍 Starting location tracking');

    this.locationTrackingInterval = setInterval(async () => {
      try {
        const gpsLocation = await this.getGPSLocation();
        if (gpsLocation && this.currentLocation?.source !== 'manual') {
          // Only update if GPS is more accurate or if we don't have a current location
          if (!this.currentLocation || 
              this.currentLocation.source !== 'gps' || 
              (gpsLocation.accuracy && gpsLocation.accuracy < (this.currentLocation.accuracy || Infinity))) {
            
            this.updateLocation({
              ...gpsLocation,
              source: 'gps',
              timestamp: Date.now(),
            });
          }
        }
      } catch (error) {
        console.error('❌ Location tracking error:', error);
      }
    }, 30000); // Check every 30 seconds
  }

  /**
   * Stop location tracking
   */
  stopLocationTracking(): void {
    if (this.locationTrackingInterval) {
      clearInterval(this.locationTrackingInterval);
      this.locationTrackingInterval = null;
      console.log('📍 Stopped location tracking');
    }
  }

  /**
   * Add location change listener
   */
  onLocationChange(callback: (location: Location | null) => void): () => void {
    this.locationListeners.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.locationListeners.indexOf(callback);
      if (index > -1) {
        this.locationListeners.splice(index, 1);
      }
    };
  }

  /**
   * Get cache statistics
   */
  async getCacheStats() {
    return await mapTileCache.getCacheStats();
  }

  /**
   * Clear cache
   */
  async clearCache(): Promise<void> {
    await mapTileCache.clearCache();
  }

  /**
   * Update cache settings
   */
  updateCacheSettings(options: Partial<LocationManagerOptions>): void {
    if (options.cacheRadius !== undefined) {
      this.cacheRadius = options.cacheRadius;
    }
    if (options.enableAutoCache !== undefined) {
      this.enableAutoCache = options.enableAutoCache;
    }
    if (options.enableLocationTracking !== undefined) {
      this.enableLocationTracking = options.enableLocationTracking;
      if (this.enableLocationTracking) {
        this.startLocationTracking();
      } else {
        this.stopLocationTracking();
      }
    }
    if (options.cacheOnLocationChange !== undefined) {
      this.cacheOnLocationChange = options.cacheOnLocationChange;
    }
  }

  /**
   * Get location priority status
   */
  getLocationStatus(): {
    currentSource: string;
    hasGPS: boolean;
    hasProfile: boolean;
    hasManual: boolean;
    accuracy?: number;
  } {
    const hasManual = !!this.getManualLocation();
    const hasProfile = !!this.getProfileLocation();
    
    return {
      currentSource: this.currentLocation?.source || 'unknown',
      hasGPS: this.currentLocation?.source === 'gps',
      hasProfile,
      hasManual,
      accuracy: this.currentLocation?.accuracy,
    };
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.stopLocationTracking();
    this.locationListeners = [];
    this.currentLocation = null;
  }
}

// Create singleton instance
export const locationManager = new LocationManager();

// Export for use in other modules
export default locationManager;