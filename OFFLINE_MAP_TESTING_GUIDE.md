# Offline Map Testing and Optimization Guide

This guide provides comprehensive testing procedures and optimization strategies for the offline map functionality in B-Ready.

## Testing Checklist

### 1. Basic Functionality Tests

#### Cache Manager Tests
- [ ] **Cache Statistics Display**: Verify cache manager shows correct tile count and size
- [ ] **Cache Health Status**: Test cache health indicator works correctly
- [ ] **Cache Pre-caching**: Test pre-caching current location functionality
- [ ] **Cache Clearing**: Verify cache clearing works and updates statistics
- [ ] **Cache Expiration**: Test automatic cache expiration after 24 hours

#### Map Tile Caching Tests
- [ ] **Tile Storage**: Verify tiles are stored in IndexedDB when viewed online
- [ ] **Tile Retrieval**: Test cached tiles load correctly when offline
- [ ] **Cache Miss Handling**: Verify fallback to error tiles when cache miss occurs
- [ ] **Tile Expiration**: Test tiles expire correctly after 24 hours
- [ ] **Storage Limits**: Test behavior when cache reaches 100MB limit

#### Location Management Tests
- [ ] **GPS Detection**: Test GPS location detection when available
- [ ] **Fallback Location**: Test fallback to last known location when GPS fails
- [ ] **Manual Location**: Test manual location setting functionality
- [ ] **Location Persistence**: Verify location is saved to localStorage
- [ ] **Location Updates**: Test automatic location updates when moving

### 2. Offline Scenarios Tests

#### Complete Offline Mode
- [ ] **Map Loading**: Test map loads with cached tiles when completely offline
- [ ] **Navigation**: Verify map navigation works with cached tiles only
- [ ] **Location Tracking**: Test location tracking with cached tiles
- [ ] **Search Functionality**: Test search works with cached tiles
- [ ] **Emergency Reports**: Verify emergency reports display correctly offline

#### Partial Offline Mode
- [ ] **Mixed Tiles**: Test behavior when some tiles are cached and others aren't
- [ ] **Network Recovery**: Test automatic tile loading when network is restored
- [ ] **Cache Updates**: Verify cache updates when new tiles are loaded online

#### Edge Cases
- [ ] **No Cache Available**: Test behavior when no tiles are cached
- [ ] **Corrupted Cache**: Test handling of corrupted or invalid cache entries
- [ ] **Storage Full**: Test behavior when IndexedDB storage is full
- [ ] **Multiple Tabs**: Test cache sharing between multiple browser tabs

### 3. Performance Tests

#### Loading Performance
- [ ] **Initial Load Time**: Measure map initial load time with and without cache
- [ ] **Tile Load Time**: Measure individual tile loading times
- [ ] **Cache Hit Rate**: Measure percentage of tiles served from cache
- [ ] **Memory Usage**: Monitor memory usage during map operations

#### Offline Performance
- [ ] **Offline Load Time**: Measure map load time when completely offline
- [ ] **Navigation Smoothness**: Test map panning and zooming performance offline
- [ ] **Battery Usage**: Monitor battery usage during extended offline use

### 4. Browser Compatibility Tests

#### Modern Browsers
- [ ] **Chrome**: Test on latest Chrome version
- [ ] **Firefox**: Test on latest Firefox version
- [ ] **Safari**: Test on latest Safari version
- [ ] **Edge**: Test on latest Edge version

#### Mobile Browsers
- [ ] **iOS Safari**: Test on iOS Safari
- [ ] **Android Chrome**: Test on Android Chrome
- [ ] **Mobile Performance**: Test performance on mobile devices

## Optimization Strategies

### 1. Cache Optimization

#### Tile Pre-caching Strategy
```typescript
// Optimize pre-caching radius based on zoom level
const getPreCacheRadius = (zoom: number) => {
  if (zoom >= 15) return 0.005; // ~500m radius
  if (zoom >= 12) return 0.02;  // ~2km radius
  if (zoom >= 9) return 0.05;   // ~5km radius
  return 0.1;                   // ~10km radius
};
```

#### Cache Size Management
```typescript
// Implement intelligent cache cleanup
const cleanupOldTiles = async () => {
  const stats = await getCacheStats();
  if (stats.totalSize > MAX_CACHE_SIZE * 0.8) {
    // Aggressive cleanup when approaching limit
    await cleanupCache(36); // Remove tiles older than 36 hours
  }
};
```

### 2. Performance Optimization

#### Map Rendering Optimization
```typescript
// Optimize Leaflet configuration for performance
const mapConfig = {
  preferCanvas: true,           // Use canvas for better performance
  fadeAnimation: false,         // Disable animations for faster loading
  zoomAnimation: false,
  markerZoomAnimation: false,
  updateWhenIdle: true,         // Only update when map is idle
  keepBuffer: 1,               // Minimal buffer for faster loading
};
```

