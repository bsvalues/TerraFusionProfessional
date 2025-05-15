/**
 * GIS Layer Source Interface
 * Defines the structure for map layers in the application
 */
export interface GisLayerSource {
  id: string;
  name: string;
  type: 'tile' | 'wms' | 'geojson';
  url: string;
  attribution: string;
  opacity: number;
  description?: string;        // Description of what the layer shows
  dataSource?: string;         // Original source of the data
  category?: string;           // Category for grouping in UI
  lastUpdated?: string;        // When the data was last updated
  options?: Record<string, any>;
}

/**
 * Base map sources for different backgrounds
 * These provide the underlying map imagery
 */
export const basemapSources: Record<string, GisLayerSource> = {
  osm: {
    id: 'osm',
    name: 'OpenStreetMap',
    type: 'tile',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    opacity: 1,
    description: 'Standard OpenStreetMap base map with streets, buildings, and points of interest',
    dataSource: 'OpenStreetMap Contributors',
    category: 'Base Maps',
    lastUpdated: 'Continuously updated',
  },
  satellite: {
    id: 'satellite',
    name: 'Satellite Imagery',
    type: 'tile',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; <a href="https://www.arcgis.com/">ArcGIS</a>',
    opacity: 1,
    description: 'High-resolution satellite and aerial imagery',
    dataSource: 'Esri, Maxar, GeoEye, Earthstar Geographics',
    category: 'Base Maps',
    lastUpdated: 'Updated annually',
  },
  topo: {
    id: 'topo',
    name: 'Topographic',
    type: 'tile',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; <a href="https://www.arcgis.com/">ArcGIS</a>',
    opacity: 1,
    description: 'Detailed topographic map with terrain features, contour lines, and landmarks',
    dataSource: 'Esri, USGS, NOAA',
    category: 'Base Maps',
    lastUpdated: '2023',
  },
  light: {
    id: 'light',
    name: 'Light Map',
    type: 'tile',
    url: 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
    opacity: 1,
    description: 'Minimal, light-colored map ideal for data visualization overlays',
    dataSource: 'CartoDB, OpenStreetMap',
    category: 'Base Maps',
    lastUpdated: 'Continuously updated',
  }
};

/**
 * Optional satellite labels layer
 * Can be overlaid on satellite imagery to add place names
 */
export const satelliteLabelsLayer: GisLayerSource = {
  id: 'satellite-labels',
  name: 'Labels for Satellite',
  type: 'tile',
  url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
  attribution: '&copy; <a href="https://www.arcgis.com/">ArcGIS</a>',
  opacity: 0.8,
  description: 'Text labels for roads, cities, and landmarks to overlay on satellite imagery',
  dataSource: 'Esri',
  category: 'Base Maps',
  lastUpdated: '2023',
};

/**
 * Overlay GIS layers (data visualization layers)
 * These layers contain specific GIS data that can be toggled on/off
 */
