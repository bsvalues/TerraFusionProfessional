import { Property } from '@shared/schema';
import { calculateSimilarity, SimilarityWeights } from './similarityService';
import { haversineDistance } from '../../lib/utils';
import * as ss from 'simple-statistics';
import KMeans from 'ml-kmeans';

/**
 * Enhanced Property Comparison Service
 * Provides advanced market comparison analytics
 */

export interface MarketSegment {
  id: number;
  name: string;
  properties: Property[];
  averageValue: number;
  medianValue: number;
  priceRange: [number, number];
  dominantPropertyType?: string;
  dominantNeighborhood?: string;
  growthRate?: number;
  averageSquareFeet: number;
}

export interface InfluencedProperty {
  property: Property;
  distanceKm: number;
  influenceScore: number;
}

export interface InfluenceRadiusResult {
  propertyId: number | string;
  radiusKm: number;
  decayRate: number;
  influencedProperties: InfluencedProperty[];
  totalInfluence: number;
}

export interface PriceFactor {
  feature: string;
  impact: number;  // 0-1 scale, higher means more impact
  direction: 'positive' | 'negative';
  coefficient: number;
}

export interface PriceSensitivityResult {
  factors: PriceFactor[];
  modelFit: number;  // R-squared value
  elasticity?: Record<string, number>;  // Price elasticity for each feature
}

/**
 * Calculate similarity with auto-weighted features based on market relevance
 * 
 * @param baseProperty Reference property
 * @param compareProperty Property to compare against
 * @param allProperties All properties in the market (for context)
 * @returns Similarity score (0-1)
 */
export function calculateAutoWeightedSimilarity(
  baseProperty: Property,
  compareProperty: Property,
  allProperties: Property[]
): number {
  // If comparing the same property, return perfect similarity
  if (baseProperty.id === compareProperty.id) return 1;
  
  // Calculate feature weights based on market analysis
  const weights = calculateMarketBasedWeights(baseProperty, allProperties);
  
  // Calculate similarity with the derived weights
  return calculateSimilarity(baseProperty, compareProperty, weights);
}

/**
 * Identify distinct market segments within a set of properties
 * 
 * @param properties Properties to segment
 * @param maxSegments Maximum number of segments to identify
 * @returns Array of identified market segments
 */
export function identifyMarketSegments(
  properties: Property[],
  maxSegments: number = 5
): MarketSegment[] {
  // Filter properties with values
  const validProperties = properties.filter(p => 
    p.value && !isNaN(parseFloat(p.value || '0'))
  );
  
  if (validProperties.length < 5) {
    // Not enough data for clustering, return a single segment
    return [createSegmentFromProperties(validProperties, 1)];
  }
  
  // Extract features for clustering
  const features = extractSegmentationFeatures(validProperties);
  
  // Determine optimal number of clusters (k)
  const optimalK = determineOptimalClusters(features, Math.min(maxSegments, Math.floor(validProperties.length / 3)));
  
  // Perform k-means clustering
  const kmeans = new KMeans(features, optimalK);
  const clusters = kmeans.clusters;
  
  // Group properties by cluster
  const segmentedProperties: Property[][] = Array(optimalK).fill(0).map(() => []);
  
  clusters.forEach((clusterId, index) => {
    segmentedProperties[clusterId].push(validProperties[index]);
  });
  
  // Create market segments from clusters
  return segmentedProperties
    .map((propsInSegment, i) => createSegmentFromProperties(propsInSegment, i + 1))
    .filter(segment => segment.properties.length > 0); // Filter out empty segments
}

/**
 * Calculate value influence radius for a property
 * 
 * @param property Central property
 * @param allProperties All properties in the market
 * @param maxRadiusKm Maximum radius to consider (kilometers)
 * @returns Influence radius result
 */
