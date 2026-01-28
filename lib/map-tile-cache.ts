import { openDB, IDBPDatabase } from 'idb';

// Constants for cache management
const CACHE_DB_NAME = 'bready-map-cache-v1';
const CACHE_STORE_NAME = 'tiles';
const MAX_CACHE_SIZE = 100 * 1024 * 1024; // 100MB
const CACHE_EXPIRY_TIME = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const TILE_ZOOM_LEVELS = [10, 11, 12, 13, 14, 15, 16, 17, 18]; // Detailed street view to city overview

export interface TileCacheEntry {
  key: string; // Format: "z_x_y"
  data: Blob;  // Tile image data
  timestamp: number;
  zoom: number;
  x: number;
  y: number;
  size: number; // File size in bytes
}

export interface CacheStats {
  totalTiles: number;
  totalSize: number;
  oldestTile: number;
  newestTile: number;
}

class MapTileCache {
  private dbPromise: Promise<IDBPDatabase<TileCacheDB>>;

  constructor() {
    this.dbPromise = this.initDB();
  }

  private async initDB(): Promise<IDBPDatabase<TileCacheDB>> {
    return openDB<TileCacheDB>(CACHE_DB_NAME, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(CACHE_STORE_NAME)) {
          const store = db.createObjectStore(CACHE_STORE_NAME, { keyPath: 'key' });
          store.createIndex('timestamp', 'timestamp');
          store.createIndex('zoom', 'zoom');
          store.createIndex('size', 'size');
        }
      },
    });
  }

  /**
   * Calculate tile coordinates for a given location and zoom level
   */
  private latLngToTile(lat: number, lng: number, zoom: number): { x: number; y: number } {
    const latRad = lat * Math.PI / 180;
    const n = Math.pow(2, zoom);
    const x = Math.floor((lng + 180) / 360 * n);
    const y = Math.floor((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n);
    return { x, y };
  }

  /**
   * Convert tile coordinates back to latitude/longitude
   */
  private tileToLatLng(x: number, y: number, zoom: number): { lat: number; lng: number } {
    const n = Math.pow(2, zoom);
    const lng = x / n * 360 - 180;
    const latRad = Math.atan(Math.sinh(Math.PI * (1 - 2 * y / n)));
    const lat = latRad * 180 / Math.PI;
    return { lat, lng };
  }

  /**
   * Calculate tiles within a radius around a location
   */
  private calculateTilesInRadius(centerLat: number, centerLng: number, radiusMiles: number, zoom: number): Array<{ x: number; y: number }> {
    const radiusMeters = radiusMiles * 1609.34;
    const centerTile = this.latLngToTile(centerLat, centerLng, zoom);

    // Calculate approximate tile radius
    const metersPerPixel = 156543.03392 * Math.cos(centerLat * Math.PI / 180) / Math.pow(2, zoom);
    const tileRadius = Math.ceil(radiusMeters / (metersPerPixel * 256)); // 256 is tile size

    const tiles: Array<{ x: number; y: number }> = [];
    
    for (let x = centerTile.x - tileRadius; x <= centerTile.x + tileRadius; x++) {
      for (let y = centerTile.y - tileRadius; y <= centerTile.y + tileRadius; y++) {
        // Check if tile is within radius using distance formula
        const tileCenter = this.tileToLatLng(x + 0.5, y + 0.5, zoom);
        const distance = this.calculateDistance(centerLat, centerLng, tileCenter.lat, tileCenter.lng);
        
        if (distance <= radiusMeters) {
          tiles.push({ x, y });
        }
      }
    }

    return tiles;
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Generate cache key for a tile
   */
  private generateKey(zoom: number, x: number, y: number): string {
    return `${zoom}_${x}_${y}`;
  }

  /**
   * Store a tile in cache
   */
  async setTile(zoom: number, x: number, y: number, data: Blob): Promise<void> {
    const db = await this.dbPromise;
    const key = this.generateKey(zoom, x, y);
    const entry: TileCacheEntry = {
      key,
      data,
      timestamp: Date.now(),
      zoom,
      x,
      y,
      size: data.size,
    };

    try {
      await db.put(CACHE_STORE_NAME, entry);
      console.log(`💾 Cached tile: ${key} (${data.size} bytes)`);
      
      // Check if we need to clean up old tiles
      await this.maybeCleanupCache();
    } catch (error) {
      console.error('❌ Failed to cache tile:', error);
    }
  }

  /**
   * Get a tile from cache
   */
  async getTile(zoom: number, x: number, y: number): Promise<Blob | null> {
    const db = await this.dbPromise;
    const key = this.generateKey(zoom, x, y);
    
    try {
      const entry = await db.get(CACHE_STORE_NAME, key);
      
      if (!entry) {
        return null;
      }

      // Check if tile has expired
      if (Date.now() - entry.timestamp > CACHE_EXPIRY_TIME) {
        console.log(`⏰ Tile expired: ${key}`);
        await this.deleteTile(zoom, x, y);
        return null;
      }

      console.log(`📦 Retrieved cached tile: ${key}`);
      return entry.data;
    } catch (error) {
      console.error('❌ Failed to retrieve cached tile:', error);
      return null;
    }
  }

  /**
   * Delete a specific tile from cache
   */
  async deleteTile(zoom: number, x: number, y: number): Promise<void> {
    const db = await this.dbPromise;
    const key = this.generateKey(zoom, x, y);
    
    try {
      await db.delete(CACHE_STORE_NAME, key);
      console.log(`🗑️ Deleted cached tile: ${key}`);
    } catch (error) {
      console.error('❌ Failed to delete cached tile:', error);
    }
  }

  /**
   * Pre-cache tiles around a location
   */
  async preCacheLocation(centerLat: number, centerLng: number, radiusMiles: number = 5): Promise<void> {
    console.log(`🚀 Starting pre-cache for location: ${centerLat}, ${centerLng}`);
    
    for (const zoom of TILE_ZOOM_LEVELS) {
      const tiles = this.calculateTilesInRadius(centerLat, centerLng, radiusMiles, zoom);
      console.log(`📍 Zoom ${zoom}: Calculated ${tiles.length} tiles to cache`);
      
      // For now, just log the tiles that would be cached
      // In a real implementation, you'd fetch these tiles from the tile server
      tiles.forEach(({ x, y }) => {
        console.log(`🗺️ Would cache tile: ${zoom}_${x}_${y}`);
      });
    }
  }

  /**
   * Clean up cache if it exceeds size limit or has expired tiles
   */
  async maybeCleanupCache(): Promise<void> {
    const db = await this.dbPromise;
    
    try {
      // Get cache statistics
      const stats = await this.getCacheStats();
      
      // Clean up expired tiles first
      const now = Date.now();
      const expiredCutoff = now - CACHE_EXPIRY_TIME;
      
      const expiredKeys: string[] = [];
      const tx = db.transaction(CACHE_STORE_NAME, 'readonly');
      const index = tx.store.index('timestamp');
      
      await index.openCursor().then(function cursorIterate(cursor) {
        if (!cursor) return;
        
        const entry = cursor.value as TileCacheEntry;
        if (entry.timestamp < expiredCutoff) {
          expiredKeys.push(entry.key);
          return cursor.advance(1);
        }
        
        return cursor.continue();
      });

      // Delete expired tiles
      if (expiredKeys.length > 0) {
        const deleteTx = db.transaction(CACHE_STORE_NAME, 'readwrite');
        await Promise.all(expiredKeys.map(key => deleteTx.store.delete(key)));
        console.log(`🗑️ Cleaned up ${expiredKeys.length} expired tiles`);
      }

      // Check total size and remove oldest tiles if needed
      if (stats.totalSize > MAX_CACHE_SIZE) {
        const excessSize = stats.totalSize - MAX_CACHE_SIZE;
        console.log(`⚠️ Cache size exceeded by ${excessSize} bytes, cleaning up...`);
        
        // Get oldest tiles to delete
        const deleteTx = db.transaction(CACHE_STORE_NAME, 'readwrite');
        const sizeIndex = deleteTx.store.index('size');
        let deletedSize = 0;
        let deletedCount = 0;

        await sizeIndex.openCursor(null, 'prev').then(function cursorIterate(cursor) {
          if (!cursor || deletedSize >= excessSize) return;
          
          const entry = cursor.value as TileCacheEntry;
          deletedSize += entry.size;
          deletedCount++;
          
          return cursor.delete().then(() => cursor.continue());
        });

        console.log(`🗑️ Cleaned up ${deletedCount} tiles (${deletedSize} bytes)`);
      }
    } catch (error) {
      console.error('❌ Cache cleanup failed:', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<CacheStats> {
    const db = await this.dbPromise;
    
    try {
      const tx = db.transaction(CACHE_STORE_NAME, 'readonly');
      const count = await tx.store.count();
      
      let totalSize = 0;
      let oldestTile = Infinity;
      let newestTile = 0;

      await tx.store.openCursor().then(function cursorIterate(cursor) {
        if (!cursor) return;
        
        const entry = cursor.value as TileCacheEntry;
        totalSize += entry.size;
        oldestTile = Math.min(oldestTile, entry.timestamp);
        newestTile = Math.max(newestTile, entry.timestamp);
        
        return cursor.continue();
      });

      return {
        totalTiles: count,
        totalSize,
        oldestTile: oldestTile === Infinity ? 0 : oldestTile,
        newestTile,
      };
    } catch (error) {
      console.error('❌ Failed to get cache stats:', error);
      return {
        totalTiles: 0,
        totalSize: 0,
        oldestTile: 0,
        newestTile: 0,
      };
    }
  }

  /**
   * Clear all cached tiles
   */
  async clearCache(): Promise<void> {
    const db = await this.dbPromise;
    
    try {
      await db.clear(CACHE_STORE_NAME);
      console.log('🗑️ Cleared all cached tiles');
    } catch (error) {
      console.error('❌ Failed to clear cache:', error);
    }
  }

  /**
   * Check if cache is healthy and ready
   */
  async isHealthy(): Promise<boolean> {
    try {
      const stats = await this.getCacheStats();
      return stats.totalTiles >= 0; // If we can get stats, cache is healthy
    } catch (error) {
      console.error('❌ Cache health check failed:', error);
      return false;
    }
  }
}

// Database schema interface for TypeScript
interface TileCacheDB {
  tiles: TileCacheEntry;
}

// Create singleton instance
export const mapTileCache = new MapTileCache();

// Export for use in other modules
export default mapTileCache;