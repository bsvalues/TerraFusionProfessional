import { Property } from '../../shared/schema';

/**
 * Interface defining weights for different property attributes in similarity calculation
 */
export interface PropertyWeights {
  /** Weight for property value comparison (0-1) */
  value: number;
  
  /** Weight for year built comparison (0-1) */
  yearBuilt: number;
  
  /** Weight for square footage comparison (0-1) */
  squareFeet: number;
  
  /** Weight for bedrooms count comparison (0-1) */
  bedrooms: number;
  
  /** Weight for bathrooms count comparison (0-1) */
  bathrooms: number;
  
  /** Weight for property type comparison (0-1) */
  propertyType: number;
  
  /** Weight for neighborhood comparison (0-1) */
  neighborhood: number;
}

/**
 * Default weights for property comparison attributes
 */
export const DEFAULT_WEIGHTS: PropertyWeights = {
  value: 0.30,
  yearBuilt: 0.20,
  squareFeet: 0.20,
  bedrooms: 0.10,
  bathrooms: 0.10,
  propertyType: 0.05,
  neighborhood: 0.05
};

/**
 * Calculates similarity score between two properties
 * 
 * @param property1 - Reference property
 * @param property2 - Property to compare against
 * @param weights - Weights for different property attributes (optional)
 * @returns Similarity score between 0 (completely different) and 1 (identical)
 */
export function calculateSimilarityScore(
  property1: Property,
  property2: Property,
  weights: PropertyWeights = DEFAULT_WEIGHTS
): number {
  let totalScore = 0;
  let totalWeight = 0;
  
  // Value comparison
  if (weights.value > 0) {
    const value1 = parsePropertyValue(property1.value);
    const value2 = parsePropertyValue(property2.value);
    
    if (value1 > 0 && value2 > 0) {
      // Ratio-based comparison (smaller/larger)
      const valueSimilarity = Math.min(value1, value2) / Math.max(value1, value2);
      totalScore += valueSimilarity * weights.value;
      totalWeight += weights.value;
    }
  }
  
  // Year built comparison
  if (weights.yearBuilt > 0) {
    const year1 = property1.yearBuilt;
    const year2 = property2.yearBuilt;
    
    if (year1 !== null && year2 !== null) {
      // Similarity decreases as year difference increases (30 years = 0 similarity)
      const yearDifference = Math.abs(year1 - year2);
      const yearSimilarity = Math.max(0, 1 - yearDifference / 30);
      totalScore += yearSimilarity * weights.yearBuilt;
      totalWeight += weights.yearBuilt;
    }
  }
  
  // Square footage comparison
  if (weights.squareFeet > 0) {
    if (property1.squareFeet > 0 && property2.squareFeet > 0) {
      // Ratio-based comparison (smaller/larger)
      const sqftSimilarity = Math.min(property1.squareFeet, property2.squareFeet) / 
                          Math.max(property1.squareFeet, property2.squareFeet);
      totalScore += sqftSimilarity * weights.squareFeet;
      totalWeight += weights.squareFeet;
    }
  }
  
  // Bedrooms comparison
  if (weights.bedrooms > 0) {
    const bedrooms1 = property1.bedrooms || 0;
    const bedrooms2 = property2.bedrooms || 0;
    
    // Difference-based comparison (max difference of 3)
    const bedroomDifference = Math.abs(bedrooms1 - bedrooms2);
    const bedroomSimilarity = 1 - Math.min(bedroomDifference / 3, 1);
    totalScore += bedroomSimilarity * weights.bedrooms;
    totalWeight += weights.bedrooms;
  }
  
  // Bathrooms comparison
  if (weights.bathrooms > 0) {
    const bathrooms1 = property1.bathrooms || 0;
    const bathrooms2 = property2.bathrooms || 0;
    
    // Difference-based comparison (max difference of 2)
    const bathroomDifference = Math.abs(bathrooms1 - bathrooms2);
    const bathroomSimilarity = 1 - Math.min(bathroomDifference / 2, 1);
    totalScore += bathroomSimilarity * weights.bathrooms;
    totalWeight += weights.bathrooms;
  }
  
  // Property type comparison
  if (weights.propertyType > 0) {
    if (property1.propertyType && property2.propertyType) {
      // Binary comparison (match/no match)
      const typeSimilarity = property1.propertyType === property2.propertyType ? 1 : 0;
      totalScore += typeSimilarity * weights.propertyType;
      totalWeight += weights.propertyType;
    }
  }
  
  // Neighborhood comparison
  if (weights.neighborhood > 0) {
    if (property1.neighborhood && property2.neighborhood) {
      // Binary comparison (match/no match)
      const neighborhoodSimilarity = property1.neighborhood === property2.neighborhood ? 1 : 0;
      totalScore += neighborhoodSimilarity * weights.neighborhood;
      totalWeight += weights.neighborhood;
    }
  }
  
  // Return normalized score
  return totalWeight > 0 ? totalScore / totalWeight : 0;
}

