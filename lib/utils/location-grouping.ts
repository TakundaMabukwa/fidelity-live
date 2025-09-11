import { CustomerLocation } from '@/lib/actions/customers-location';
import { Route } from '@/lib/types';

export interface LocationGroup {
  id: string;
  centerLat: number;
  centerLon: number;
  routes: Route[];
  color: string;
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
}

// Bright colors for easy identification
const GROUP_COLORS = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#96CEB4', // Green
  '#FFEAA7', // Yellow
  '#DDA0DD', // Plum
  '#98D8C8', // Mint
  '#F7DC6F', // Gold
  '#BB8FCE', // Light Purple
  '#85C1E9', // Light Blue
  '#F8C471', // Orange
  '#82E0AA', // Light Green
];

export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in kilometers
}

export function groupRoutesByLocation(
  routes: Route[],
  locations: CustomerLocation[],
  maxDistanceKm: number = 5 // Maximum distance to consider routes as "close"
): LocationGroup[] {
  if (routes.length === 0) return [];

  // Create a map of location codes to coordinates
  const locationMap = new Map<string, { lat: number; lon: number; location: CustomerLocation }>();
  
  locations.forEach(location => {
    if (location.code && location.lat && location.lon && 
        location.lat.length > 0 && location.lon.length > 0) {
      // Use the first coordinate if multiple are available
      const lat = parseFloat(location.lat[0]);
      const lon = parseFloat(location.lon[0]);
      
      if (!isNaN(lat) && !isNaN(lon)) {
        locationMap.set(location.code, { lat, lon, location });
      }
    }
  });

  // Filter routes that have location codes
  const routesWithLocations = routes.filter(route => 
    route.LocationCode && locationMap.has(route.LocationCode)
  );

  if (routesWithLocations.length === 0) {
    // If no routes have location data, create a single group
    return [{
      id: 'no-location',
      centerLat: 0,
      centerLon: 0,
      routes: routes,
      color: GROUP_COLORS[0],
      bounds: { north: 0, south: 0, east: 0, west: 0 }
    }];
  }

  const groups: LocationGroup[] = [];
  const processedRoutes = new Set<string>();

  routesWithLocations.forEach(route => {
    if (processedRoutes.has(route.Route)) return;

    const locationData = locationMap.get(route.LocationCode!);
    if (!locationData) return;

    const groupRoutes: Route[] = [route];
    processedRoutes.add(route.Route);

    // Find nearby routes
    routesWithLocations.forEach(otherRoute => {
      if (processedRoutes.has(otherRoute.Route) || otherRoute.Route === route.Route) return;

      const otherLocationData = locationMap.get(otherRoute.LocationCode!);
      if (!otherLocationData) return;

      const distance = calculateDistance(
        locationData.lat, locationData.lon,
        otherLocationData.lat, otherLocationData.lon
      );

      if (distance <= maxDistanceKm) {
        groupRoutes.push(otherRoute);
        processedRoutes.add(otherRoute.Route);
      }
    });

    // Calculate group center and bounds
    const lats = groupRoutes.map(r => {
      const loc = locationMap.get(r.LocationCode!);
      return loc ? loc.lat : 0;
    }).filter(lat => lat !== 0);

    const lons = groupRoutes.map(r => {
      const loc = locationMap.get(r.LocationCode!);
      return loc ? loc.lon : 0;
    }).filter(lon => lon !== 0);

    if (lats.length === 0 || lons.length === 0) return;

    const centerLat = lats.reduce((sum, lat) => sum + lat, 0) / lats.length;
    const centerLon = lons.reduce((sum, lon) => sum + lon, 0) / lons.length;

    const bounds = {
      north: Math.max(...lats),
      south: Math.min(...lats),
      east: Math.max(...lons),
      west: Math.min(...lons)
    };

    groups.push({
      id: `group-${groups.length}`,
      centerLat,
      centerLon,
      routes: groupRoutes,
      color: GROUP_COLORS[groups.length % GROUP_COLORS.length],
      bounds
    });
  });

  // Add any remaining routes without location data to a separate group
  const remainingRoutes = routes.filter(route => !processedRoutes.has(route.Route));
  if (remainingRoutes.length > 0) {
    groups.push({
      id: 'no-location',
      centerLat: 0,
      centerLon: 0,
      routes: remainingRoutes,
      color: GROUP_COLORS[groups.length % GROUP_COLORS.length],
      bounds: { north: 0, south: 0, east: 0, west: 0 }
    });
  }

  return groups;
}

export function sortRoutesByLocationCode(routes: Route[]): Route[] {
  return [...routes].sort((a, b) => {
    const codeA = a.LocationCode || '';
    const codeB = b.LocationCode || '';
    return codeA.localeCompare(codeB);
  });
}

export function getLocationBounds(groups: LocationGroup[]): {
  north: number;
  south: number;
  east: number;
  west: number;
} | null {
  if (groups.length === 0) return null;

  const validGroups = groups.filter(g => g.centerLat !== 0 && g.centerLon !== 0);
  if (validGroups.length === 0) return null;

  const lats = validGroups.map(g => g.centerLat);
  const lons = validGroups.map(g => g.centerLon);

  return {
    north: Math.max(...lats),
    south: Math.min(...lats),
    east: Math.max(...lons),
    west: Math.min(...lons)
  };
}