export function calculateValueInfluenceRadius(
  property: Property,
  allProperties: Property[],
  maxRadiusKm: number = 5
): InfluenceRadiusResult {
  // Filter properties with coordinates and values
  const validProperties = allProperties.filter(p => 
    p.id !== property.id &&
    p.latitude && p.longitude && 
    property.latitude && property.longitude &&
    p.value && !isNaN(parseFloat(p.value || '0'))
  );
  
  if (!property.latitude || !property.longitude) {
    // Return empty result if property has no coordinates
    return {
      propertyId: property.id,
      radiusKm: 0,
      decayRate: 0,
      influencedProperties: [],
      totalInfluence: 0
    };
  }
  
  // Calculate distance and initial influence for each property
  const propertiesWithDistance = validProperties.map(p => {
    const distanceKm = haversineDistance(
      [property.latitude!, property.longitude!],
      [p.latitude!, p.longitude!]
    );
    
    return { property: p, distanceKm };
  });
  
  // Filter by maximum radius
  const withinRadius = propertiesWithDistance.filter(p => p.distanceKm <= maxRadiusKm);
  
  // If no properties within radius, use a default
  if (withinRadius.length === 0) {
    return {
      propertyId: property.id,
      radiusKm: maxRadiusKm / 2,
      decayRate: 1,
      influencedProperties: [],
      totalInfluence: 0
    };
  }
  
  // Sort by distance
  withinRadius.sort((a, b) => a.distanceKm - b.distanceKm);
  
  // Find the effective radius (distance where influence drops significantly)
  // Using the median distance of the closest 10 properties or fewer
  const medianDistance = withinRadius.length > 0 
    ? withinRadius[Math.min(withinRadius.length - 1, 9)].distanceKm
    : maxRadiusKm / 2;
  
  // Calculate decay rate based on property density
  const decayRate = 1 / medianDistance; // Faster decay in dense areas
  
  // Calculate influence scores with exponential decay
  const influencedProperties: InfluencedProperty[] = withinRadius.map(({ property: p, distanceKm }) => {
    // Exponential decay of influence with distance
    const influenceScore = Math.exp(-decayRate * distanceKm);
    
    return {
      property: p,
      distanceKm,
      influenceScore
    };
  });
  
  // Sort by influence score (descending)
  influencedProperties.sort((a, b) => b.influenceScore - a.influenceScore);
  
  // Calculate total influence
  const totalInfluence = influencedProperties.reduce((sum, p) => sum + p.influenceScore, 0);
  
  return {
    propertyId: property.id,
    radiusKm: medianDistance * 2, // Effective radius is twice the median distance
    decayRate,
    influencedProperties,
    totalInfluence
  };
}

/**
 * Analyze price sensitivity relative to property features
 * 
 * @param properties Properties to analyze
 * @returns Price sensitivity analysis
 */
export function analyzePriceSensitivity(
  properties: Property[]
): PriceSensitivityResult {
  // Filter properties with values
  const validProperties = properties.filter(p => 
    p.value && !isNaN(parseFloat(p.value || '0'))
  );
  
  if (validProperties.length < 5) {
    // Not enough data for analysis
    return {
      factors: [],
      modelFit: 0
    };
  }
  
  // Extract features for analysis
  const featureMatrix: Record<string, number[]> = {
    squareFeet: [],
    yearBuilt: [],
    bedrooms: [],
    bathrooms: [],
    lotSize: []
  };
  
  // Extract values as target
  const values: number[] = [];
  
  // Fill matrices
  validProperties.forEach(property => {
    // Skip if missing core features
    if (!property.squareFeet) return;
    
    values.push(parseFloat(property.value || '0'));
    
    featureMatrix.squareFeet.push(property.squareFeet || 0);
    featureMatrix.yearBuilt.push(property.yearBuilt || 0);
    featureMatrix.bedrooms.push(property.bedrooms || 0);
    featureMatrix.bathrooms.push(property.bathrooms || 0);
    featureMatrix.lotSize.push(property.lotSize || 0);
  });
  
  // Perform regression analysis
  const regressionResults = performMultipleRegression(featureMatrix, values);
  
  // Convert to price factors
  const factors: PriceFactor[] = [];
  
  Object.entries(regressionResults.coefficients).forEach(([feature, coefficient]) => {
    factors.push({
      feature,
      impact: Math.abs(regressionResults.impacts[feature] || 0),
      direction: coefficient >= 0 ? 'positive' : 'negative',
      coefficient
    });
  });
  
  // Sort by impact (descending)
  factors.sort((a, b) => b.impact - a.impact);
  
  return {
    factors,
    modelFit: regressionResults.r2,
    elasticity: regressionResults.elasticity
  };
}

