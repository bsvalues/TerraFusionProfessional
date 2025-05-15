/**
 * Shared Types for Benton County GeoSpatial Property Analyzer
 */

/**
 * Property interface representing a real estate property
 */
export interface Property {
  id: number | string;
  parcelId: string;
  address: string;
  owner: string | null;
  value: string | null;
  estimatedValue: number | string | null;
  salePrice: string | null;
  squareFeet: number;
  yearBuilt: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  propertyType: string | null;
  zoning: string | null;
  latitude: number | string | null;
  longitude: number | string | null;
  lastSaleDate: string | null;
  taxAssessment: string | null;
  lotSize: number | null;
  lastVisitDate?: string | null; // Make optional since not all data will have this
  qualityScore?: number | null;
  neighborhood: string | null;
  schoolDistrict: string | null;
  floodZone: boolean | null;
  landValue: string | null;
  zillowId: string | null;
  coordinates?: { latitude: number | string; longitude: number | string } | null;
  attributes?: Record<string, any>;
  historicalValues?: Array<{year: string; value: number}> | null;
  // Additional fields that may be present in legacy code
  createdAt?: string | null;
  updatedAt?: string | null;
}

/**
 * Neighborhood timeline data point type
 */
export interface NeighborhoodTimelineDataPoint {
  year: string;
  value: number;
  percentChange?: number;
  transactionCount?: number;
}

/**
 * Neighborhood timeline type
 */
export interface NeighborhoodTimeline {
  id: string;
  name: string;
  data: NeighborhoodTimelineDataPoint[];
  avgValue?: number;
  growthRate?: number;
}

/**
 * Enum for GIS dataset types
 */
export enum GISDataset {
  PARCELS = 'parcels',
  PARCELS_AND_ASSESS = 'parcels-and-assess',
  COUNTY_BOUNDARY = 'county-boundary',
  SCHOOL_DISTRICT = 'school-district',
  NEIGHBORHOOD_AREAS = 'neighborhood-areas',
  ZONING = 'zoning',
  FLOOD_ZONES = 'flood-zones',
}

/**
 * Property filter parameters
 */
export interface PropertyFilterParams {
  neighborhood?: string;
  minYearBuilt?: number;
  maxYearBuilt?: number;
  minValue?: number;
  maxValue?: number;
  minSquareFeet?: number;
  maxSquareFeet?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

/**
 * Comparable property with similarity score
 */
export interface ComparableProperty {
  property: Property;
  similarityScore: number;
  adjustedValue?: number;
}

/**
 * Geographic bounds
 */
export type GeoBounds = [number, number, number, number]; // [south, west, north, east]