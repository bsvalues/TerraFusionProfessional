/**
 * Coordinate Transformer Utility
 * 
 * This utility handles transformations between different coordinate systems
 * specifically supporting:
 * - WGS84 (EPSG:4326) - Standard for web mapping/GPS (latitude, longitude)
 * - Washington State Plane South Zone (ESRI:102749 / EPSG:2927)
 */

import proj4 from 'proj4';

// Define the coordinate reference systems
// WGS84 - World Geodetic System 1984 (latitude, longitude)
const WGS84 = 'EPSG:4326';

// Washington State Plane South (US Feet) - ESRI:102749 / EPSG:2927
// NAD83 / Washington South (ft)
const WASHINGTON_SOUTH_STATE_PLANE = 'EPSG:2927';

// Register the projections
proj4.defs(WGS84, '+proj=longlat +datum=WGS84 +no_defs');
proj4.defs(WASHINGTON_SOUTH_STATE_PLANE, 
  '+proj=lcc +lat_1=45.83333333333334 +lat_2=47.33333333333334 +lat_0=45.33333333333334 ' +
  '+lon_0=-120.5 +x_0=500000.0001016001 +y_0=0 +ellps=GRS80 +datum=NAD83 ' +
  '+to_meter=0.3048006096012192 +no_defs'
);

// Additional definition for NAD_1983_HARN_StatePlane_Washington_South_FIPS_4602_Feet
// This is the projection used in the Parcel.prj file
proj4.defs('ESRI:102749', 
  '+proj=lcc +lat_1=45.83333333333334 +lat_2=47.33333333333334 +lat_0=45.33333333333334 ' +
  '+lon_0=-120.5 +x_0=500000.0001016001 +y_0=0 +ellps=GRS80 +datum=NAD83 ' +
  '+to_meter=0.3048006096012192 +no_defs'
);

/**
 * Convert Washington State Plane coordinates to WGS84 (latitude, longitude)
 * @param easting X-coordinate in Washington State Plane (feet)
 * @param northing Y-coordinate in Washington State Plane (feet)
 * @returns [latitude, longitude] coordinates in WGS84
 */
export function statePlaneToLatLng(easting: number, northing: number): [number, number] {
  // Convert from State Plane to WGS84
  const [longitude, latitude] = proj4(WASHINGTON_SOUTH_STATE_PLANE, WGS84, [easting, northing]);
  return [latitude, longitude];
}

/**
 * Convert WGS84 coordinates (latitude, longitude) to Washington State Plane
 * @param latitude Latitude in WGS84
 * @param longitude Longitude in WGS84
 * @returns [easting, northing] coordinates in Washington State Plane (feet)
 */
export function latLngToStatePlane(latitude: number, longitude: number): [number, number] {
  // Convert from WGS84 to State Plane
  const [easting, northing] = proj4(WGS84, WASHINGTON_SOUTH_STATE_PLANE, [longitude, latitude]);
  return [easting, northing];
}

/**
 * Check if coordinates appear to be in Washington State Plane format
 * Useful for auto-detecting coordinate systems
 * @param x X-coordinate
 * @param y Y-coordinate
 * @returns Boolean indicating if coordinates are likely in State Plane format
 */
export function isLikelyStatePlaneCoordinates(x: number, y: number): boolean {
  // State Plane coordinates for Washington South are typically 6-7 digits
  // This is a heuristic check
  return (
    Math.abs(x) > 100000 && 
    Math.abs(x) < 10000000 && 
    Math.abs(y) > 100000 && 
    Math.abs(y) < 10000000
  );
}

/**
 * Standardize coordinates to WGS84 regardless of input format
 * @param x First coordinate (could be longitude or easting)
 * @param y Second coordinate (could be latitude or northing)
 * @returns [latitude, longitude] in WGS84 format
 */
export function standardizeCoordinates(x: number, y: number): [number, number] {
  // Detect if coordinates are already in WGS84 format
  if (Math.abs(x) <= 180 && Math.abs(y) <= 90) {
    // Assuming [longitude, latitude] format
    return [y, x];
  }
  
  // If coordinates appear to be in State Plane format, convert them
  if (isLikelyStatePlaneCoordinates(x, y)) {
    return statePlaneToLatLng(x, y);
  }
  
  // If we can't determine the format, assume they're already in the expected format
  // but warn about it
  console.warn('Could not determine coordinate system format, using as-is', x, y);
  return [y, x];
}

// Export the projection definitions for use with proj4leaflet
export const projectionDefs = {
  WGS84,
  WASHINGTON_SOUTH_STATE_PLANE
};

export default {
  statePlaneToLatLng,
  latLngToStatePlane,
  isLikelyStatePlaneCoordinates,
  standardizeCoordinates,
  projectionDefs
};