/**
 * Parses property value string to number
 * 
 * @param value - Property value string (e.g. "$250,000" or "250000")
 * @returns Numeric value
 */
export function parsePropertyValue(value: string | null): number {
  if (!value) return 0;
  
  // Remove currency symbols, commas, spaces
  const cleanValue = value.replace(/[$,\s]/g, '');
  const numericValue = parseFloat(cleanValue);
  
  return isNaN(numericValue) ? 0 : numericValue;
}

/**
 * Calculates geographic distance between two properties using Haversine formula
 * 
 * @param lat1 - Latitude of first property
 * @param lon1 - Longitude of first property
 * @param lat2 - Latitude of second property
 * @param lon2 - Longitude of second property
 * @returns Distance in kilometers
 */
export function calculateDistance(
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number {
  // Earth's radius in kilometers
  const R = 6371;
  
  // Convert degrees to radians
  const toRad = (degrees: number) => degrees * Math.PI / 180;
  
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  return distance;
}

/**
 * Normalizes weights to ensure they sum to 1.0
 * 
 * @param weights - Property comparison weights
 * @returns Normalized weights object
 */
export function normalizeWeights(weights: PropertyWeights): PropertyWeights {
  const sum = Object.values(weights).reduce((total, weight) => total + weight, 0);
  
  if (sum === 0) return { ...DEFAULT_WEIGHTS };
  
  return {
    value: weights.value / sum,
    yearBuilt: weights.yearBuilt / sum,
    squareFeet: weights.squareFeet / sum,
    bedrooms: weights.bedrooms / sum,
    bathrooms: weights.bathrooms / sum,
    propertyType: weights.propertyType / sum,
    neighborhood: weights.neighborhood / sum
  };
}

/**
 * Calculates geographic similarity based on distance
 * 
 * @param distance - Distance in kilometers
 * @param maxDistance - Maximum distance to consider (default: 10km)
 * @returns Similarity score from 0 to 1
 */
export function calculateGeographicSimilarity(
  distance: number,
  maxDistance: number = 10
): number {
  return Math.max(0, 1 - distance / maxDistance);
}

/**
 * Creates a weight preset focused on property value
 */
export const VALUE_FOCUSED_WEIGHTS: PropertyWeights = normalizeWeights({
  value: 0.50,
  yearBuilt: 0.15,
  squareFeet: 0.15,
  bedrooms: 0.05,
  bathrooms: 0.05,
  propertyType: 0.05,
  neighborhood: 0.05
});

/**
 * Creates a weight preset focused on physical characteristics
 */
export const PHYSICAL_FOCUSED_WEIGHTS: PropertyWeights = normalizeWeights({
  value: 0.10,
  yearBuilt: 0.15,
  squareFeet: 0.30,
  bedrooms: 0.20,
  bathrooms: 0.15,
  propertyType: 0.05,
  neighborhood: 0.05
});

/**
 * Creates a weight preset focused on location
 */
export const LOCATION_FOCUSED_WEIGHTS: PropertyWeights = normalizeWeights({
  value: 0.15,
  yearBuilt: 0.10,
  squareFeet: 0.15,
  bedrooms: 0.05,
  bathrooms: 0.05,
  propertyType: 0.20,
  neighborhood: 0.30
});