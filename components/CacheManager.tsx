import { useEffect, useState, useCallback } from 'react';
import { mapTileCache } from '@/lib/map-tile-cache';
import { locationManager } from '@/lib/location-manager';

interface CacheStats {
  totalTiles: number;
  totalSize: number;
  oldestTile: number;
  newestTile: number;
}

interface CacheManagerProps {
  className?: string;
}

export function CacheManager({ className = '' }: CacheManagerProps) {
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [isCacheHealthy, setIsCacheHealthy] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isCaching, setIsCaching] = useState(false);

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format cache age
  const formatCacheAge = (timestamp: number): string => {
    if (!timestamp) return 'Unknown';
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  // Refresh cache statistics
  const refreshStats = useCallback(async () => {
    try {
      const newStats = await mapTileCache.getCacheStats();
      setStats(newStats);
      setLastUpdated(new Date());
      
      // Check if cache is healthy
      const isHealthy = await mapTileCache.isHealthy();
      setIsCacheHealthy(isHealthy);
    } catch (error) {
      console.error('❌ Failed to refresh cache stats:', error);
      setIsCacheHealthy(false);
    }
  }, []);

  // Clear cache
  const clearCache = useCallback(async () => {
    if (!window.confirm('Are you sure you want to clear all cached map tiles? This will require re-downloading tiles when online.')) {
      return;
    }

    try {
      setIsCaching(true);
      await mapTileCache.clearCache();
      await refreshStats();
      console.log('✅ Cache cleared successfully');
    } catch (error) {
      console.error('❌ Failed to clear cache:', error);
      alert('Failed to clear cache. Please try again.');
    } finally {
      setIsCaching(false);
    }
  }, [refreshStats]);

  // Pre-cache current location
  const preCacheLocation = useCallback(async () => {
    try {
      setIsCaching(true);
      const currentLocation = locationManager.getCurrentLocation();
      if (currentLocation) {
        await mapTileCache.preCacheLocation(currentLocation.lat, currentLocation.lng);
        await refreshStats();
        console.log('✅ Location pre-cached successfully');
      } else {
        alert('No current location available. Please ensure location services are enabled.');
      }
    } catch (error) {
      console.error('❌ Failed to pre-cache location:', error);
      alert('Failed to pre-cache location. Please try again.');
    } finally {
      setIsCaching(false);
    }
  }, [refreshStats]);

  // Auto-refresh stats every 30 seconds
  useEffect(() => {
    refreshStats();
    
    const interval = setInterval(refreshStats, 30000);
    return () => clearInterval(interval);
  }, [refreshStats]);

  // Get cache status indicator
  const getCacheStatus = () => {
    if (!isCacheHealthy) return { color: 'red', text: 'Cache Error', icon: '❌' };
    if (!stats || stats.totalTiles === 0) return { color: 'yellow', text: 'No Cache', icon: '⚠️' };
    
    const sizeMB = stats.totalSize / (1024 * 1024);
    if (sizeMB < 1) return { color: 'yellow', text: 'Low Cache', icon: '🟡' };
    if (sizeMB < 50) return { color: 'green', text: 'Good Cache', icon: '🟢' };
    return { color: 'blue', text: 'Full Cache', icon: '🔵' };
  };

  const status = getCacheStatus();

  return (
    <div className={`bg-white rounded-lg shadow-lg p-4 border border-gray-200 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          🗺️ Map Cache Manager
        </h3>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            status.color === 'red' ? 'bg-red-100 text-red-800' :
            status.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
            status.color === 'blue' ? 'bg-blue-100 text-blue-800' :
            'bg-green-100 text-green-800'
          }`}>
            {status.icon} {status.text}
          </span>
          {isCaching && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              Processing...
            </div>
          )}
        </div>
      </div>

      {stats ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-gray-600">Total Tiles</div>
              <div className="text-2xl font-bold text-blue-600">{stats.totalTiles.toLocaleString()}</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-gray-600">Total Size</div>
              <div className="text-2xl font-bold text-green-600">{formatFileSize(stats.totalSize)}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-gray-600">Oldest Tile</div>
              <div className="text-sm text-gray-800">{formatCacheAge(stats.oldestTile)}</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-gray-600">Newest Tile</div>
              <div className="text-sm text-gray-800">{formatCacheAge(stats.newestTile)}</div>
            </div>
          </div>

          {/* Cache Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Cache Usage</span>
              <span>{formatFileSize(stats.totalSize)} / 100 MB</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${Math.min((stats.totalSize / (100 * 1024 * 1024)) * 100, 100)}%` 
                }}
              ></div>
            </div>
          </div>

          {/* Last Updated */}
          <div className="text-xs text-gray-500 text-right">
            Last updated: {lastUpdated?.toLocaleTimeString() || 'Unknown'}
          </div>
        </div>
      ) : (
        <div className="text-center py-4 text-gray-500">
          Loading cache statistics...
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 flex flex-col sm:flex-row gap-2">
        <button
          onClick={refreshStats}
          disabled={isCaching}
          className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          🔄 Refresh Stats
        </button>
        <button
          onClick={preCacheLocation}
          disabled={isCaching}
          className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          🚀 Pre-cache Location
        </button>
        <button
          onClick={clearCache}
          disabled={isCaching}
          className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          🗑️ Clear Cache
        </button>
      </div>

      {/* Cache Tips */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="text-sm font-medium text-blue-900 mb-2">💡 Cache Tips</h4>
        <ul className="text-xs text-blue-800 space-y-1">
          <li>• Cache automatically expires after 24 hours</li>
          <li>• Maximum cache size is 100 MB</li>
          <li>• Tiles are cached around your current location</li>
          <li>• Use "Pre-cache Location" to cache tiles proactively</li>
          <li>• Cache helps with offline map viewing</li>
        </ul>
      </div>
    </div>
  );
}

// Simple cache status indicator component
export function CacheStatusIndicator() {
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const updateStats = async () => {
      try {
        const newStats = await mapTileCache.getCacheStats();
        setStats(newStats);
      } catch (error) {
        console.error('Failed to get cache stats:', error);
      }
    };

    updateStats();
    const interval = setInterval(updateStats, 60000); // Update every minute

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const getIndicatorColor = () => {
    if (!isOnline) return 'bg-red-500'; // Offline
    if (!stats || stats.totalTiles === 0) return 'bg-yellow-500'; // No cache
    const sizeMB = stats.totalSize / (1024 * 1024);
    if (sizeMB < 1) return 'bg-yellow-500'; // Low cache
    return 'bg-green-500'; // Good cache
  };

  const getIndicatorText = () => {
    if (!isOnline) return 'Offline';
    if (!stats || stats.totalTiles === 0) return 'No Cache';
    const sizeMB = stats.totalSize / (1024 * 1024);
    if (sizeMB < 1) return 'Low Cache';
    return 'Ready';
  };

  return (
    <div className="fixed top-4 right-4 flex items-center gap-2 bg-white rounded-full px-3 py-2 shadow-lg border border-gray-200">
      <div className={`w-3 h-3 rounded-full ${getIndicatorColor()} animate-pulse`}></div>
      <span className="text-sm font-medium text-gray-700">{getIndicatorText()}</span>
      {stats && (
        <span className="text-xs text-gray-500">({stats.totalTiles} tiles)</span>
      )}
    </div>
  );
}

export default CacheManager;