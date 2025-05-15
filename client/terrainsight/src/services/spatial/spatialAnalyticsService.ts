import { Property } from '@shared/schema';
import { haversineDistance } from '../../lib/utils';
import * as ss from 'simple-statistics';

/**
 * Spatial Analytics Service
 * Provides advanced spatial analysis of property data
 */

export interface SpatialAutocorrelationResult {
  moransI: number;
  pValue: number;
  zScore: number;
  highValueClusters: Property[];
  lowValueClusters: Property[];
  randomProperties: Property[];
}

export interface HeatmapPoint {
  lat: number;
  lng: number;
  intensity: number;
}

export interface Heatmap {
  points: HeatmapPoint[];
  minValue: number;
  maxValue: number;
  bounds: [number, number, number, number]; // [minLat, minLng, maxLat, maxLng]
}

export interface PointOfInterest {
  id: number;
  name: string;
  type: string;
  latitude: number;
  longitude: number;
  rating?: number;
}

export interface LocationFactor {
  type: string;
  name: string;
  distanceKm: number;
  impact: number;
}

export interface LocationScoreResult {
  propertyId: number | string;
  totalScore: number;
  factors: LocationFactor[];
  ranking?: number; // Rank compared to other properties
}

export interface SpatialOutlier {
  property: Property;
  zScore: number;
  outlierType: 'high' | 'low'; // High value or low value outlier
  neighborhoodAverage: number;
  percentDifference: number;
}

/**
 * Calculate spatial autocorrelation of property values
 * 
 * @param properties Properties with location and value data
 * @returns Spatial autocorrelation analysis
 */
export function calculateSpatialAutocorrelation(
  properties: Property[]
): SpatialAutocorrelationResult {
  // Filter properties with coordinates and values
  const validProperties = properties.filter(p => 
    p.latitude && p.longitude &&
    p.value && !isNaN(parseFloat(p.value || '0'))
  );
  
  if (validProperties.length < 5) {
    // Not enough data for spatial autocorrelation
    return {
      moransI: 0,
      pValue: 1,
      zScore: 0,
      highValueClusters: [],
      lowValueClusters: [],
      randomProperties: validProperties
    };
  }
  
  // Extract values and coordinates
  const values = validProperties.map(p => parseFloat(p.value || '0'));
  const coordinates = validProperties.map(p => [p.latitude!, p.longitude!] as [number, number]);
  
  // Calculate spatial weights matrix
  const weights = calculateSpatialWeights(coordinates);
  
  // Calculate Moran's I
  const result = calculateMoransI(values, weights);
  
  // Identify clusters based on local indicators of spatial association (LISA)
  const lisaResults = calculateLISA(values, weights);
  
  // Classify properties
  const highValueClusters: Property[] = [];
  const lowValueClusters: Property[] = [];
  const randomProperties: Property[] = [];
  
  validProperties.forEach((property, i) => {
    if (lisaResults.highValueClusters.includes(i)) {
      highValueClusters.push(property);
    } else if (lisaResults.lowValueClusters.includes(i)) {
      lowValueClusters.push(property);
    } else {
      randomProperties.push(property);
    }
  });
  
  return {
    moransI: result.moransI,
    pValue: result.pValue,
    zScore: result.zScore,
    highValueClusters,
    lowValueClusters,
    randomProperties
  };
}

/**
 * Generate a heatmap of property values
 * 
 * @param properties Properties with location and value data
 * @param gridSize Size of grid cells in degrees (default: 0.002, ~200m)
 * @returns Heatmap data
 */
