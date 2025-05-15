import { Property } from '@shared/schema';

/**
 * Weights for calculating property similarity
 */
export interface SimilarityWeights {
  propertyType?: number;
  squareFeet?: number;
  yearBuilt?: number;
  bedrooms?: number;
  bathrooms?: number;
  lotSize?: number;
  neighborhood?: number;
  location?: number;  // For geographic distance
}

/**
 * Alias for backward compatibility
 */
export const calculateSimilarityScore = calculateSimilarity;

// Calculates similarity score between two properties
export function calculateSimilarity(
  baseProperty: Property,
  compareProperty: Property,
  customWeights?: SimilarityWeights
): number {
  // Skip the same property
  if (baseProperty.id === compareProperty.id) {
    return 0;
  }

  // Define default feature weights
  const defaultWeights = {
    propertyType: 0.15,
    squareFeet: 0.20,
    yearBuilt: 0.15,
    bedrooms: 0.10,
    bathrooms: 0.10,
    lotSize: 0.10,
    neighborhood: 0.20,
    location: 0.0 // By default, don't consider location
  };
  
  // Combine default weights with custom weights
  const weights = customWeights 
    ? { ...defaultWeights, ...customWeights }
    : defaultWeights;

  let totalScore = 0;
  let totalWeightApplied = 0;

  // Compare property type (exact match)
  if (baseProperty.propertyType && compareProperty.propertyType) {
    const weight = weights.propertyType;
    totalWeightApplied += weight;
    
    if (baseProperty.propertyType === compareProperty.propertyType) {
      totalScore += weight;
    }
  }

  // Compare neighborhood (exact match)
  if (baseProperty.neighborhood && compareProperty.neighborhood) {
    const weight = weights.neighborhood;
    totalWeightApplied += weight;
    
    if (baseProperty.neighborhood === compareProperty.neighborhood) {
      totalScore += weight;
    }
  }

  // Compare square feet (normalized difference)
  if (baseProperty.squareFeet && compareProperty.squareFeet) {
    const weight = weights.squareFeet;
    totalWeightApplied += weight;
    
    const percentDiff = Math.abs(baseProperty.squareFeet - compareProperty.squareFeet) / baseProperty.squareFeet;
    const similarityScore = Math.max(0, 1 - percentDiff); // 0 to 1 score
    
    totalScore += similarityScore * weight;
  }

  // Compare year built (normalized difference, max 50 years)
  if (baseProperty.yearBuilt && compareProperty.yearBuilt) {
    const weight = weights.yearBuilt;
    totalWeightApplied += weight;
    
    const yearDiff = Math.abs(baseProperty.yearBuilt - compareProperty.yearBuilt);
    const normalizedDiff = Math.min(yearDiff, 50) / 50; // Normalize to 0-1
    const similarityScore = 1 - normalizedDiff;
    
    totalScore += similarityScore * weight;
  }

  // Compare bedrooms (exact match, or close)
  if (baseProperty.bedrooms && compareProperty.bedrooms) {
    const weight = weights.bedrooms;
    totalWeightApplied += weight;
    
    const bedroomDiff = Math.abs(baseProperty.bedrooms - compareProperty.bedrooms);
    
    if (bedroomDiff === 0) {
      totalScore += weight;
    } else if (bedroomDiff === 1) {
      totalScore += weight * 0.8;
    } else if (bedroomDiff === 2) {
      totalScore += weight * 0.4;
    }
  }

  // Compare bathrooms (exact match, or close)
  if (baseProperty.bathrooms && compareProperty.bathrooms) {
    const weight = weights.bathrooms;
    totalWeightApplied += weight;
    
    const bathroomDiff = Math.abs(baseProperty.bathrooms - compareProperty.bathrooms);
    
    if (bathroomDiff === 0) {
      totalScore += weight;
    } else if (bathroomDiff <= 0.5) {
      totalScore += weight * 0.8;
    } else if (bathroomDiff <= 1) {
      totalScore += weight * 0.6;
    } else if (bathroomDiff <= 1.5) {
      totalScore += weight * 0.3;
    }
  }

  // Compare lot size (normalized difference)
  if (baseProperty.lotSize && compareProperty.lotSize) {
    const weight = weights.lotSize;
    totalWeightApplied += weight;
    
    const percentDiff = Math.abs(baseProperty.lotSize - compareProperty.lotSize) / baseProperty.lotSize;
    const similarityScore = Math.max(0, 1 - percentDiff); // 0 to 1 score
    
    totalScore += similarityScore * weight;
  }

  // If no weights were applied, return 0
  if (totalWeightApplied === 0) return 0;

  // Normalize by weights that were actually applied
  return totalScore / totalWeightApplied;
}

// Finds similar properties to a given base property
export function findSimilarProperties(
  baseProperty: Property,
  properties: Property[],
  limit: number = 5
): { properties: Property[], scores: Record<string | number, number> } {
  // Calculate similarity scores for each property
  const propertiesWithScores = properties.map(property => ({
    property,
    score: calculateSimilarity(baseProperty, property)
  }));

  // Sort by similarity score (descending)
  propertiesWithScores.sort((a, b) => b.score - a.score);

  // Ensure the base property is included (at the beginning)
  const basePropertyInResults = propertiesWithScores.find(
    p => p.property.id === baseProperty.id
  );
  
  let results: typeof propertiesWithScores;
  
  if (basePropertyInResults) {
    // Remove base property from its current position
    results = propertiesWithScores.filter(p => p.property.id !== baseProperty.id);
    // Add it at the beginning
    results.unshift(basePropertyInResults);
  } else {
    // Base property isn't in the results, add it manually
    results = [
      { property: baseProperty, score: 1 },
      ...propertiesWithScores
    ];
  }

  // Limit results and create a scores record
  const limitedResults = results.slice(0, limit);
  const scores: Record<string | number, number> = {};
  
  limitedResults.forEach(({ property, score }) => {
    scores[property.id] = score;
  });

  return {
    properties: limitedResults.map(r => r.property),
    scores
  };
}