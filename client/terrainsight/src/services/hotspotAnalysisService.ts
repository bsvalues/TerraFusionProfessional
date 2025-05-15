import { Property } from '@shared/schema';

/**
 * Result of the Getis-Ord Gi* statistic calculation for a property
 */
export interface GiStatisticResult {
  /** ID of the property */
  propertyId: number;
  /** Z-score from the Gi* calculation */
  zScore: number;
  /** P-value corresponding to the z-score */
  pValue: number;
}

/**
 * Result of hotspot identification for a property
 */
export interface HotspotResult {
  /** ID of the property */
  propertyId: number;
  /** Type of hotspot: hot (high values), cold (low values), or not significant */
  type: 'hot' | 'cold' | 'not-significant';
  /** Confidence level of the hotspot (90%, 95%, 99%) */
  confidence: string;
  /** Z-score from the Gi* calculation */
  zScore: number;
  /** P-value corresponding to the z-score */
  pValue: number;
}

/**
 * Service for analyzing property data to identify statistically significant
 * spatial clusters of high values (hot spots) and low values (cold spots)
 * using the Getis-Ord Gi* statistic.
 */
export class HotspotAnalysis {
  private properties: Property[];
  private validProperties: Property[];
  
  constructor(properties: Property[]) {
    this.properties = properties;
    // Filter out properties without coordinates
    this.validProperties = properties.filter(
      p => p.latitude !== undefined && p.longitude !== undefined
    );
  }
  
  /**
   * Calculates the distance between two geographic points using the Haversine formula
   * @param lat1 Latitude of the first point
   * @param lng1 Longitude of the first point
   * @param lat2 Latitude of the second point
   * @param lng2 Longitude of the second point
   * @returns Distance in kilometers
   */
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth radius in kilometers
    const dLat = this.degToRad(lat2 - lat1);
    const dLng = this.degToRad(lng2 - lng1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.degToRad(lat1)) * Math.cos(this.degToRad(lat2)) * 
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
  
  /**
   * Converts degrees to radians
   */
  private degToRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
  