export function generateValueHeatmap(
  properties: Property[],
  gridSize: number = 0.002
): Heatmap {
  // Filter properties with coordinates and values
  const validProperties = properties.filter(p => 
    p.latitude && p.longitude &&
    p.value && !isNaN(parseFloat(p.value || '0'))
  );
  
  if (validProperties.length === 0) {
    return {
      points: [],
      minValue: 0,
      maxValue: 0,
      bounds: [0, 0, 0, 0]
    };
  }
  
  // Extract coordinates and values
  const coordinates = validProperties.map(p => ({
    lat: p.latitude!,
    lng: p.longitude!,
    value: parseFloat(p.value || '0')
  }));
  
  // Find bounds
  let minLat = coordinates[0].lat;
  let maxLat = coordinates[0].lat;
  let minLng = coordinates[0].lng;
  let maxLng = coordinates[0].lng;
  
  coordinates.forEach(coord => {
    minLat = Math.min(minLat, coord.lat);
    maxLat = Math.max(maxLat, coord.lat);
    minLng = Math.min(minLng, coord.lng);
    maxLng = Math.max(maxLng, coord.lng);
  });
  
  // Add padding to bounds
  const padding = gridSize * 2;
  minLat -= padding;
  maxLat += padding;
  minLng -= padding;
  maxLng += padding;
  
  // Create grid
  const latSteps = Math.ceil((maxLat - minLat) / gridSize);
  const lngSteps = Math.ceil((maxLng - minLng) / gridSize);
  
  // Initialize grid cells
  const gridValues: Record<string, { sum: number, count: number }> = {};
  
  // Assign properties to grid cells
  coordinates.forEach(coord => {
    const latIdx = Math.floor((coord.lat - minLat) / gridSize);
    const lngIdx = Math.floor((coord.lng - minLng) / gridSize);
    const key = `${latIdx},${lngIdx}`;
    
    if (!gridValues[key]) {
      gridValues[key] = { sum: 0, count: 0 };
    }
    
    gridValues[key].sum += coord.value;
    gridValues[key].count += 1;
  });
  
  // Calculate average values for cells
  const heatmapPoints: HeatmapPoint[] = [];
  let minValue = Infinity;
  let maxValue = -Infinity;
  
  Object.entries(gridValues).forEach(([key, { sum, count }]) => {
    const [latIdx, lngIdx] = key.split(',').map(Number);
    const avgValue = sum / count;
    
    const lat = minLat + (latIdx + 0.5) * gridSize;
    const lng = minLng + (lngIdx + 0.5) * gridSize;
    
    minValue = Math.min(minValue, avgValue);
    maxValue = Math.max(maxValue, avgValue);
    
    heatmapPoints.push({
      lat,
      lng,
      intensity: avgValue
    });
  });
  
  // Normalize intensities to 0-1 range
  if (minValue !== maxValue) {
    const range = maxValue - minValue;
    heatmapPoints.forEach(point => {
      point.intensity = (point.intensity - minValue) / range;
    });
  } else {
    heatmapPoints.forEach(point => {
      point.intensity = 0.5;
    });
  }
  
  return {
    points: heatmapPoints,
    minValue,
    maxValue,
    bounds: [minLat, minLng, maxLat, maxLng]
  };
}

/**
 * Calculate location score for properties
 * 
 * @param properties Properties to score
 * @param pois Points of interest
 * @returns Location scores for properties
 */
export function calculateLocationScore(
  properties: Property[],
  pois: PointOfInterest[]
): LocationScoreResult[] {
  // Filter properties with coordinates
  const validProperties = properties.filter(p => p.latitude && p.longitude);
  
  if (validProperties.length === 0 || pois.length === 0) {
    return [];
  }
  
  // Define POI type weights
  const poiTypeWeights: Record<string, number> = {
    'school': 0.25,
    'park': 0.15,
    'retail': 0.15,
    'healthcare': 0.20,
    'transport': 0.15,
    'restaurant': 0.10
  };
  
  // Calculate scores for each property
  const scores = validProperties.map(property => {
    const factors: LocationFactor[] = [];
    let totalScore = 0;
    
    // Find relevant POIs for each property
    pois.forEach(poi => {
      // Calculate distance to POI
      const distanceKm = haversineDistance(
        [property.latitude!, property.longitude!],
        [poi.latitude, poi.longitude]
      );
      
      // Skip if too far away
      if (distanceKm > 5) return;
      
      // Calculate impact score based on distance and POI type
      const typeWeight = poiTypeWeights[poi.type] || 0.1;
      
      // Distance decay function (closer is better)
      const distanceImpact = Math.exp(-distanceKm / 1.5); // 1.5km decay factor
      
      // Rating impact (if available)
      const ratingImpact = poi.rating ? (poi.rating / 5) : 0.8;
      
      // Calculate total impact for this POI
      const impact = typeWeight * distanceImpact * ratingImpact;
      
      // Add to factors if significant
      if (impact > 0.01) {
        factors.push({
          type: poi.type,
          name: poi.name,
          distanceKm,
          impact
        });
        
        totalScore += impact;
      }
    });
    
    // Sort factors by impact
    factors.sort((a, b) => b.impact - a.impact);
    
    // Normalize total score to 0-100 range
    const normalizedScore = Math.min(100, totalScore * 100);
    
    return {
      propertyId: property.id,
      totalScore: normalizedScore,
      factors: factors.slice(0, 5) // Top 5 factors
    };
  });
  
  // Add rankings
  scores.sort((a, b) => b.totalScore - a.totalScore);
  scores.forEach((score, i) => {
    score.ranking = i + 1;
  });
  
  return scores;
}

/**
 * Identify spatial outliers (properties with values significantly different from neighbors)
 * 
 * @param properties Properties to analyze
 * @param distanceThresholdKm Maximum distance to consider for neighbors
 * @returns Spatial outliers
 */
