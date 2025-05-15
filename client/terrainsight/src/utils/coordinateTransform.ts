/**
 * Coordinate transformation utilities
 * 
 * This file provides utilities for transforming coordinates between different
 * coordinate reference systems, specifically for handling Benton County GIS data.
 */

import proj4 from 'proj4';

// Define the WA State Plane South projection parameters (EPSG:2927)
// Updated with more precise parameters for Benton County
const WA_STATE_PLANE_SOUTH_DEF = '+proj=lcc +lat_1=47.33333333333334 +lat_2=45.83333333333334 +lat_0=45.33333333333334 +lon_0=-120.5 +x_0=500000.0001016001 +y_0=0 +ellps=GRS80 +datum=NAD83 +to_meter=0.3048006096012192 +units=us-ft +no_defs';

// Define the projection
proj4.defs('EPSG:2927', WA_STATE_PLANE_SOUTH_DEF);

/**
 * Transform coordinates from WA State Plane South (EPSG:2927) to WGS84 (EPSG:4326)
 * which is the standard lat/lng format used by Leaflet and most web mapping applications.
 * 
 * @param x X coordinate (easting) in WA State Plane South
 * @param y Y coordinate (northing) in WA State Plane South
 * @returns [longitude, latitude] array in WGS84
 */
export function transformToWGS84(x: number, y: number): [number, number] {
  // Check if coordinates might already be in WGS84
  // WGS84 coordinates generally fall in these ranges:
  // Longitude: -180 to 180
  // Latitude: -90 to 90
  // Washington state is roughly in the range of:
  // Longitude: -124 to -117
  // Latitude: 45 to 49
  if (x > -180 && x < 180 && y > -90 && y < 90) {
    // Coordinates are likely already in WGS84, just return them
    console.warn('Coordinates appear to already be in WGS84, skipping transformation');
    return [x, y];
  }
  
  // For Benton County specifically (based on service metadata):
  // x range is roughly 1.79 million to 2.03 million feet
  // y range is roughly 186k to 473k feet
  if (x >= 1700000 && x <= 2100000 && y >= 180000 && y <= 500000) {
    // These are definitely WA State Plane South coordinates, transform them
    // Use proj4 to transform the coordinates
    try {
      const [lon, lat] = proj4('EPSG:2927', 'EPSG:4326', [x, y]);
      
      // Sanity check on output: if result is outside Washington state, log a warning but return the coordinates anyway
      if (lon < -125 || lon > -116 || lat < 44 || lat > 50) {
        console.warn('Transformed coordinates appear to be outside Washington state bounds:', [lon, lat]);
        // Return the coordinates anyway, even if they're unusual
        // This prevents all problematic coordinates from being displayed at the same default location
        return [lon, lat];
      }
      
      return [lon, lat];
    } catch (error) {
      console.error('Error transforming coordinates:', error);
      // Return the original coordinates if we can't transform them
      // This prevents all problematic coordinates from being displayed at the same default location
      return [x, y];
    }
  }
  
  // Default transformation for other coordinates
  try {
    const [lon, lat] = proj4('EPSG:2927', 'EPSG:4326', [x, y]);
    return [lon, lat];
  } catch (error) {
    console.error('Error in coordinate transformation:', error);
    return [x, y]; // Return original if transform fails
  }
}

/**
 * Transform coordinates from WGS84 (EPSG:4326) to WA State Plane South (EPSG:2927)
 * This is useful when sending coordinates back to the ArcGIS server.
 * 
 * @param lon Longitude in WGS84
 * @param lat Latitude in WGS84
 * @returns [x, y] array in WA State Plane South
 */
export function transformFromWGS84(lon: number, lat: number): [number, number] {
  // Use proj4 to transform the coordinates
  const [x, y] = proj4('EPSG:4326', 'EPSG:2927', [lon, lat]);
  return [x, y];
}

/**
 * Transform a GeoJSON geometry from WA State Plane South to WGS84
 * This function handles points, linestrings, and polygons.
 * 
 * @param geometry GeoJSON geometry in WA State Plane South
 * @returns Same geometry transformed to WGS84
 */