// Helper functions

/**
 * Calculate market-based weights for similarity calculation
 */
function calculateMarketBasedWeights(
  baseProperty: Property,
  allProperties: Property[]
): SimilarityWeights {
  // Initialize with equal weights
  const weights: SimilarityWeights = {
    propertyType: 0.15,
    squareFeet: 0.15,
    yearBuilt: 0.15,
    bedrooms: 0.10,
    bathrooms: 0.10,
    lotSize: 0.10,
    neighborhood: 0.15,
    location: 0.10
  };
  
  // If insufficient data, return default weights
  if (allProperties.length < 10) return weights;
  
  // Filter properties with similar type (if known)
  const similarTypeProperties = baseProperty.propertyType
    ? allProperties.filter(p => p.propertyType === baseProperty.propertyType)
    : allProperties;
  
  if (similarTypeProperties.length < 5) {
    // Not enough data for specific property type
    return weights;
  }
  
  // Calculate feature importance based on correlation with value
  const featureImportance: Record<string, number> = {};
  const priceCorrelations: Record<string, number> = {};
  
  // Extract properties with values
  const propertiesWithValues = similarTypeProperties.filter(p => 
    p.value && !isNaN(parseFloat(p.value || '0'))
  );
  
  if (propertiesWithValues.length < 5) {
    return weights;
  }
  
  // Extract values
  const values = propertiesWithValues.map(p => parseFloat(p.value || '0'));
  
  // Calculate correlation for numeric features
  const numericFeatures = ['squareFeet', 'yearBuilt', 'bedrooms', 'bathrooms', 'lotSize'];
  
  numericFeatures.forEach(feature => {
    const featureValues = propertiesWithValues.map(p => p[feature as keyof Property] as number || 0);
    
    // Skip if not enough non-zero values
    if (featureValues.filter(v => v > 0).length < 5) {
      priceCorrelations[feature] = 0;
      return;
    }
    
    // Calculate correlation coefficient
    try {
      const correlation = Math.abs(ss.sampleCorrelation(featureValues, values));
      priceCorrelations[feature] = isNaN(correlation) ? 0 : correlation;
    } catch (e) {
      priceCorrelations[feature] = 0;
    }
  });
  
  // Calculate importance of location
  if (baseProperty.latitude && baseProperty.longitude) {
    // Extract properties with coordinates and values
    const propertiesWithCoords = propertiesWithValues.filter(p => 
      p.latitude && p.longitude
    );
    
    if (propertiesWithCoords.length >= 5) {
      // Calculate distances
      const distances = propertiesWithCoords.map(p => 
        haversineDistance(
          [baseProperty.latitude!, baseProperty.longitude!],
          [p.latitude!, p.longitude!]
        )
      );
      
      // Calculate correlation between distance and value
      try {
        const invDistances = distances.map(d => 1 / (d + 0.1)); // Inverse distance
        const locationCorrelation = Math.abs(ss.sampleCorrelation(invDistances, 
          propertiesWithCoords.map(p => parseFloat(p.value || '0'))
        ));
        
        priceCorrelations.location = isNaN(locationCorrelation) ? 0.1 : locationCorrelation;
      } catch (e) {
        priceCorrelations.location = 0.1;
      }
    } else {
      priceCorrelations.location = 0.1;
    }
  } else {
    priceCorrelations.location = 0.1;
  }
  
  // Calculate categorical feature importance (neighborhood, property type)
  const neighborhoodImportance = calculateCategoricalImportance(
    propertiesWithValues, 
    'neighborhood',
    values
  );
  
  priceCorrelations.neighborhood = neighborhoodImportance;
  priceCorrelations.propertyType = calculateCategoricalImportance(
    propertiesWithValues, 
    'propertyType',
    values
  );
  
  // Normalize correlations to sum to 1
  const totalCorrelation = Object.values(priceCorrelations).reduce((sum, val) => sum + val, 0);
  
  if (totalCorrelation > 0) {
    Object.keys(priceCorrelations).forEach(feature => {
      // Convert correlation to weight (minimum 0.05 per feature)
      weights[feature as keyof SimilarityWeights] = 
        0.05 + 0.95 * (priceCorrelations[feature] / totalCorrelation);
    });
  }
  
  return weights;
}

