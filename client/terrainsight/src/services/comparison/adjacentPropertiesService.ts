import { Property } from '@shared/schema';
import { haversineDistance } from '../../lib/utils';

export interface AdjacentPropertyResult {
  property: Property;
  distanceKm: number;
  direction?: string; // Optional: 'north', 'south-east', etc.
}

/**
 * Find properties adjacent to the given reference property
 * 
 * @param referenceProperty The reference property to find adjacent properties for
 * @param allProperties All available properties
 * @param options Configuration options
 * @returns Array of adjacent properties with distance information
 */
export function findAdjacentProperties(
  referenceProperty: Property,
  allProperties: Property[],
  options: {
    maxDistanceKm?: number;
    maxResults?: number;
    excludeSameOwner?: boolean;
  } = {}
): AdjacentPropertyResult[] {
  // Default options
  const {
    maxDistanceKm = 0.5, // Default 500 meters
    maxResults = 5,
    excludeSameOwner = true
  } = options;

  // Ensure reference property has coordinates
  if (!referenceProperty.latitude || !referenceProperty.longitude) {
    return [];
  }

  // Filter for properties with coordinates, excluding the reference property
  const validProperties = allProperties.filter(
    p => p.id !== referenceProperty.id && 
    p.latitude && 
    p.longitude &&
    // Optionally exclude properties with the same owner
    (!excludeSameOwner || p.owner !== referenceProperty.owner)
  );

  // Calculate distance and direction for each property
  const adjacentProperties: AdjacentPropertyResult[] = validProperties.map(property => {
    const distance = haversineDistance(
      [Number(referenceProperty.latitude!), Number(referenceProperty.longitude!)],
      [Number(property.latitude!), Number(property.longitude!)]
    );

    // Calculate direction (optional)
    const direction = calculateDirection(
      [Number(referenceProperty.latitude!), Number(referenceProperty.longitude!)],
      [Number(property.latitude!), Number(property.longitude!)]
    );

    return {
      property,
      distanceKm: distance,
      direction
    };
  });

  // Filter by maximum distance
  const withinDistance = adjacentProperties.filter(
    result => result.distanceKm <= maxDistanceKm
  );

  // Sort by distance (closest first)
  withinDistance.sort((a, b) => a.distanceKm - b.distanceKm);

  // Return limited results
  return withinDistance.slice(0, maxResults);
}

/**
 * Calculate the cardinal direction from one point to another
 * 
 * @param from Starting coordinates [lat, lng]
 * @param to Ending coordinates [lat, lng]
 * @returns Cardinal direction as a string (N, NE, E, SE, S, SW, W, NW)
 */
function calculateDirection(from: [number, number], to: [number, number]): string {
  const latDiff = to[0] - from[0];
  const lngDiff = to[1] - from[1];
  
  // Calculate angle in degrees
  const angle = Math.atan2(lngDiff, latDiff) * (180 / Math.PI);
  
  // Convert angle to 0-360 degrees
  const normalizedAngle = (angle + 360) % 360;
  
  // Map angle to cardinal direction
  if (normalizedAngle >= 337.5 || normalizedAngle < 22.5) {
    return 'N';
  } else if (normalizedAngle >= 22.5 && normalizedAngle < 67.5) {
    return 'NE';
  } else if (normalizedAngle >= 67.5 && normalizedAngle < 112.5) {
    return 'E';
  } else if (normalizedAngle >= 112.5 && normalizedAngle < 157.5) {
    return 'SE';
  } else if (normalizedAngle >= 157.5 && normalizedAngle < 202.5) {
    return 'S';
  } else if (normalizedAngle >= 202.5 && normalizedAngle < 247.5) {
    return 'SW';
  } else if (normalizedAngle >= 247.5 && normalizedAngle < 292.5) {
    return 'W';
  } else {
    return 'NW';
  }
}

/**
 * Format distance in a human-friendly way
 * 
 * @param distanceKm Distance in kilometers
 * @returns Formatted distance string
 */
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 0.1) {
    // Less than 100 meters, show in meters
    return `${Math.round(distanceKm * 1000)}m`;
  } else if (distanceKm < 1) {
    // Less than 1 km, show in meters with 1 decimal place
    return `${Math.round(distanceKm * 1000)}m`;
  } else {
    // 1 km or more, show in km with 1 decimal place
    return `${distanceKm.toFixed(1)}km`;
  }
}