export function transformGeoJSONGeometry(geometry: any): any {
  if (!geometry || !geometry.type) return geometry;
  
  // Clone the geometry to avoid modifying the original
  const result = { ...geometry };
  
  switch (geometry.type) {
    case 'Point':
      if (Array.isArray(geometry.coordinates) && geometry.coordinates.length >= 2) {
        const [x, y] = geometry.coordinates;
        result.coordinates = transformToWGS84(x, y);
      }
      break;
      
    case 'LineString':
    case 'MultiPoint':
      if (Array.isArray(geometry.coordinates)) {
        result.coordinates = geometry.coordinates.map((coord: number[]) => {
          if (Array.isArray(coord) && coord.length >= 2) {
            return transformToWGS84(coord[0], coord[1]);
          }
          return coord;
        });
      }
      break;
      
    case 'Polygon':
    case 'MultiLineString':
      if (Array.isArray(geometry.coordinates)) {
        result.coordinates = geometry.coordinates.map((ring: number[][]) => {
          return ring.map((coord: number[]) => {
            if (Array.isArray(coord) && coord.length >= 2) {
              return transformToWGS84(coord[0], coord[1]);
            }
            return coord;
          });
        });
      }
      break;
      
    case 'MultiPolygon':
      if (Array.isArray(geometry.coordinates)) {
        result.coordinates = geometry.coordinates.map((polygon: number[][][]) => {
          return polygon.map((ring: number[][]) => {
            return ring.map((coord: number[]) => {
              if (Array.isArray(coord) && coord.length >= 2) {
                return transformToWGS84(coord[0], coord[1]);
              }
              return coord;
            });
          });
        });
      }
      break;
  }
  
  return result;
}

/**
 * Transform a complete GeoJSON object from WA State Plane South to WGS84
 * This handles FeatureCollection, Feature, and geometry objects.
 * 
 * @param geojson GeoJSON object in WA State Plane South
 * @param debug Whether to log debugging information
 * @returns Same GeoJSON object transformed to WGS84
 */
export function transformGeoJSON(geojson: any, debug: boolean = false): any {
  if (!geojson || typeof geojson !== 'object') return geojson;
  
  // Debug start (show a sample coordinate before transformation)
  if (debug) {
    try {
      // Try to find a sample coordinate in the data
      let sampleCoord: number[] | null = null;
      if (geojson.type === 'FeatureCollection' && geojson.features?.length > 0) {
        const feature = geojson.features[0];
        if (feature.geometry?.type === 'Point') {
          sampleCoord = feature.geometry.coordinates;
        } else if (feature.geometry?.type === 'Polygon' && 
                  Array.isArray(feature.geometry.coordinates) && 
                  feature.geometry.coordinates.length > 0 &&
                  Array.isArray(feature.geometry.coordinates[0]) &&
                  feature.geometry.coordinates[0].length > 0) {
          sampleCoord = feature.geometry.coordinates[0][0];
        }
      }
      
      if (sampleCoord) {
        console.log('Original coordinate sample:', sampleCoord);
        const transformed = transformToWGS84(sampleCoord[0], sampleCoord[1]);
        console.log('Transformed to WGS84:', transformed);
      }
    } catch (e) {
      console.warn('Error during coordinate debug logging:', e);
    }
  }
  
  // Clone the object to avoid modifying the original
  const result = { ...geojson };
  
  // If we have spatialReference info, use it to determine if transformation is needed
  if (result.spatialReference) {
    // Store spatialReference for debugging
    const originalSR = { ...result.spatialReference };
    
    // Update the spatialReference to WGS84 after transformation
    result.spatialReference = {
      wkid: 4326,
      latestWkid: 4326
    };
    
    if (debug) {
      console.log('Transformed spatialReference from', originalSR, 'to', result.spatialReference);
    }
  }
  
  // Add CRS info if not already present (this helps GIS software understand the coordinate system)
  if (!result.crs) {
    result.crs = {
      type: 'name',
      properties: {
        name: 'EPSG:4326'
      }
    };
  }
  
  switch (geojson.type) {
    case 'FeatureCollection':
      if (Array.isArray(geojson.features)) {
        result.features = geojson.features.map((feature: any) => 
          transformGeoJSON(feature, false) // Don't debug each feature to avoid log spam
        );
      }
      break;
      
    case 'Feature':
      if (geojson.geometry) {
        result.geometry = transformGeoJSONGeometry(geojson.geometry);
      }
      break;
      
    // Handle direct geometry objects
    case 'Point':
    case 'LineString':
    case 'Polygon':
    case 'MultiPoint':
    case 'MultiLineString':
    case 'MultiPolygon':
      return transformGeoJSONGeometry(geojson);
  }
  
  return result;
}

// Export the defined CRS for use with Leaflet
export const CRS = {
  WA_STATE_PLANE_SOUTH: 'EPSG:2927',
  WGS84: 'EPSG:4326'
};