export const overlayLayerSources: GisLayerSource[] = [
  // Property Data Category
  {
    id: 'parcels',
    name: 'Property Parcels',
    type: 'geojson',
    url: '/api/gis/datasets/parcels/geojson',
    attribution: '&copy; Benton County GIS',
    opacity: 0.7,
    description: 'Property parcel boundaries showing lot lines, dimensions, and ownership information',
    dataSource: 'Benton County Assessor\'s Office',
    category: 'Property Data',
    lastUpdated: 'March 2024',
    options: {
      style: {
        color: '#4287f5',
        weight: 1,
        fillOpacity: 0.2
      }
    }
  },
  {
    id: 'parcelsAndAssess',
    name: 'Parcels with Assessment Data',
    type: 'geojson',
    url: '/api/gis/datasets/parcels-and-assess/geojson',
    attribution: '&copy; Benton County GIS',
    opacity: 0.7,
    description: 'Property parcels with detailed assessment information',
    dataSource: 'Benton County Assessor\'s Office',
    category: 'Property Data',
    lastUpdated: 'March 2024',
    options: {
      style: {
        color: '#42f5a1',
        weight: 1,
        fillOpacity: 0.2
      }
    }
  },
  
  // Administrative Category
  {
    id: 'countyBoundary',
    name: 'County Boundary',
    type: 'geojson',
    url: '/api/gis/datasets/county-boundary/geojson',
    attribution: '&copy; Benton County GIS',
    opacity: 0.5,
    description: 'Official county boundary lines',
    dataSource: 'Benton County GIS',
    category: 'Administrative',
    lastUpdated: 'January 2024',
    options: {
      style: {
        color: '#ff5722',
        weight: 2,
        fillOpacity: 0.1
      }
    }
  },
  {
    id: 'schools',
    name: 'School Districts',
    type: 'geojson',
    url: '/api/gis/datasets/school-district/geojson',
    attribution: '&copy; Benton County GIS',
    opacity: 0.5,
    description: 'School district boundaries and associated school locations',
    dataSource: 'Benton County, WA Office of Superintendent of Public Instruction',
    category: 'Administrative',
    lastUpdated: 'August 2023',
    options: {
      style: {
        color: '#9c27b0',
        weight: 1,
        fillOpacity: 0.2
      }
    }
  },
  
  // Neighborhood Data
  {
    id: 'neighborhoods',
    name: 'Neighborhood Areas',
    type: 'geojson',
    url: '/api/gis/datasets/neighborhood-areas/geojson',
    attribution: '&copy; Benton County GIS',
    opacity: 0.6,
    description: 'Neighborhood boundaries and community areas',
    dataSource: 'Benton County Planning Department',
    category: 'Administrative',
    lastUpdated: 'January 2024',
    options: {
      style: {
        color: '#2196f3',
        weight: 1.5,
        fillOpacity: 0.15,
        dashArray: '3,5'
      }
    }
  },
  
  // Zoning Information
  {
    id: 'zoning',
    name: 'Zoning Districts',
    type: 'geojson',
    url: '/api/gis/datasets/zoning/geojson',
    attribution: '&copy; Benton County GIS',
    opacity: 0.6,
    description: 'Zoning districts and land use classifications',
    dataSource: 'Benton County Planning Department',
    category: 'Planning',
    lastUpdated: 'December 2023',
    options: {
      style: (feature: any) => {
        // Style based on zoning type if available
        const zoneType = feature?.properties?.zoning?.toLowerCase() || '';
        
        if (zoneType.includes('resident')) {
          return { color: '#5856D6', weight: 1, fillOpacity: 0.25 }; // Purple for residential
        } else if (zoneType.includes('commerc')) {
          return { color: '#FF9500', weight: 1, fillOpacity: 0.25 }; // Orange for commercial
        } else if (zoneType.includes('industr')) {
          return { color: '#FF2D55', weight: 1, fillOpacity: 0.25 }; // Pink for industrial
        } else if (zoneType.includes('agri')) {
          return { color: '#4CD964', weight: 1, fillOpacity: 0.25 }; // Green for agricultural
        } else {
          return { color: '#8E8E93', weight: 1, fillOpacity: 0.25 }; // Gray for default
        }
      }
    }
  },
  
  // Environmental Data
  {
    id: 'floodZones',
    name: 'Flood Zones',
    type: 'geojson',
    url: '/api/gis/datasets/flood-zones/geojson',
    attribution: '&copy; Benton County GIS',
    opacity: 0.6,
    description: 'FEMA flood zone designations and hazard areas',
    dataSource: 'Federal Emergency Management Agency',
    category: 'Environmental',
    lastUpdated: 'February 2024',
    options: {
      style: {
        color: '#007AFF',
        weight: 1,
        fillOpacity: 0.3,
        fillColor: '#4FC3F7'
      }
    }
  }
];