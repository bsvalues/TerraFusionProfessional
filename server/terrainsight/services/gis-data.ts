import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse';
import { transformToWGS84 } from '../../client/src/utils/coordinateTransform';

// GIS Dataset enum - copied from shared/types.ts
export enum GISDataset {
  PARCELS = 'parcels',
  PARCELS_AND_ASSESS = 'parcels-and-assess',
  COUNTY_BOUNDARY = 'county-boundary',
  SCHOOL_DISTRICT = 'school-district',
  NEIGHBORHOODS = 'neighborhood-areas',
  ZONING = 'zoning',
  FLOOD_ZONES = 'flood-zones'
}

// Interface for GeoJSON Feature
interface GeoJSONFeature {
  type: string;
  geometry: {
    type: string;
    coordinates: any; // Can be [number, number] for Point or any[][] for other geometries
  };
  properties: Record<string, any>;
}

// Interface for GeoJSON FeatureCollection
interface GeoJSONResponse {
  type: string;
  features: GeoJSONFeature[];
  crs?: {
    type: string;
    properties: Record<string, any>;
  };
  spatialReference?: Record<string, any>;
}

// Map of available datasets and their corresponding API endpoints
export const GIS_DATASETS = {
  [GISDataset.PARCELS]: 'https://services7.arcgis.com/NURlY7V8UHl6XumF/arcgis/rest/services/Parcels/FeatureServer/0/query',
  [GISDataset.PARCELS_AND_ASSESS]: 'https://services7.arcgis.com/NURlY7V8UHl6XumF/arcgis/rest/services/Parcels_and_Assess/FeatureServer/0/query',
  [GISDataset.COUNTY_BOUNDARY]: 'https://services7.arcgis.com/NURlY7V8UHl6XumF/arcgis/rest/services/CountyBoundaries/FeatureServer/0/query',
  [GISDataset.SCHOOL_DISTRICT]: 'https://services7.arcgis.com/NURlY7V8UHl6XumF/arcgis/rest/services/SchoolDistricts/FeatureServer/0/query',
  [GISDataset.NEIGHBORHOODS]: 'https://services7.arcgis.com/NURlY7V8UHl6XumF/arcgis/rest/services/Neighborhoods/FeatureServer/0/query',
  [GISDataset.ZONING]: 'https://services7.arcgis.com/NURlY7V8UHl6XumF/arcgis/rest/services/Zoning/FeatureServer/0/query',
  [GISDataset.FLOOD_ZONES]: 'https://services7.arcgis.com/NURlY7V8UHl6XumF/arcgis/rest/services/FloodZones/FeatureServer/0/query',
};

/**
 * Get available GIS datasets
 * 
 * @returns Array of dataset names
 */
export async function getAvailableDatasets(): Promise<string[]> {
  try {
    return Object.keys(GIS_DATASETS);
  } catch (error) {
    console.error('Error getting available datasets:', error);
    throw error;
  }
}

/**
 * Load GeoJSON data for a specified dataset by fetching from ArcGIS REST API
 * 
 * @param datasetName Name of the dataset to load
 * @returns GeoJSON data as an object
 */
export async function loadGeoJSONData(datasetName: string): Promise<GeoJSONResponse> {
  console.log(`Getting GeoJSON data for ${datasetName}`);
  
  // ALWAYS use Benton County data first - only use other sources if explicitly instructed
  try {
    // First, attempt to load real Benton County data from CSV files
    const bentonCountyData = await loadBentonCountyData(datasetName);
    if (bentonCountyData) {
      console.log(`Using real Benton County data for ${datasetName}`);
      return bentonCountyData;
    }
  } catch (error) {
    console.error(`Error loading Benton County data for ${datasetName}:`, error);
  }
  
  // If we reach here, either the dataset wasn't found in Benton County data or there was an error
  // Fallback to ArcGIS API if configured (only use if explicitly permitted)
  const useArcGisData = process.env.USE_ARCGIS_DATA === 'true' && process.env.ARCGIS_API_KEY;
  
  if (useArcGisData) {
    console.log(`Falling back to ArcGIS data for ${datasetName}`);
    return fetchDataFromArcGIS(datasetName);
  } else {
    console.log(`No Benton County data available for ${datasetName}, using empty dataset`);
    // Return an empty GeoJSON collection rather than demo data
    return {
      type: "FeatureCollection",
      features: []
    };
  }
}