  /**
   * Generates a distance-based spatial weight matrix for the properties
   * Each cell represents the spatial weight between two properties,
   * where closer properties have higher weights
   * @returns A matrix of weights
   */
  public generateDistanceWeightMatrix(): number[][] {
    const n = this.validProperties.length;
    const weightMatrix: number[][] = Array(n).fill(0).map(() => Array(n).fill(0));
    
    // Calculate distances between all properties
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i === j) {
          // No self-influence
          weightMatrix[i][j] = 0;
        } else {
          const prop1 = this.validProperties[i];
          const prop2 = this.validProperties[j];
          
          const distance = this.calculateDistance(
            Number(prop1.latitude),
            Number(prop1.longitude),
            Number(prop2.latitude),
            Number(prop2.longitude)
          );
          
          // Use inverse distance weighting with a threshold
          const MAX_INFLUENCE_DISTANCE = 2; // km
          if (distance <= MAX_INFLUENCE_DISTANCE) {
            // Inverse distance weight: closer properties have more influence
            weightMatrix[i][j] = 1 / Math.max(distance, 0.1);
          } else {
            // Properties beyond the threshold have no influence
            weightMatrix[i][j] = 0;
          }
        }
      }
    }
    
    return weightMatrix;
  }
  
  /**
   * Converts a property value to a numeric value for analysis
   * @param property The property to get the value from
   * @returns The numeric value
   */
  private getPropertyValue(property: Property): number {
    if (!property.value) return 0;
    
    // Convert from string (e.g., "$200,000") to number
    return parseFloat(property.value.replace(/[^0-9.-]+/g, ''));
  }
  
  /**
   * Calculates the Getis-Ord Gi* statistic for each property
   * This identifies spatial clusters of high or low values
   * @returns Array of results with z-scores and p-values
   */
  public calculateGiStatistics(): GiStatisticResult[] {
    if (this.validProperties.length < 2) {
      // Need at least two properties for meaningful analysis
      return this.validProperties.map(p => ({
        propertyId: p.id as number,
        zScore: 0,
        pValue: 1
      }));
    }
    
    // Get property values
    const values = this.validProperties.map(p => this.getPropertyValue(p));
    
    // Calculate global mean and standard deviation
    const sum = values.reduce((acc, val) => acc + val, 0);
    const mean = sum / values.length;
    
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    const sumSquaredDiffs = squaredDiffs.reduce((acc, val) => acc + val, 0);
    const variance = sumSquaredDiffs / values.length;
    const stdDev = Math.sqrt(variance);
    
    // Get weight matrix
    const weights = this.generateDistanceWeightMatrix();
    
    // Calculate Gi* statistic for each property
    const results: GiStatisticResult[] = [];
    
    for (let i = 0; i < this.validProperties.length; i++) {
      const property = this.validProperties[i];
      
      // Sum of weighted values
      let weightedSum = 0;
      // Sum of weights
      let weightSum = 0;
      
      for (let j = 0; j < this.validProperties.length; j++) {
        weightedSum += weights[i][j] * values[j];
        weightSum += weights[i][j];
      }
      
      // Sum of squared weights
      const squaredWeightSum = weights[i].reduce((acc, w) => acc + w * w, 0);
      
      // Gi* statistic calculation
      const numerator = weightedSum - mean * weightSum;
      
      const S = Math.sqrt(
        (sumSquaredDiffs / values.length) - 
        (mean * mean)
      );
      
      const denominator = S * Math.sqrt(
        ((values.length * squaredWeightSum) - (weightSum * weightSum)) / 
        (values.length - 1)
      );
      
      // z-score is the standardized Gi* statistic
      const zScore = denominator !== 0 ? numerator / denominator : 0;
      
      // Convert z-score to p-value using normal distribution
      const pValue = this.zScoreToPValue(zScore);
      
      results.push({
        propertyId: property.id as number,
        zScore,
        pValue
      });
    }
    
    return results;
  }
  
  /**
   * Converts a z-score to a p-value using the normal distribution
   * @param z The z-score
   * @returns The two-tailed p-value
   */
  private zScoreToPValue(z: number): number {
    // This is an approximation for the normal CDF
    const absZ = Math.abs(z);
    
    // For |z| > 6, p-value is essentially 0
    if (absZ > 6) return 0;
    
    // Calculate one-tailed p-value
    let p = 0.5;
    
    if (absZ > 0) {
      // Using polynomial approximation
      const b1 = 0.319381530;
      const b2 = -0.356563782;
      const b3 = 1.781477937;
      const b4 = -1.821255978;
      const b5 = 1.330274429;
      const t = 1.0 / (1.0 + 0.2316419 * absZ);
      p = 0.5 - 0.5 * (
        b1 * t +
        b2 * t * t +
        b3 * t * t * t +
        b4 * t * t * t * t +
        b5 * t * t * t * t * t
      ) / Math.sqrt(2 * Math.PI) * Math.exp(-0.5 * absZ * absZ);
    }
    
    // Convert to two-tailed p-value
    return p * 2;
  }
  
  /**
   * Identifies hotspots and coldspots with confidence levels
   * @returns Array of hotspot results
   */
  public identifyHotspots(): HotspotResult[] {
    const giResults = this.calculateGiStatistics();
    
    return giResults.map(result => {
      const { propertyId, zScore, pValue } = result;
      
      // Determine hotspot type based on z-score
      let type: 'hot' | 'cold' | 'not-significant' = 'not-significant';
      
      if (zScore > 0 && pValue <= 0.1) {
        type = 'hot'; // High values cluster
      } else if (zScore < 0 && pValue <= 0.1) {
        type = 'cold'; // Low values cluster
      }
      
      // Determine confidence level
      let confidence = '0';
      
      if (pValue <= 0.01) {
        confidence = '0.99'; // 99% confidence
      } else if (pValue <= 0.05) {
        confidence = '0.95'; // 95% confidence
      } else if (pValue <= 0.1) {
        confidence = '0.90'; // 90% confidence
      }
      
      return {
        propertyId,
        type,
        confidence,
        zScore,
        pValue
      };
    });
  }
}