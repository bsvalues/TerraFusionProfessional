/**
 * Shared type definitions for client components
 */

import { Property as DrizzleProperty } from '@shared/schema';

/**
 * GIS dataset type enum
 */
export enum GISDataset {
  PARCELS = 'parcels',
  PARCELS_AND_ASSESS = 'parcels-and-assess',
  COUNTY_BOUNDARY = 'county-boundary',
  SCHOOL_DISTRICTS = 'school-districts',
  NEIGHBORHOODS = 'neighborhood-areas',
  ZONING = 'zoning',
  FLOOD_ZONES = 'flood-zones'
}

/**
 * Property type with client-specific extensions
 */
export interface Property {
  id: number;
  parcelId: string;
  address: string;
  owner: string | null;
  value: string | null;
  estimatedValue: string | null;
  salePrice: string | null;
  squareFeet: number;
  yearBuilt: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  propertyType: string | null;
  zoning: string | null;
  latitude: string | null;
  longitude: string | null;
  createdAt?: string;
  updatedAt?: string;
  lastSaleDate: string | null;
  taxAssessment: string | null;
  lotSize: number | null;
  lastVisitDate: string | null;
  qualityScore: number | null;
  neighborhood: string | null;
  schoolDistrict: string | null;
  floodZone: boolean | null;
  landValue?: string | null;
  zillowId: string | null;
}

/**
 * Property value history data point
 */
export interface PropertyValueHistoryPoint {
  year: string;
  value: number;
}

/**
 * GeoJSON Feature type
 */
export interface GeoJSONFeature {
  type: string;
  geometry: {
    type: string;
    coordinates: any;
  };
  properties: Record<string, any>;
}

/**
 * GeoJSON FeatureCollection type
 */
export interface GeoJSONFeatureCollection {
  type: string;
  features: GeoJSONFeature[];
}

/**
 * Map Layer configuration type
 */
export interface MapLayer {
  id: string;
  name: string;
  visible: boolean;
  type: 'vector' | 'raster' | 'geojson';
  url?: string;
  data?: GeoJSONFeatureCollection;
  style?: any;
}

/**
 * Property comparison item
 */
export interface PropertyComparison {
  property: Property;
  similarity: number;
  similarityFactors: {
    factor: string;
    weight: number;
    similarity: number;
  }[];
}