/**
 * Calculate the importance of a categorical feature
 */
function calculateCategoricalImportance(
  properties: Property[],
  featureName: 'neighborhood' | 'propertyType',
  values: number[]
): number {
  // Group by category
  const categories = new Set<string>();
  properties.forEach(p => {
    if (p[featureName]) categories.add(p[featureName] as string);
  });
  
  if (categories.size <= 1) return 0.1; // Not enough categories
  
  // Calculate average value by category
  const categoryValues: Record<string, number[]> = {};
  properties.forEach((p, i) => {
    const category = p[featureName] as string;
    if (!category) return;
    
    if (!categoryValues[category]) categoryValues[category] = [];
    categoryValues[category].push(values[i]);
  });
  
  // Calculate variance between category means
  const categoryMeans = Object.entries(categoryValues)
    .filter(([_, vals]) => vals.length >= 3) // Need at least 3 properties per category
    .map(([_, vals]) => ss.mean(vals));
  
  if (categoryMeans.length <= 1) return 0.1;
  
  // Calculate variance ratio (between category variance / overall variance)
  const overallVariance = ss.variance(values);
  const betweenCategoryVariance = ss.variance(categoryMeans);
  
  if (overallVariance === 0) return 0.1;
  
  const varianceRatio = betweenCategoryVariance / overallVariance;
  
  // Return bounded importance score
  return Math.min(0.8, Math.max(0.1, varianceRatio));
}

/**
 * Extract features for segmentation
 */
function extractSegmentationFeatures(properties: Property[]): number[][] {
  return properties.map(property => {
    const value = parseFloat(property.value || '0');
    const squareFeet = property.squareFeet || 0;
    const yearBuilt = property.yearBuilt || 0;
    const bedrooms = property.bedrooms || 0;
    const bathrooms = property.bathrooms || 0;
    
    // Normalize values for clustering
    return [
      value / 500000, // Normalize value
      squareFeet / 2000, // Normalize square feet
      (yearBuilt > 0 ? (yearBuilt - 1950) / 70 : 0), // Normalize year
      bedrooms / 3, // Normalize bedrooms
      bathrooms / 2 // Normalize bathrooms
    ];
  });
}

/**
 * Determine optimal number of clusters using the Elbow method
 */
function determineOptimalClusters(features: number[][], maxClusters: number): number {
  // Calculate inertia (within-cluster sum of squares) for different k values
  const inertias: number[] = [];
  
  for (let k = 1; k <= maxClusters; k++) {
    const kmeans = new KMeans(features, k);
    inertias.push(calculateInertia(features, kmeans.clusters, kmeans.centroids));
  }
  
  // Use the elbow method to find optimal k
  const optimalK = findElbowPoint(inertias);
  
  return Math.max(2, Math.min(maxClusters, optimalK)); // Ensure at least 2 clusters
}

/**
 * Calculate inertia (within-cluster sum of squares)
 */
function calculateInertia(
  features: number[][],
  clusters: number[],
  centroids: number[][]
): number {
  let inertia = 0;
  
  features.forEach((feature, i) => {
    const centroid = centroids[clusters[i]];
    inertia += feature.reduce((sum, val, j) => sum + Math.pow(val - centroid[j], 2), 0);
  });
  
  return inertia;
}

/**
 * Find the elbow point in the inertia curve
 */
