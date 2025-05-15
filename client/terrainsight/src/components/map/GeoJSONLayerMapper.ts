/**
 * GeoJSON Layer Mapper
 * 
 * This utility maps between the client-side GeoJSON layer identifiers
 * and the server-side API endpoints. It helps resolve the URL format
 * differences between what the map components expect and what the server provides.
 */

// Map from client-side layer IDs to server API dataset names
export const geoJSONLayerMapping: Record<string, string> = {
  // Map each benton-county-* layer to the appropriate endpoint
  'benton-county-boundary': 'county-boundary',
  'benton-county-parcels': 'parcels',
  'benton-county-neighborhoods': 'neighborhood-areas',
  'benton-county-zoning': 'zoning',
  'benton-county-school-districts': 'school-district',
  'benton-county-flood-zones': 'flood-zones',
  
  // Also include the direct mappings for existing layer IDs
  'countyBoundary': 'county-boundary',
  'parcels': 'parcels',
  'parcelsAndAssess': 'parcels-and-assess',
  'schools': 'school-district',
  'neighborhoods': 'neighborhood-areas',
  'zoning': 'zoning',
  'floodZones': 'flood-zones'
};

/**
 * Converts a client-side GeoJSON URL to the appropriate server API endpoint
 * 
 * @param url Original URL (either direct ArcGIS URL or local /api/geojson/ path)
 * @returns Mapped server API URL
 */
export function mapGeoJSONUrl(url: string): string {
  // If it's a direct ArcGIS URL, return it as is (those work directly)
  if (url.includes('arcgis.com')) {
    return url;
  }
  
  // If it's a /api/geojson/ URL, map it to the correct /api/gis/datasets/ URL
  if (url.includes('/api/geojson/')) {
    // Extract the layer ID from the URL
    const layerId = url.split('/api/geojson/')[1].replace(/\?.*$/, '').trim();
    
    // Get the mapped dataset name for this layer ID
    const datasetName = geoJSONLayerMapping[layerId] || layerId;
    
    // Return the properly formatted server API URL
    return `/api/gis/datasets/${datasetName}/geojson`;
  }
  
  // Return the original URL if no mapping needed
  return url;
}