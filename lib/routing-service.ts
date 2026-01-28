import * as L from 'leaflet';

export interface RouteResult {
  coordinates: L.LatLng[];
  distance: number; // in meters
  duration: number; // in seconds
  summary: string;
}

export interface RouteStep {
  type: string;
  instruction: string;
  distance: number;
  duration: number;
  location: L.LatLng;
}

class RoutingService {
  private osrmEndpoint = 'https://router.project-osrm.org/route/v1/driving/';
  private graphhopperEndpoint = 'https://graphhopper.com/api/1/route';
  private graphhopperApiKey = process.env.NEXT_PUBLIC_GRAPHHOPPER_API_KEY || '';
  
  // Fallback to straight line if routing services fail
  private calculateStraightLine(start: L.LatLng, end: L.LatLng): RouteResult {
    const distance = start.distanceTo(end);
    const duration = distance / 15; // Assume 15 m/s (54 km/h) average speed
    
    return {
      coordinates: [start, end],
      distance,
      duration,
      summary: 'Direct route (no road data available)'
    };
  }

  // Calculate route using OSRM (free, no API key required)
  private async calculateOSRMRoute(start: L.LatLng, end: L.LatLng): Promise<RouteResult | null> {
    try {
      const url = `${this.osrmEndpoint}${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson&steps=true`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`OSRM API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
        throw new Error('No route found');
      }

      const route = data.routes[0];
      const coordinates = route.geometry.coordinates.map((coord: [number, number]) => 
        L.latLng(coord[1], coord[0])
      );

      return {
        coordinates,
        distance: route.distance,
        duration: route.duration,
        summary: route.summary || 'Route calculated using OSRM'
      };
    } catch (error) {
      console.warn('OSRM routing failed:', error);
      return null;
    }
  }

  // Calculate route using GraphHopper (alternative with better accuracy)
  private async calculateGraphHopperRoute(start: L.LatLng, end: L.LatLng): Promise<RouteResult | null> {
    if (!this.graphhopperApiKey) {
      return null;
    }

    try {
      const url = `${this.graphhopperEndpoint}?point=${start.lat},${start.lng}&point=${end.lat},${end.lng}&vehicle=car&locale=en&key=${this.graphhopperApiKey}&points_encoded=false`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`GraphHopper API error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.paths || data.paths.length === 0) {
        throw new Error('No route found');
      }

      const path = data.paths[0];
      const coordinates = path.points.coordinates.map((coord: [number, number]) => 
        L.latLng(coord[1], coord[0])
      );

      return {
        coordinates,
        distance: path.distance,
        duration: path.time / 1000, // Convert milliseconds to seconds
        summary: path.description || 'Route calculated using GraphHopper'
      };
    } catch (error) {
      console.warn('GraphHopper routing failed:', error);
      return null;
    }
  }

  // Main route calculation function with fallbacks
  async calculateRoute(start: L.LatLng, end: L.LatLng): Promise<RouteResult> {
    // Try OSRM first (free and reliable)
    let route = await this.calculateOSRMRoute(start, end);
    if (route) {
      return route;
    }

    // Try GraphHopper as fallback (if API key is available)
    route = await this.calculateGraphHopperRoute(start, end);
    if (route) {
      return route;
    }

    // Final fallback: straight line
    console.warn('All routing services failed, using straight line route');
    return this.calculateStraightLine(start, end);
  }

  // Calculate ETA based on current speed and distance
  calculateETA(distance: number, currentSpeed: number = 15): number {
    // Default speed: 15 m/s (54 km/h)
    return distance / currentSpeed;
  }

  // Get route progress (percentage along the route)
  getRouteProgress(currentLocation: L.LatLng, routeCoordinates: L.LatLng[]): number {
    if (routeCoordinates.length < 2) return 0;

    let totalDistance = 0;
    let distanceToCurrent = 0;
    let foundSegment = false;

    for (let i = 0; i < routeCoordinates.length - 1; i++) {
      const segmentStart = routeCoordinates[i];
      const segmentEnd = routeCoordinates[i + 1];
      const segmentDistance = segmentStart.distanceTo(segmentEnd);
      totalDistance += segmentDistance;

      if (!foundSegment) {
        const distanceToSegmentStart = currentLocation.distanceTo(segmentStart);
        const distanceToSegmentEnd = currentLocation.distanceTo(segmentEnd);
        
        // If we're closer to the end of this segment, we've passed it
        if (distanceToSegmentEnd < distanceToSegmentStart) {
          distanceToCurrent += segmentDistance;
        } else {
          // We're on this segment, calculate partial distance
          distanceToCurrent += distanceToSegmentStart;
          foundSegment = true;
        }
      }
    }

    return Math.min((distanceToCurrent / totalDistance) * 100, 100);
  }

  // Check if admin is deviating from route (more than 100m off)
  isRouteDeviation(currentLocation: L.LatLng, routeCoordinates: L.LatLng[], maxDeviation: number = 100): boolean {
    if (routeCoordinates.length < 2) return false;

    // Find closest point on route to current location
    let minDistance = Infinity;

    for (let i = 0; i < routeCoordinates.length - 1; i++) {
      const segmentStart = routeCoordinates[i];
      const segmentEnd = routeCoordinates[i + 1];
      
      // Calculate distance from point to line segment
      const distance = this.pointToSegmentDistance(currentLocation, segmentStart, segmentEnd);
      minDistance = Math.min(minDistance, distance);
    }

    return minDistance > maxDeviation;
  }

  // Helper: distance from point to line segment
  private pointToSegmentDistance(point: L.LatLng, segmentStart: L.LatLng, segmentEnd: L.LatLng): number {
    const A = point.lat - segmentStart.lat;
    const B = point.lng - segmentStart.lng;
    const C = segmentEnd.lat - segmentStart.lat;
    const D = segmentEnd.lng - segmentStart.lng;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;

    if (lenSq !== 0) {
      param = dot / lenSq;
    }

    let xx, yy;

    if (param < 0) {
      xx = segmentStart.lat;
      yy = segmentStart.lng;
    } else if (param > 1) {
      xx = segmentEnd.lat;
      yy = segmentEnd.lng;
    } else {
      xx = segmentStart.lat + param * C;
      yy = segmentStart.lng + param * D;
    }

    const dx = point.lat - xx;
    const dy = point.lng - yy;
    return Math.sqrt(dx * dx + dy * dy) * 111000; // Convert degrees to meters (approximate)
  }

  // Format duration in human-readable format
  formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      return `${remainingSeconds}s`;
    }
  }

  // Format distance in human-readable format
  formatDistance(meters: number): string {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)} km`;
    } else {
      return `${Math.round(meters)} m`;
    }
  }
}

// Export singleton instance
export const routingService = new RoutingService();

// Export for direct use
export default routingService;