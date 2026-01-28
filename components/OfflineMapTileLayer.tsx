import { useEffect, useRef, useState } from 'react';
import * as L from 'leaflet';
import { mapTileCache } from '@/lib/map-tile-cache';

// Extend Leaflet's TileLayer options to include our cache options
interface OfflineTileLayerOptions extends L.TileLayerOptions {
  cacheEnabled?: boolean;
  cacheRadius?: number; // miles
  onCacheHit?: (tileUrl: string) => void;
  onCacheMiss?: (tileUrl: string) => void;
  onCacheError?: (tileUrl: string, error: Error) => void;
}

// Custom tile layer class that extends L.TileLayer
class OfflineTileLayer extends L.TileLayer {
  private cacheEnabled: boolean;
  private cacheRadius: number;
  private onCacheHit?: (tileUrl: string) => void;
  private onCacheMiss?: (tileUrl: string) => void;
  private onCacheError?: (tileUrl: string, error: Error) => void;
  private isOnline: boolean = navigator.onLine;

  constructor(url: string, options?: OfflineTileLayerOptions) {
    super(url, options);
    this.cacheEnabled = options?.cacheEnabled ?? true;
    this.cacheRadius = options?.cacheRadius ?? 5;
    this.onCacheHit = options?.onCacheHit;
    this.onCacheMiss = options?.onCacheMiss;
    this.onCacheError = options?.onCacheError;

    // Listen for online/offline events
    this.setupConnectivityListeners();
  }

  private setupConnectivityListeners(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true;
        console.log('🌐 Back online - enabling network requests');
      });

      window.addEventListener('offline', () => {
        this.isOnline = false;
        console.log('📱 Gone offline - using cache only');
      });
    }
  }

  // Override the createTile method to implement caching
  createTile(coords: L.Coords, done: (error?: Error, tile?: HTMLElement) => void): HTMLElement {
    const tile = document.createElement('img');
    
    // Set up tile attributes
    tile.width = 256;
    tile.height = 256;
    tile.style.width = '256px';
    tile.style.height = '256px';
    tile.style.display = 'block';
    tile.style.borderRadius = '0';
    tile.style.boxShadow = 'none';
    tile.style.border = 'none';
    tile.style.margin = '0';
    tile.style.padding = '0';
    tile.style.background = 'transparent';

    // Generate tile URL
    const tileUrl = this.getTileUrl(coords);

    // Handle tile loading
    const handleTileLoad = () => {
      done(undefined, tile);
    };

    const handleTileError = (error: Error) => {
      console.error('❌ Tile failed to load:', tileUrl, error);
      done(error, tile);
    };

    // Implement caching logic
    this.handleTileRequest(tile, tileUrl, coords, handleTileLoad, handleTileError);

    return tile;
  }

  private async handleTileRequest(
    tile: HTMLImageElement,
    tileUrl: string,
    coords: L.Coords,
    onLoad: () => void,
    onError: (error: Error) => void
  ): Promise<void> {
    try {
      // Check cache first if enabled
      if (this.cacheEnabled) {
        const cachedTile = await mapTileCache.getTile(coords.z, coords.x, coords.y);
        
        if (cachedTile) {
          // Cache hit - use cached tile
          const cachedUrl = URL.createObjectURL(cachedTile);
          tile.src = cachedUrl;
          tile.onload = onLoad;
          tile.onerror = () => {
            URL.revokeObjectURL(cachedUrl);
            onError(new Error('Cached tile failed to load'));
          };
          
          this.onCacheHit?.(tileUrl);
          console.log(`📦 Cache hit: ${coords.z}_${coords.x}_${coords.y}`);
          return;
        } else {
          this.onCacheMiss?.(tileUrl);
          console.log(`❌ Cache miss: ${coords.z}_${coords.x}_${coords.y}`);
        }
      }

      // Cache miss or cache disabled - fetch from network
      if (this.isOnline) {
        tile.src = tileUrl;
        tile.onload = onLoad;
        tile.onerror = () => {
          onError(new Error('Network tile failed to load'));
        };
      } else {
        // Offline mode - show placeholder or error
        console.log('📱 Offline - no cached tile available');
        tile.style.backgroundColor = '#f3f4f6';
        tile.style.border = '1px solid #d1d5db';
        
        // Create a simple placeholder image
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#f3f4f6';
          ctx.fillRect(0, 0, 256, 256);
          ctx.fillStyle = '#9ca3af';
          ctx.font = '12px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('Offline', 128, 128);
          ctx.fillText('No cached tile', 128, 144);
        }
        
        tile.src = canvas.toDataURL();
        onLoad();
      }
    } catch (error) {
      console.error('❌ Tile request failed:', error);
      this.onCacheError?.(tileUrl, error as Error);
      onError(error as Error);
    }
  }

  // Override the getTileUrl to support different tile providers
  getTileUrl(coords: L.Coords): string {
    const zoom = coords.z;
    const x = coords.x;
    const y = coords.y;
    
    // Use the original URL template but ensure it's HTTPS for better compatibility
    const url = super.getTileUrl(coords);
    return url.replace('http://', 'https://');
  }

  // Method to pre-cache tiles around a location
  async preCacheLocation(lat: number, lng: number, radiusMiles?: number): Promise<void> {
    if (!this.cacheEnabled) return;

    try {
      await mapTileCache.preCacheLocation(lat, lng, radiusMiles || this.cacheRadius);
      console.log(`🚀 Pre-caching completed for location: ${lat}, ${lng}`);
    } catch (error) {
      console.error('❌ Pre-caching failed:', error);
    }
  }

  // Method to get cache statistics
  async getCacheStats() {
    return await mapTileCache.getCacheStats();
  }

  // Method to clear cache
  async clearCache(): Promise<void> {
    await mapTileCache.clearCache();
  }
}