/**
 * Fetch data from ArcGIS REST API
 * @param datasetName Name of the dataset to fetch
 * @returns GeoJSON data
 */
async function fetchDataFromArcGIS(datasetName: string): Promise<any> {
  const endpoint = GIS_DATASETS[datasetName as keyof typeof GIS_DATASETS];
  
  if (!endpoint) {
    throw new Error(`Dataset '${datasetName}' not found. Available datasets are: ${Object.keys(GIS_DATASETS).join(', ')}`);
  }
  
  try {
    // Build parameters for the ArcGIS REST API request
    const params = new URLSearchParams({
      where: '1=1',             // Get all features
      outFields: '*',           // Get all fields
      returnGeometry: 'true',   // Get the geometries
      outSR: '4326',            // Return in WGS84 coordinates for Leaflet
      f: 'geojson'              // Return in GeoJSON format
    });
    
    // Add the token for authentication
    if (process.env.ARCGIS_API_KEY) {
      params.append('token', process.env.ARCGIS_API_KEY);
    }
    
    console.log(`Fetching GIS data from ${endpoint}`);
    
    // Make the request
    const response = await fetch(`${endpoint}?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
    }
    
    // Parse the response
    const geoJSON = await response.json() as GeoJSONResponse;
    
    // Verify it's properly formatted GeoJSON
    if (!geoJSON || geoJSON.type !== 'FeatureCollection' || !Array.isArray(geoJSON.features)) {
      console.warn('Response was not properly formatted GeoJSON, returning empty dataset');
      return {
        type: "FeatureCollection",
        features: []
      };
    }
    
    return geoJSON;
  } catch (error) {
    console.error(`Error loading GeoJSON data for '${datasetName}' from ArcGIS:`, error);
    console.log('Returning empty dataset instead of sample data');
    return {
      type: "FeatureCollection",
      features: []
    };
  }
}

/**
 * Get sample GeoJSON data for a specific dataset
 * @param datasetName Name of the dataset
 * @returns Sample GeoJSON data
 */
function getSampleGeoJSON(datasetName: string): GeoJSONResponse {
  // For larger boundaries (county, zoning districts, flood zones), provide more extensive polygons
  if (datasetName === 'county-boundary') {
    return {
      type: "FeatureCollection",
      features: [{
        type: "Feature",
        properties: {
          id: "county-1",
          name: "Benton County",
          area: 1760000000, // square meters
          type: "County"
        },
        geometry: {
          type: "Polygon",
          coordinates: [[
            [-119.95, 46.00], // SW corner
            [-119.95, 46.40], // NW corner
            [-118.90, 46.40], // NE corner
            [-118.90, 46.00], // SE corner
            [-119.95, 46.00]  // Back to SW to close polygon
          ]]
        }
      }]
    };
  }
  
  if (datasetName === 'zoning') {
    return {
      type: "FeatureCollection",
      features: [
        // Residential zone (large area)
        {
          type: "Feature",
          properties: {
            id: "zone-1",
            name: "North Richland Residential Zone",
            zoning: "Residential",
            area: 50000000
          },
          geometry: {
            type: "Polygon",
            coordinates: [[
              [-119.35, 46.30],
              [-119.25, 46.30],
              [-119.25, 46.35],
              [-119.35, 46.35],
              [-119.35, 46.30]
            ]]
          }
        },
        // Commercial zone
        {
          type: "Feature",
          properties: {
            id: "zone-2",
            name: "Central Business District",
            zoning: "Commercial",
            area: 30000000
          },
          geometry: {
            type: "Polygon",
            coordinates: [[
              [-119.30, 46.25],
              [-119.20, 46.25],
              [-119.20, 46.30],
              [-119.30, 46.30],
              [-119.30, 46.25]
            ]]
          }
        },
        // Industrial zone
        {
          type: "Feature",
          properties: {
            id: "zone-3",
            name: "South Kennewick Industrial Zone",
            zoning: "Industrial",
            area: 40000000
          },
          geometry: {
            type: "Polygon",
            coordinates: [[
              [-119.15, 46.15],
              [-119.05, 46.15],
              [-119.05, 46.20],
              [-119.15, 46.20],
              [-119.15, 46.15]
            ]]
          }
        },
        // Agricultural zone
        {
          type: "Feature",
          properties: {
            id: "zone-4",
            name: "West Valley Agricultural District",
            zoning: "Agricultural",
            area: 80000000
          },
          geometry: {
            type: "Polygon",
            coordinates: [[
              [-119.80, 46.20],
              [-119.60, 46.20],
              [-119.60, 46.35],
              [-119.80, 46.35],
              [-119.80, 46.20]
            ]]
          }
        }
      ]
    };
  }
  
  if (datasetName === 'flood-zones') {
    return {
      type: "FeatureCollection",
      features: [
        // Flood zone along river
        {
          type: "Feature",
          properties: {
            id: "flood-1",
            name: "Columbia River Floodplain A",
            zoneType: "100-year",
            riskLevel: "High"
          },
          geometry: {
            type: "Polygon",
            coordinates: [[
              [-119.40, 46.20],
              [-119.30, 46.20],
              [-119.20, 46.30],
              [-119.30, 46.35],
              [-119.40, 46.30],
              [-119.40, 46.20]
            ]]
          }
        },
        // Second flood zone 
        {
          type: "Feature",
          properties: {
            id: "flood-2",
            name: "Yakima River Floodplain",
            zoneType: "500-year",
            riskLevel: "Moderate"
          },
          geometry: {
            type: "Polygon",
            coordinates: [[
              [-119.70, 46.30],
              [-119.60, 46.25],
              [-119.50, 46.30],
              [-119.60, 46.35],
              [-119.70, 46.30]
            ]]
          }
        }
      ]
    };
  }
  
  if (datasetName === 'school-district') {
    return {
      type: "FeatureCollection",
      features: [
        // Richland School District
        {
          type: "Feature",
          properties: {
            id: "sd-1",
            name: "Richland School District",
            code: "SD400",
            students: 12500
          },
          geometry: {
            type: "Polygon",
            coordinates: [[
              [-119.40, 46.25],
              [-119.25, 46.25],
              [-119.25, 46.35],
              [-119.40, 46.35],
              [-119.40, 46.25]
            ]]
          }
        },
        // Kennewick School District
        {
          type: "Feature",
          properties: {
            id: "sd-2",
            name: "Kennewick School District",
            code: "SD402", 
            students: 18000
          },
          geometry: {
            type: "Polygon",
            coordinates: [[
              [-119.25, 46.15],
              [-119.10, 46.15],
              [-119.10, 46.25],
              [-119.25, 46.25],
              [-119.25, 46.15]
            ]]
          }
        },
        // Pasco School District
        {
          type: "Feature",
          properties: {
            id: "sd-3",
            name: "Pasco School District",
            code: "SD403",
            students: 14800
          },
          geometry: {
            type: "Polygon",
            coordinates: [[
              [-119.10, 46.20],
              [-118.90, 46.20],
              [-118.90, 46.35],
              [-119.10, 46.35],
              [-119.10, 46.20]
            ]]
          }
        }
      ]
    };
  }
  
  if (datasetName === 'neighborhood-areas') {
    return {
      type: "FeatureCollection",
      features: [
        // North Richland Neighborhood
        {
          type: "Feature",
          properties: {
            id: "nbhd-1",
            name: "North Richland",
            code: "NR100",
            population: 8500,
            medianHomeValue: 425000
          },
          geometry: {
            type: "Polygon",
            coordinates: [[
              [-119.35, 46.30],
              [-119.25, 46.30],
              [-119.25, 46.35],
              [-119.35, 46.35],
              [-119.35, 46.30]
            ]]
          }
        },
        // South Richland Neighborhood
        {
          type: "Feature",
          properties: {
            id: "nbhd-2",
            name: "South Richland",
            code: "SR200",
            population: 12000,
            medianHomeValue: 385000
          },
          geometry: {
            type: "Polygon",
            coordinates: [[
              [-119.32, 46.25],
              [-119.22, 46.25],
              [-119.22, 46.30],
              [-119.32, 46.30],
              [-119.32, 46.25]
            ]]
          }
        },
        // West Kennewick Neighborhood
        {
          type: "Feature",
          properties: {
            id: "nbhd-3",
            name: "West Kennewick",
            code: "WK300",
            population: 9000,
            medianHomeValue: 325000
          },
          geometry: {
            type: "Polygon",
            coordinates: [[
              [-119.25, 46.20],
              [-119.15, 46.20],
              [-119.15, 46.25],
              [-119.25, 46.25],
              [-119.25, 46.20]
            ]]
          }
        },
        // East Kennewick Neighborhood
        {
          type: "Feature",
          properties: {
            id: "nbhd-4",
            name: "East Kennewick",
            code: "EK400",
            population: 8200,
            medianHomeValue: 295000
          },
          geometry: {
            type: "Polygon",
            coordinates: [[
              [-119.15, 46.20],
              [-119.05, 46.20],
              [-119.05, 46.25],
              [-119.15, 46.25],
              [-119.15, 46.20]
            ]]
          }
        },
        // Finley Neighborhood
        {
          type: "Feature",
          properties: {
            id: "nbhd-5",
            name: "Finley",
            code: "F500",
            population: 3200,
            medianHomeValue: 225000
          },
          geometry: {
            type: "Polygon",
            coordinates: [[
              [-119.05, 46.10],
              [-118.95, 46.10],
              [-118.95, 46.15],
              [-119.05, 46.15],
              [-119.05, 46.10]
            ]]
          }
        }
      ]
    };
  }
  
  // For regular parcels, use the existing sample data
  const sampleGeoJSON = {
    type: "FeatureCollection",
    features: [
      // Residential area - Richland
      {
        type: "Feature",
        properties: {
          id: "1",
          name: "Richland Residential 1",
          area: 5000,
          zoning: "Residential"
        },
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [-119.28, 46.25],
              [-119.27, 46.25],
              [-119.27, 46.26],
              [-119.28, 46.26],
              [-119.28, 46.25]
            ]
          ]
        }
      },
      {
        type: "Feature",
        properties: {
          id: "2",
          name: "Richland Residential 2",
          area: 4800,
          zoning: "Residential"
        },
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [-119.277, 46.255],
              [-119.267, 46.255],
              [-119.267, 46.265],
              [-119.277, 46.265],
              [-119.277, 46.255]
            ]
          ]
        }
      },
      {
        type: "Feature",
        properties: {
          id: "3",
          name: "Richland Residential 3",
          area: 5200,
          zoning: "Residential"
        },
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [-119.275, 46.245],
              [-119.265, 46.245],
              [-119.265, 46.255],
              [-119.275, 46.255],
              [-119.275, 46.245]
            ]
          ]
        }
      },
      // Commercial area - Kennewick
      {
        type: "Feature",
        properties: {
          id: "4",
          name: "Kennewick Commercial 1",
          area: 7500,
          zoning: "Commercial"
        },
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [-119.22, 46.20],
              [-119.21, 46.20],
              [-119.21, 46.21],
              [-119.22, 46.21],
              [-119.22, 46.20]
            ]
          ]
        }
      },
      {
        type: "Feature",
        properties: {
          id: "5",
          name: "Kennewick Commercial 2",
          area: 8500,
          zoning: "Commercial"
        },
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [-119.215, 46.205],
              [-119.205, 46.205],
              [-119.205, 46.215],
              [-119.215, 46.215],
              [-119.215, 46.205]
            ]
          ]
        }
      },
      // Agricultural area - West Richland
      {
        type: "Feature",
        properties: {
          id: "6",
          name: "West Richland Agricultural 1",
          area: 20000,
          zoning: "Agricultural"
        },
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [-119.36, 46.30],
              [-119.35, 46.30],
              [-119.35, 46.31],
              [-119.36, 46.31],
              [-119.36, 46.30]
            ]
          ]
        }
      },
      {
        type: "Feature",
        properties: {
          id: "7",
          name: "West Richland Agricultural 2",
          area: 25000,
          zoning: "Agricultural"
        },
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [-119.355, 46.305],
              [-119.345, 46.305],
              [-119.345, 46.315],
              [-119.355, 46.315],
              [-119.355, 46.305]
            ]
          ]
        }
      },
      // Industrial area - Benton City
      {
        type: "Feature",
        properties: {
          id: "8",
          name: "Benton City Industrial 1",
          area: 15000,
          zoning: "Industrial"
        },
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [-119.48, 46.26],
              [-119.47, 46.26],
              [-119.47, 46.27],
              [-119.48, 46.27],
              [-119.48, 46.26]
            ]
          ]
        }
      },
      {
        type: "Feature",
        properties: {
          id: "9",
          name: "Finley Industrial Area",
          area: 17000,
          zoning: "Industrial"
        },
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [-119.03, 46.14],
              [-119.02, 46.14],
              [-119.02, 46.15],
              [-119.03, 46.15],
              [-119.03, 46.14]
            ]
          ]
        }
      },
      // Public area - Prosser
      {
        type: "Feature",
        properties: {
          id: "10",
          name: "Prosser Public Land",
          area: 30000,
          zoning: "Public"
        },
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [-119.76, 46.21],
              [-119.75, 46.21],
              [-119.75, 46.22],
              [-119.76, 46.22],
              [-119.76, 46.21]
            ]
          ]
        }
      }
    ]
  };
  
  return sampleGeoJSON;
  
  /* 
  // The code below is for when we have proper API integration
  const endpoint = GIS_DATASETS[datasetName as keyof typeof GIS_DATASETS];
  
  if (!endpoint) {
    throw new Error(`Dataset '${datasetName}' not found. Available datasets are: ${Object.keys(GIS_DATASETS).join(', ')}`);
  }
  
  try {
    // Get a small sample for demonstration purposes
    // In production, we would implement spatial queries based on the current map view
    const params = new URLSearchParams({
      where: '1=1',  // Get all features
      outFields: 'OBJECTID',  // Minimal fields
      resultRecordCount: '10', // Very small sample 
      f: 'json'      // JSON format
    });

    // Add token if available
    if (process.env.ARCGIS_API_KEY) {
      params.append('token', process.env.ARCGIS_API_KEY);
    }
    
    console.log(`Fetching GIS data from ${endpoint}`);
    
    // Fetch data from API
    const response = await fetch(`${endpoint}?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Convert to GeoJSON for internal use
    // This would need custom code based on the actual API response format
    
    return convertToGeoJSON(data);
  } catch (error) {
    console.error(`Error loading GeoJSON data for '${datasetName}':`, error);
    throw error;
  }
  */
}

/**
 * Get GeoJSON feature properties from a dataset
 * 
 * @param datasetName Name of the dataset
 * @returns Array of properties from features
 */
export async function getFeatureProperties(datasetName: string): Promise<any[]> {
  try {
    const geoJSON = await loadGeoJSONData(datasetName);
    
    if (!geoJSON || !geoJSON.features || !Array.isArray(geoJSON.features)) {
      throw new Error('Invalid GeoJSON format');
    }
    
    return geoJSON.features.map((feature: any) => feature.properties);
  } catch (error) {
    console.error(`Error getting feature properties for '${datasetName}':`, error);
    throw error;
  }
}

/**
 * Read and parse a CSV file
 * @param filePath Path to the CSV file
 * @returns Parsed data as array of records
 */
async function readCSVFile(filePath: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    try {
      const results: any[] = [];
      
      fs.createReadStream(filePath)
        .pipe(parse({
          columns: true,
          skip_empty_lines: true,
          trim: true
        }))
        .on('data', (data) => results.push(data))
        .on('end', () => resolve(results))
        .on('error', (error) => reject(error));
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Load and transform Benton County data from CSV files
 * @param datasetName Name of the dataset to load
 * @returns GeoJSON data
 */
async function loadBentonCountyData(datasetName: string): Promise<GeoJSONResponse | null> {
  // Start with a base GeoJSON FeatureCollection
  const geoJSON: GeoJSONResponse = {
    type: "FeatureCollection",
    features: [],
    // Include CRS info for Washington State Plane South (EPSG:2927)
    crs: {
      type: "name",
      properties: {
        name: "EPSG:2927"
      }
    },
    // Include spatial reference for ArcGIS compatibility
    spatialReference: {
      wkid: 2927
    } as any
  };
  
  try {
    // Load spatial data that contains coordinates
    console.log('Loading Benton County geospatial data from comper_spatialest.csv');
    const spatialData = await readCSVFile(path.join('./attached_assets', 'comper_spatialest.csv'));
    
    // Load account data for additional information
    const accountData = await readCSVFile(path.join('./attached_assets', 'account.csv'));
    
    // Create lookup for account data by account_id
    const accountLookup = accountData.reduce((acc: Record<string, any>, account: any) => {
      const id = account.acct_id || account.account_id || account.ACCOUNT_ID;
      if (id) {
        acc[id] = account;
      }
      return acc;
    }, {});
    
    // Create lookup for account data by prop_id for matching land_detail information
    const propIdLookup: Record<string, any> = {};
    
    // Load land detail data for more property information
    const landDetailData = await readCSVFile(path.join('./attached_assets', 'land_detail.csv'));
    
    // Create lookup from prop_id to land details
    const landDetailLookup = landDetailData.reduce((acc: Record<string, any[]>, land: any) => {
      const id = land.prop_id;
      if (id) {
        if (!acc[id]) {
          acc[id] = [];
        }
        acc[id].push(land);
      }
      return acc;
    }, {});
    
    // Load owner data if needed for parcels-and-assess
    let ownerLookup: Record<string, any[]> = {};
    if (datasetName === 'parcels-and-assess') {
      const ownerData = await readCSVFile(path.join('./attached_assets', 'owner.csv'));
      ownerLookup = ownerData.reduce((acc: Record<string, any[]>, owner: any) => {
        const id = owner.acct_id;
        if (id) {
          if (!acc[id]) {
            acc[id] = [];
          }
          acc[id].push(owner);
        }
        return acc;
      }, {});
    }
    
    // Convert parsed data to GeoJSON features
    let processedCount = 0;
    for (const property of spatialData) {
      // Extract coordinates from the right columns (XCoord, YCoord)
      if (!property.XCoord || !property.YCoord || property.XCoord === '0' || property.YCoord === '0') {
        continue; // Skip properties without coordinates
      }
      
      // Parse coordinates - these are in WA State Plane South
      const x = parseFloat(property.XCoord);
      const y = parseFloat(property.YCoord);
      
      // Skip invalid coordinates
      if (isNaN(x) || isNaN(y)) {
        continue;
      }
      
      // Get property ID
      const propertyId = property.prop_id || property.ParcelID;
      if (!propertyId) {
        continue; // Skip if no property ID
      }
      
      // Transform coordinates from WA State Plane South to WGS84
      // x range is roughly 1.79 million to 2.03 million feet
      // y range is roughly 186k to 473k feet for Benton County
      let coordinates: [number, number];
      if (x >= 1700000 && x <= 2100000 && y >= 180000 && y <= 500000) {
        // These appear to be WA State Plane South coordinates
        coordinates = transformToWGS84(x, y);
        
        // Log some sample transformations for debugging 
        if (processedCount < 5) {
          console.log(`Transformed coordinates: [${x}, ${y}] -> [${coordinates[0]}, ${coordinates[1]}]`);
        }
      } else {
        // If coordinates are already in WGS84 format or another system
        coordinates = [x, y];
      }
      
      // Get account data if available
      const account = accountLookup[propertyId];
      
      // Get land details if available
      const landDetails = landDetailLookup[propertyId] || [];
      
      // Calculate total acres from land details if available
      let totalAcres = 0;
      if (landDetails.length > 0) {
        totalAcres = landDetails.reduce((sum: number, land: any) => {
          return sum + (parseFloat(land.size_acres) || 0);
        }, 0);
      } else {
        // Use acres from property record if available
        totalAcres = parseFloat(property.totalacres) || 0;
      }
      
      // Build properties object with all relevant fields
      const properties: Record<string, any> = {
        id: propertyId,
        parcelId: property.ParcelID || propertyId,
        address: property.situs_display || '',
        acres: totalAcres,
        landUse: property.property_use_desc || property.property_use_cd || '',
        zoning: property.zoning || 'Unknown',
        landValue: parseFloat(property.LandVal) || 0,
        improvementValue: parseFloat(property.ImpVal) || 0,
        totalValue: parseFloat(property.TotalMarketValue) || 0,
        neighborhood: property.neighborhood || '',
        schoolDistrict: property.school_district || '',
        floodZone: property.flood_zone || '',
        yearBuilt: property.YearBuilt || '',
        // Add more fields based on what's available in the data
        
        // Include all fields from the property record for completeness
        ...property
      };
      
      // Add owner information if this is parcels-and-assess
      if (datasetName === 'parcels-and-assess') {
        const owners = ownerLookup[propertyId] || [];
        if (owners.length > 0) {
          const primaryOwner = owners[0];
          properties.ownerName = primaryOwner.file_as_name || '';
          properties.mailingAddress = [
            primaryOwner.addr_line1 || '',
            primaryOwner.addr_city || '',
            primaryOwner.addr_state || '',
            primaryOwner.zip || ''
          ].filter(Boolean).join(', ');
        }
      }
      
      // Create GeoJSON feature
      const feature = {
        type: "Feature",
        geometry: {
          type: "Point", // Use Point geometry for simplicity
          coordinates: coordinates
        },
        properties: properties
      };
      
      geoJSON.features.push(feature);
      processedCount++;
    }
    
    console.log(`Loaded ${geoJSON.features.length} parcels from Benton County data`);
    
    // Return the GeoJSON, even if empty
    return geoJSON;
    
  } catch (error) {
    console.error(`Error loading Benton County data for ${datasetName}:`, error);
    return null;
  }
}