function findElbowPoint(inertias: number[]): number {
  if (inertias.length <= 2) return inertias.length;
  
  // If curve is relatively flat, return 3 clusters
  if (Math.abs(inertias[0] - inertias[inertias.length - 1]) < inertias[0] * 0.3) {
    return 3;
  }
  
  // Calculate second derivative to find the elbow point
  const derivatives: number[] = [];
  for (let i = 0; i < inertias.length - 1; i++) {
    derivatives.push(inertias[i] - inertias[i + 1]);
  }
  
  const secondDerivatives: number[] = [];
  for (let i = 0; i < derivatives.length - 1; i++) {
    secondDerivatives.push(derivatives[i] - derivatives[i + 1]);
  }
  
  // Find the point with the maximum second derivative
  let maxIndex = 0;
  let maxValue = secondDerivatives[0];
  
  for (let i = 1; i < secondDerivatives.length; i++) {
    if (secondDerivatives[i] > maxValue) {
      maxValue = secondDerivatives[i];
      maxIndex = i;
    }
  }
  
  // Add 2 because: 1 for zero-indexed, 1 for the derivative calculation
  return maxIndex + 2;
}

/**
 * Create a market segment from a group of properties
 */
function createSegmentFromProperties(
  properties: Property[],
  segmentId: number
): MarketSegment {
  // If no properties, return empty segment
  if (properties.length === 0) {
    return {
      id: segmentId,
      name: `Segment ${segmentId}`,
      properties: [],
      averageValue: 0,
      medianValue: 0,
      priceRange: [0, 0],
      averageSquareFeet: 0
    };
  }
  
  // Calculate value statistics
  const values = properties
    .map(p => parseFloat(p.value || '0'))
    .filter(v => v > 0);
  
  const averageValue = values.length > 0 ? ss.mean(values) : 0;
  const medianValue = values.length > 0 ? ss.median(values) : 0;
  const priceRange: [number, number] = values.length > 0 ? 
    [Math.min(...values), Math.max(...values)] : [0, 0];
  
  // Calculate square feet average
  const squareFeet = properties
    .map(p => p.squareFeet || 0)
    .filter(s => s > 0);
  
  const averageSquareFeet = squareFeet.length > 0 ? ss.mean(squareFeet) : 0;
  
  // Find dominant property type
  const propertyTypeCounts: Record<string, number> = {};
  properties.forEach(p => {
    if (!p.propertyType) return;
    propertyTypeCounts[p.propertyType] = (propertyTypeCounts[p.propertyType] || 0) + 1;
  });
  
  let dominantPropertyType: string | undefined;
  let maxCount = 0;
  
  Object.entries(propertyTypeCounts).forEach(([type, count]) => {
    if (count > maxCount) {
      maxCount = count;
      dominantPropertyType = type;
    }
  });
  
  // Find dominant neighborhood
  const neighborhoodCounts: Record<string, number> = {};
  properties.forEach(p => {
    if (!p.neighborhood) return;
    neighborhoodCounts[p.neighborhood] = (neighborhoodCounts[p.neighborhood] || 0) + 1;
  });
  
  let dominantNeighborhood: string | undefined;
  maxCount = 0;
  
  Object.entries(neighborhoodCounts).forEach(([neighborhood, count]) => {
    if (count > maxCount) {
      maxCount = count;
      dominantNeighborhood = neighborhood;
    }
  });
  
  // Generate segment name
  let name = `Segment ${segmentId}`;
  
  if (dominantPropertyType && dominantNeighborhood) {
    name = `${dominantNeighborhood} ${dominantPropertyType}`;
  } else if (dominantPropertyType) {
    name = dominantPropertyType;
  } else if (dominantNeighborhood) {
    name = dominantNeighborhood;
  }
  
  // Add price qualifier
  if (averageValue > 0) {
    if (averageValue > 750000) {
      name = `Premium ${name}`;
    } else if (averageValue < 300000) {
      name = `Affordable ${name}`;
    } else {
      name = `Mid-range ${name}`;
    }
  }
  
  return {
    id: segmentId,
    name,
    properties,
    averageValue,
    medianValue,
    priceRange,
    dominantPropertyType,
    dominantNeighborhood,
    averageSquareFeet
  };
}

/**
 * Perform multiple regression analysis
 */