// React component wrapper for the custom tile layer
interface OfflineMapTileLayerProps {
  url: string;
  options?: OfflineTileLayerOptions;
  onCacheHit?: (tileUrl: string) => void;
  onCacheMiss?: (tileUrl: string) => void;
  onCacheError?: (tileUrl: string, error: Error) => void;
}

export function OfflineMapTileLayer({ 
  url, 
  options = {},
  onCacheHit,
  onCacheMiss,
  onCacheError
}: OfflineMapTileLayerProps) {
  const layerRef = useRef<OfflineTileLayer | null>(null);
  const [cacheStats, setCacheStats] = useState<{ totalTiles: number; totalSize: number; oldestTile: number; newestTile: number } | null>(null);

  useEffect(() => {
    // This component will be used within a map context
    // The actual layer creation will be handled by the parent map component
    console.log('🗺️ OfflineMapTileLayer initialized');
  }, []);

  // Method to create the tile layer instance
  const createLayer = (map: L.Map): OfflineTileLayer => {
    const layerOptions: OfflineTileLayerOptions = {
      ...options,
      cacheEnabled: options.cacheEnabled ?? true,
      cacheRadius: options.cacheRadius ?? 5,
      maxZoom: 22,
      minZoom: 3,
      detectRetina: true,
      updateWhenIdle: true,
      updateWhenZooming: true,
      keepBuffer: 2,
      errorTileUrl: '',
      noWrap: false,
      onCacheHit: onCacheHit,
      onCacheMiss: onCacheMiss,
      onCacheError: onCacheError,
    };

    const layer = new OfflineTileLayer(url, layerOptions);
    layerRef.current = layer;
    
    // Add to map
    layer.addTo(map);
    
    // Get initial cache stats
    layer.getCacheStats().then(stats => {
      setCacheStats(stats);
      console.log('📊 Initial cache stats:', stats);
    });

    return layer;
  };

  // Method to update cache settings
  const updateCacheSettings = (newOptions: Partial<OfflineTileLayerOptions>) => {
    if (layerRef.current) {
      // Update layer options
      Object.assign(layerRef.current.options, newOptions);
      console.log('⚙️ Cache settings updated:', newOptions);
    }
  };

  // Method to refresh cache stats
  const refreshCacheStats = async () => {
    if (layerRef.current) {
      const stats = await layerRef.current.getCacheStats();
      setCacheStats(stats);
      return stats;
    }
    return null;
  };

  return null; // This component doesn't render anything itself
}

// Export the layer class for direct use
export { OfflineTileLayer };
export type { OfflineTileLayerOptions };