#### Tile Loading Optimization
```typescript
// Implement tile loading priorities
const loadTileWithPriority = async (tileKey: string, priority: number) => {
  // Higher priority tiles load first
  // Center tiles have highest priority
  // Edge tiles have lower priority
};
```

### 3. Memory Management

#### Memory Cleanup
```typescript
// Implement memory cleanup for long sessions
const cleanupMemory = () => {
  // Clear unused tile references
  // Clear old location history
  // Clear unused event listeners
};
```

#### Storage Optimization
```typescript
// Optimize storage usage
const optimizeStorage = async () => {
  // Compress tile data if possible
  // Remove duplicate tiles
  // Optimize database indexes
};
```

## Debugging Tools

### 1. Cache Debug Console
```typescript
// Add debug commands to window object
if (process.env.NODE_ENV === 'development') {
  window.debugCache = {
    getStats: () => mapTileCache.getCacheStats(),
    clearCache: () => mapTileCache.clearCache(),
    preCacheLocation: (lat: number, lng: number) => 
      mapTileCache.preCacheLocation(lat, lng),
    getTile: (key: string) => mapTileCache.getTile(key),
    listTiles: () => mapTileCache.listTiles()
  };
}
```

### 2. Performance Monitoring
```typescript
// Add performance monitoring
const monitorPerformance = () => {
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.entryType === 'navigation') {
        console.log('Page load time:', entry.loadEventEnd - entry.loadEventStart);
      }
    }
  });
  observer.observe({ entryTypes: ['navigation'] });
};
```

### 3. Network Simulation
```typescript
// Add network simulation for testing
const simulateNetworkConditions = (type: 'offline' | 'slow' | 'fast') => {
  switch (type) {
    case 'offline':
      navigator.connection = { effectiveType: '4g', downlink: 0, rtt: 0 };
      break;
    case 'slow':
      navigator.connection = { effectiveType: '2g', downlink: 0.1, rtt: 2000 };
      break;
    case 'fast':
      navigator.connection = { effectiveType: '4g', downlink: 10, rtt: 50 };
      break;
  }
};
```

## Troubleshooting Guide

### Common Issues

#### Issue: Map tiles not loading offline
**Solution**: 
1. Check cache manager shows tiles are cached
2. Verify tiles are not expired (older than 24 hours)
3. Check IndexedDB storage is not full
4. Verify network is actually offline

#### Issue: Slow map performance
**Solution**:
1. Reduce cache size limit
2. Enable canvas rendering
3. Disable animations
4. Clear old cache entries

#### Issue: Location not detected
**Solution**:
1. Check browser permissions for location
2. Verify GPS is enabled on device
3. Test fallback location functionality
4. Check manual location setting

#### Issue: Cache not persisting
**Solution**:
1. Check browser storage permissions
2. Verify IndexedDB is supported
3. Check for storage quota limits
4. Test cache operations in console

### Debug Commands

Open browser console and use these commands:

```javascript
// Check cache statistics
await window.debugCache.getStats();

// Clear cache
await window.debugCache.clearCache();

// Pre-cache current location
await window.debugCache.preCacheLocation(14.5995, 120.9842);

// List all cached tiles
await window.debugCache.listTiles();

// Get specific tile
await window.debugCache.getTile('tile_15_12345_67890');
```

## Performance Benchmarks

### Target Performance Metrics

- **Initial Map Load**: < 3 seconds (with cache)
- **Tile Load Time**: < 200ms (cached), < 1 second (online)
- **Cache Hit Rate**: > 80% for frequently visited areas
- **Memory Usage**: < 50MB for typical usage
- **Storage Usage**: < 100MB maximum cache size

### Monitoring Tools

Use these browser tools for monitoring:

1. **Chrome DevTools Performance Tab**: Monitor loading performance
2. **Chrome DevTools Application Tab**: Monitor IndexedDB usage
3. **Chrome DevTools Network Tab**: Monitor tile requests
4. **Chrome DevTools Memory Tab**: Monitor memory usage

## Continuous Optimization

### Regular Maintenance

1. **Weekly**: Review cache hit rates and adjust pre-caching strategy
2. **Monthly**: Analyze performance metrics and optimize bottlenecks
3. **Quarterly**: Update browser compatibility testing
4. **As needed**: Address user feedback and reported issues

### Performance Monitoring

Implement continuous monitoring:

```typescript
// Add performance logging
const logPerformance = (metric: string, value: number) => {
  // Send to analytics service
  // Log to console in development
  console.log(`${metric}: ${value}ms`);
};
```

This comprehensive guide ensures the offline map functionality is thoroughly tested, optimized, and ready for production use.