export function identifySpatialOutliers(
  properties: Property[],
  distanceThresholdKm: number = 1
): SpatialOutlier[] {
  // Filter properties with coordinates and values
  const validProperties = properties.filter(p => 
    p.latitude && p.longitude &&
    p.value && !isNaN(parseFloat(p.value || '0'))
  );
  
  if (validProperties.length < 5) {
    return [];
  }
  
  const outliers: SpatialOutlier[] = [];
  
  // For each property, compare to its neighbors
  validProperties.forEach(property => {
    // Find neighbors within distance threshold
    const neighbors = validProperties.filter(p => 
      p.id !== property.id &&
      haversineDistance(
        [property.latitude!, property.longitude!],
        [p.latitude!, p.longitude!]
      ) <= distanceThresholdKm
    );
    
    // Skip if not enough neighbors
    if (neighbors.length < 3) return;
    
    // Calculate average neighbor value
    const neighborValues = neighbors.map(p => parseFloat(p.value || '0'));
    const neighborAvg = ss.mean(neighborValues);
    const neighborStdDev = ss.standardDeviation(neighborValues);
    
    // Calculate z-score for this property
    const propertyValue = parseFloat(property.value || '0');
    const zScore = (propertyValue - neighborAvg) / (neighborStdDev || 1);
    
    // Calculate percent difference
    const percentDifference = ((propertyValue - neighborAvg) / neighborAvg) * 100;
    
    // Identify as outlier if z-score exceeds threshold
    if (Math.abs(zScore) >= 2) {
      outliers.push({
        property,
        zScore,
        outlierType: zScore > 0 ? 'high' : 'low',
        neighborhoodAverage: neighborAvg,
        percentDifference
      });
    }
  });
  
  // Sort by absolute z-score (descending)
  return outliers.sort((a, b) => Math.abs(b.zScore) - Math.abs(a.zScore));
}

// Helper functions

/**
 * Calculate spatial weights matrix
 */
function calculateSpatialWeights(
  coordinates: [number, number][]
): number[][] {
  const n = coordinates.length;
  const weights = Array(n).fill(0).map(() => Array(n).fill(0));
  
  // Calculate distances between all pairs
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const distance = haversineDistance(coordinates[i], coordinates[j]);
      
      // Use inverse distance for weights
      if (distance > 0 && distance <= 3) { // 3km threshold
        const weight = 1 / distance;
        weights[i][j] = weight;
        weights[j][i] = weight;
      }
    }
  }
  
  // Row-standardize weights
  for (let i = 0; i < n; i++) {
    const rowSum = weights[i].reduce((sum, w) => sum + w, 0);
    if (rowSum > 0) {
      for (let j = 0; j < n; j++) {
        weights[i][j] /= rowSum;
      }
    }
  }
  
  return weights;
}

/**
 * Calculate Moran's I spatial autocorrelation statistic
 */
function calculateMoransI(
  values: number[],
  weights: number[][]
): { moransI: number; expectedI: number; variance: number; zScore: number; pValue: number } {
  const n = values.length;
  
  // Calculate mean
  const mean = ss.mean(values);
  
  // Calculate centered values
  const centeredValues = values.map(v => v - mean);
  
  // Calculate sum of squared deviations
  const sumSquared = centeredValues.reduce((sum, v) => sum + v * v, 0);
  
  // Calculate spatial lag
  let numerator = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (weights[i][j] > 0) {
        numerator += weights[i][j] * centeredValues[i] * centeredValues[j];
      }
    }
  }
  
  // Calculate sum of all weights
  let sumWeights = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      sumWeights += weights[i][j];
    }
  }
  
  // Calculate Moran's I
  const moransI = (n / sumWeights) * (numerator / sumSquared);
  
  // Calculate expected value under randomization
  const expectedI = -1 / (n - 1);
  
  // Simplified variance calculation
  const variance = 1 / (n * (n - 1));
  
  // Calculate z-score and p-value
  const zScore = (moransI - expectedI) / Math.sqrt(variance);
  const pValue = calculatePValue(zScore);
  
  return {
    moransI,
    expectedI,
    variance,
    zScore,
    pValue
  };
}

/**
 * Calculate Local Indicators of Spatial Association (LISA)
 */
function calculateLISA(
  values: number[],
  weights: number[][]
): { highValueClusters: number[]; lowValueClusters: number[] } {
  const n = values.length;
  const mean = ss.mean(values);
  const stdDev = ss.standardDeviation(values);
  
  // Standardize values
  const stdValues = values.map(v => (v - mean) / stdDev);
  
  // Calculate local Moran's I for each location
  const localI: number[] = [];
  
  for (let i = 0; i < n; i++) {
    let sum = 0;
    for (let j = 0; j < n; j++) {
      if (i !== j && weights[i][j] > 0) {
        sum += weights[i][j] * stdValues[j];
      }
    }
    localI.push(stdValues[i] * sum);
  }
  
  // Identify high-value and low-value clusters
  const highValueClusters: number[] = [];
  const lowValueClusters: number[] = [];
  
  for (let i = 0; i < n; i++) {
    if (localI[i] > 0) {
      // Positive local I indicates spatial clustering
      if (stdValues[i] > 0) {
        // High value surrounded by high values
        highValueClusters.push(i);
      } else {
        // Low value surrounded by low values
        lowValueClusters.push(i);
      }
    }
  }
  
  return {
    highValueClusters,
    lowValueClusters
  };
}

/**
 * Calculate p-value from z-score using normal distribution
 */
function calculatePValue(zScore: number): number {
  // Simplified p-value calculation
  const absZ = Math.abs(zScore);
  if (absZ > 2.576) return 0.01;
  if (absZ > 1.96) return 0.05;
  if (absZ > 1.645) return 0.1;
  return 0.5;
}