function performMultipleRegression(
  featureMatrix: Record<string, number[]>,
  values: number[]
): {
  coefficients: Record<string, number>;
  intercept: number;
  r2: number;
  impacts: Record<string, number>;
  elasticity: Record<string, number>;
} {
  // Check if there's enough data
  const numSamples = values.length;
  if (numSamples < 5) {
    return {
      coefficients: {},
      intercept: 0,
      r2: 0,
      impacts: {},
      elasticity: {}
    };
  }
  
  // Filter out features with insufficient data
  const validFeatures = Object.entries(featureMatrix)
    .filter(([_, values]) => {
      // Feature must have at least 5 non-zero values
      return values.filter(v => v > 0).length >= 5;
    })
    .map(([feature, _]) => feature);
  
  if (validFeatures.length === 0) {
    return {
      coefficients: {},
      intercept: 0,
      r2: 0,
      impacts: {},
      elasticity: {}
    };
  }
  
  // Prepare data for regression
  const X = Array(numSamples).fill(0).map(() => [1]); // Add intercept column
  
  validFeatures.forEach(feature => {
    const featureValues = featureMatrix[feature];
    for (let i = 0; i < numSamples; i++) {
      X[i].push(featureValues[i]);
    }
  });
  
  // Perform regression using normal equations: β = (X'X)^(-1)X'y
  try {
    // Calculate X'X (transpose of X multiplied by X)
    const XtX = Array(validFeatures.length + 1).fill(0).map(() => Array(validFeatures.length + 1).fill(0));
    
    for (let i = 0; i < validFeatures.length + 1; i++) {
      for (let j = 0; j < validFeatures.length + 1; j++) {
        for (let k = 0; k < numSamples; k++) {
          XtX[i][j] += X[k][i] * X[k][j];
        }
      }
    }
    
    // Calculate X'y
    const Xty = Array(validFeatures.length + 1).fill(0);
    
    for (let i = 0; i < validFeatures.length + 1; i++) {
      for (let k = 0; k < numSamples; k++) {
        Xty[i] += X[k][i] * values[k];
      }
    }
    
    // Solve system of equations using simple-statistics
    const beta = ss.linearRegression(
      X.map((row, i) => ({
        x: row.slice(1),
        y: values[i]
      }))
    );
    
    // Extract coefficients
    const coefficients: Record<string, number> = {};
    validFeatures.forEach((feature, i) => {
      coefficients[feature] = beta.m[i];
    });
    
    // Make predictions
    const predictions = X.map(row => {
      let prediction = beta.b; // intercept
      for (let i = 0; i < validFeatures.length; i++) {
        prediction += row[i + 1] * beta.m[i];
      }
      return prediction;
    });
    
    // Calculate R-squared
    const meanValue = ss.mean(values);
    const totalSS = ss.sum(values.map(y => Math.pow(y - meanValue, 2)));
    const residualSS = ss.sum(predictions.map((pred, i) => Math.pow(pred - values[i], 2)));
    const r2 = Math.max(0, Math.min(1, 1 - (residualSS / totalSS)));
    
    // Calculate feature impacts
    const impacts: Record<string, number> = {};
    const elasticity: Record<string, number> = {};
    
    validFeatures.forEach((feature, i) => {
      // Impact = |coefficient * std(feature) / std(value)|
      const featureStd = ss.standardDeviation(featureMatrix[feature]);
      const valueStd = ss.standardDeviation(values);
      
      impacts[feature] = Math.abs(beta.m[i] * featureStd / valueStd);
      
      // Elasticity = (Δprice / price) / (Δfeature / feature)
      const featureMean = ss.mean(featureMatrix[feature].filter(v => v > 0));
      if (featureMean > 0) {
        elasticity[feature] = beta.m[i] * (featureMean / meanValue);
      } else {
        elasticity[feature] = 0;
      }
    });
    
    // Normalize impacts to sum to 1
    const totalImpact = Object.values(impacts).reduce((sum, val) => sum + val, 0);
    
    if (totalImpact > 0) {
      validFeatures.forEach(feature => {
        impacts[feature] = impacts[feature] / totalImpact;
      });
    }
    
    return {
      coefficients,
      intercept: beta.b,
      r2,
      impacts,
      elasticity
    };
    
  } catch (e) {
    console.error("Regression calculation error:", e);
    return {
      coefficients: {},
      intercept: 0,
      r2: 0,
      impacts: {},
      elasticity: {}
    };
  }
}