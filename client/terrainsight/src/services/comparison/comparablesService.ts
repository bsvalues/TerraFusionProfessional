import { Property } from '@shared/schema';
import { calculateSimilarityScore, SimilarityWeights } from './similarityService';
import { haversineDistance } from '../../lib/utils';

/**
 * Result of a comparable property search
 */
export interface ComparablePropertyResult {
  property: Property;
  similarityScore: number;
  // Additional metadata about the comparison
  distanceKm?: number;
  priceDifference?: number;
  sizeDifference?: number;
}

/**
 * Filter options for comparable property search
 */
export interface ComparableFilters {
  // Location filters
  maxDistance?: number; // Maximum distance in kilometers
  sameNeighborhood?: boolean; // Only properties in the same neighborhood
  
  // Property characteristic filters
  propertyType?: string; // Specific property type
  bedrooms?: { min?: number, max?: number }; // Bedroom range
  bathrooms?: { min?: number, max?: number }; // Bathroom range
  squareFeet?: { min?: number, max?: number }; // Square footage range
  
  // Age/year filters
  yearBuilt?: { min?: number, max?: number }; // Year built range
  
  // Price/value filters
  value?: { min?: number, max?: number }; // Value range (in same units as property.value)
  
  // Custom similarity weights
  weights?: SimilarityWeights;
}

/**
 * Find comparable properties based on a reference property
 * 
 * @param baseProperty The reference property
 * @param allProperties Array of all available properties
 * @param filters Optional filters to narrow down comparables
 * @param maxResults Maximum number of results to return (default: 5)
 * @returns Array of comparable properties with similarity scores
 */
export function findComparableProperties(
  baseProperty: Property,
  allProperties: Property[],
  filters: ComparableFilters = {},
  maxResults: number = 5
): ComparablePropertyResult[] {
  // Filter out the base property itself
  const candidateProperties = allProperties.filter(p => p.id !== baseProperty.id);
  
  // Apply filters
  const filteredProperties = applyFilters(baseProperty, candidateProperties, filters);
  
  // Calculate similarity for each remaining property
  const comparables: ComparablePropertyResult[] = filteredProperties.map(property => {
    const similarityScore = calculateSimilarityScore(baseProperty, property, filters.weights);
    
    // Calculate additional metadata
    const result: ComparablePropertyResult = {
      property,
      similarityScore
    };
    
    // Calculate distance if coordinates are available
    if (baseProperty.latitude && baseProperty.longitude && 
        property.latitude && property.longitude) {
      result.distanceKm = haversineDistance(
        [baseProperty.latitude, baseProperty.longitude],
        [property.latitude, property.longitude]
      );
    }
    
    // Calculate price difference if values are available
    if (baseProperty.value && property.value) {
      const baseValue = parseFloat(baseProperty.value);
      const propValue = parseFloat(property.value);
      if (!isNaN(baseValue) && !isNaN(propValue)) {
        result.priceDifference = propValue - baseValue;
      }
    }
    
    // Calculate size difference if square footage is available
    if (baseProperty.squareFeet && property.squareFeet) {
      result.sizeDifference = property.squareFeet - baseProperty.squareFeet;
    }
    
    return result;
  });
  
  // Sort by similarity score (descending)
  comparables.sort((a, b) => b.similarityScore - a.similarityScore);
  
  // Return top results
  return comparables.slice(0, maxResults);
}

/**
 * Apply filters to narrow down the list of potential comparable properties
 */
function applyFilters(
  baseProperty: Property,
  properties: Property[],
  filters: ComparableFilters
): Property[] {
  return properties.filter(property => {
    // Distance filter
    if (filters.maxDistance && baseProperty.latitude && baseProperty.longitude && 
        property.latitude && property.longitude) {
      const distance = haversineDistance(
        [baseProperty.latitude, baseProperty.longitude],
        [property.latitude, property.longitude]
      );
      if (distance > filters.maxDistance) {
        return false;
      }
    }
    
    // Neighborhood filter
    if (filters.sameNeighborhood && baseProperty.neighborhood && 
        property.neighborhood !== baseProperty.neighborhood) {
      return false;
    }
    
    // Property type filter
    if (filters.propertyType && property.propertyType !== filters.propertyType) {
      return false;
    }
    
    // Bedroom range filter
    if (filters.bedrooms && property.bedrooms) {
      if (filters.bedrooms.min !== undefined && property.bedrooms < filters.bedrooms.min) {
        return false;
      }
      if (filters.bedrooms.max !== undefined && property.bedrooms > filters.bedrooms.max) {
        return false;
      }
    }
    
    // Bathroom range filter
    if (filters.bathrooms && property.bathrooms) {
      if (filters.bathrooms.min !== undefined && property.bathrooms < filters.bathrooms.min) {
        return false;
      }
      if (filters.bathrooms.max !== undefined && property.bathrooms > filters.bathrooms.max) {
        return false;
      }
    }
    
    // Square footage range filter
    if (filters.squareFeet && property.squareFeet) {
      if (filters.squareFeet.min !== undefined && property.squareFeet < filters.squareFeet.min) {
        return false;
      }
      if (filters.squareFeet.max !== undefined && property.squareFeet > filters.squareFeet.max) {
        return false;
      }
    }
    
    // Year built range filter
    if (filters.yearBuilt && property.yearBuilt) {
      if (filters.yearBuilt.min !== undefined && property.yearBuilt < filters.yearBuilt.min) {
        return false;
      }
      if (filters.yearBuilt.max !== undefined && property.yearBuilt > filters.yearBuilt.max) {
        return false;
      }
    }
    
    // Value range filter
    if (filters.value && property.value) {
      const propValue = parseFloat(property.value);
      if (!isNaN(propValue)) {
        if (filters.value.min !== undefined && propValue < filters.value.min) {
          return false;
        }
        if (filters.value.max !== undefined && propValue > filters.value.max) {
          return false;
        }
      }
    }
    
    // Property passes all filters
    return true;
  });
}