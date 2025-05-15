import { Property } from '@/shared/schema';
import { 
  detectOutliers, 
  generateOutlierExplanation,
  OutlierDetectionResult 
} from '../services/outlierDetectionService';

// Mock property data with some obvious outliers
const mockProperties: Property[] = [
  // Normal properties in Downtown neighborhood
  {
    id: 1,
    parcelId: "D001",
    address: "101 Main St",
    latitude: 40.7128,
    longitude: -74.006,
    value: "500000",
    neighborhood: "Downtown",
    propertyType: "Residential",
    squareFeet: 1800,
    yearBuilt: 2000,
    bedrooms: 3,
    bathrooms: 2
  },
  {
    id: 2,
    parcelId: "D002",
    address: "102 Main St",
    latitude: 40.7129,
    longitude: -74.0061,
    value: "525000",
    neighborhood: "Downtown",
    propertyType: "Residential",
    squareFeet: 1850,
    yearBuilt: 2002,
    bedrooms: 3,
    bathrooms: 2
  },
  {
    id: 3,
    parcelId: "D003",
    address: "103 Main St",
    latitude: 40.713,
    longitude: -74.0062,
    value: "510000",
    neighborhood: "Downtown",
    propertyType: "Residential",
    squareFeet: 1820,
    yearBuilt: 2001,
    bedrooms: 3,
    bathrooms: 2
  },
  
  // Outlier in Downtown - Much higher value
  {
    id: 4,
    parcelId: "D004",
    address: "104 Main St",
    latitude: 40.7131,
    longitude: -74.0063,
    value: "950000", // Significant outlier
    neighborhood: "Downtown",
    propertyType: "Residential",
    squareFeet: 1900, // Not much bigger
    yearBuilt: 2005,
    bedrooms: 3,
    bathrooms: 2
  },
  
  // Normal properties in Uptown neighborhood
  {
    id: 5,
    parcelId: "U001",
    address: "201 Elm St",
    latitude: 40.7228,
    longitude: -74.016,
    value: "700000",
    neighborhood: "Uptown",
    propertyType: "Residential",
    squareFeet: 2200,
    yearBuilt: 2010,
    bedrooms: 4,
    bathrooms: 3
  },
  {
    id: 6,
    parcelId: "U002",
    address: "202 Elm St",
    latitude: 40.7229,
    longitude: -74.0161,
    value: "725000",
    neighborhood: "Uptown",
    propertyType: "Residential",
    squareFeet: 2250,
    yearBuilt: 2012,
    bedrooms: 4,
    bathrooms: 3
  },
  
  // Outlier in Uptown - Much lower value
  {
    id: 7,
    parcelId: "U003",
    address: "203 Elm St",
    latitude: 40.723,
    longitude: -74.0162,
    value: "350000", // Significant outlier - too low
    neighborhood: "Uptown",
    propertyType: "Residential",
    squareFeet: 2150, // Similar size
    yearBuilt: 1950, // Much older
    bedrooms: 3,
    bathrooms: 2
  },
  
  // Property with missing value
  {
    id: 8,
    parcelId: "M001",
    address: "301 Oak St",
    latitude: 40.7328,
    longitude: -74.026,
    neighborhood: "Midtown",
    propertyType: "Residential",
    squareFeet: 2000,
    yearBuilt: 2005,
    bedrooms: 3,
    bathrooms: 2
  }
];

describe('Geospatial Outlier Detection', () => {
  test('should identify statistical outliers in property values', () => {
    // Detect outliers using default parameters
    const result = detectOutliers(mockProperties, {
      attributes: ['value'],
      threshold: 2.0, // Standard deviations
      neighborhoodContext: true
    });
    
    // Verify two outliers are detected (property 4 and 7)
    expect(result.outliers.length).toBe(2);
    
    // Verify the outlier IDs
    const outlierIds = result.outliers.map(o => o.propertyId);
    expect(outlierIds).toContain(4); // High value outlier
    expect(outlierIds).toContain(7); // Low value outlier
    
    // Verify normal properties are not flagged
    expect(outlierIds).not.toContain(1);
    expect(outlierIds).not.toContain(2);
    expect(outlierIds).not.toContain(3);
    expect(outlierIds).not.toContain(5);
    expect(outlierIds).not.toContain(6);
    
    // Verify metadata is provided
    expect(result.metadata.totalProperties).toBe(mockProperties.length - 1); // Excluding property with missing value
    expect(result.metadata.outlierPercentage).toBeCloseTo(28.57, 2); // 2/7 * 100
  });
  
  test('should provide explanation for why property is flagged as outlier', () => {
    // Detect outliers
    const result = detectOutliers(mockProperties, {
      attributes: ['value'],
      threshold: 2.0,
      neighborhoodContext: true
    });
    
    // Get explanation for high-value outlier (property 4)
    const highValueOutlier = result.outliers.find(o => o.propertyId === 4);
    expect(highValueOutlier).toBeDefined();
    
    if (highValueOutlier) {
      // Generate detailed explanation
      const explanation = generateOutlierExplanation(highValueOutlier, mockProperties);
      
      // Verify explanation contents
      expect(explanation.summary).toContain('significantly higher value');
      expect(explanation.factors.length).toBeGreaterThan(0);
      expect(explanation.neighborhoodComparison).toBeDefined();
      expect(explanation.zScore).toBeGreaterThan(2.0); // Should be above the threshold
      
      // Verify explanation references the property attributes
      expect(explanation.primaryFactor).toBe('value');
      expect(explanation.anomalyDirection).toBe('above');
    }
    
    // Get explanation for low-value outlier (property 7)
    const lowValueOutlier = result.outliers.find(o => o.propertyId === 7);
    expect(lowValueOutlier).toBeDefined();
    
    if (lowValueOutlier) {
      // Generate detailed explanation
      const explanation = generateOutlierExplanation(lowValueOutlier, mockProperties);
      
      // Verify explanation contents
      expect(explanation.summary).toContain('significantly lower value');
      expect(explanation.factors.length).toBeGreaterThan(0);
      expect(explanation.neighborhoodComparison).toBeDefined();
      expect(Math.abs(explanation.zScore)).toBeGreaterThan(2.0); // Should be below the threshold
      
      // Should identify the age as a contributing factor
      expect(explanation.secondaryFactors).toContain('yearBuilt');
      expect(explanation.anomalyDirection).toBe('below');
    }
  });
  
  test('should adjust outlier thresholds based on neighborhood context', () => {
    // First detect outliers WITHOUT neighborhood context
    const globalResult = detectOutliers(mockProperties, {
      attributes: ['value'],
      threshold: 2.0,
      neighborhoodContext: false
    });
    
    // Then detect outliers WITH neighborhood context
    const neighborhoodResult = detectOutliers(mockProperties, {
      attributes: ['value'],
      threshold: 2.0,
      neighborhoodContext: true
    });
    
    // Results should be different when neighborhood context is considered
    expect(globalResult.outliers.length).not.toBe(neighborhoodResult.outliers.length);
    
    // Verify neighborhood statistics are included when neighborhood context is enabled
    expect(neighborhoodResult.neighborhoodStatistics).toBeDefined();
    expect(Object.keys(neighborhoodResult.neighborhoodStatistics).length).toBeGreaterThan(0);
    
    // Verify Downtown neighborhood statistics
    const downtownStats = neighborhoodResult.neighborhoodStatistics['Downtown'];
    expect(downtownStats).toBeDefined();
    expect(downtownStats.mean).toBeCloseTo(621250, 0); // Average of the 4 Downtown property values
    expect(downtownStats.outlierCount).toBe(1); // Property 4
    
    // Verify Uptown neighborhood statistics
    const uptownStats = neighborhoodResult.neighborhoodStatistics['Uptown'];
    expect(uptownStats).toBeDefined();
    expect(uptownStats.mean).toBeCloseTo(591666.67, 0); // Average of the 3 Uptown property values
    expect(uptownStats.outlierCount).toBe(1); // Property 7
  });
  
  test('should detect outliers based on multiple attributes', () => {
    // Detect outliers using both value and square footage
    const result = detectOutliers(mockProperties, {
      attributes: ['value', 'squareFeet'],
      threshold: 2.0,
      neighborhoodContext: true
    });
    
    // Should detect outliers based on the combined attributes
    expect(result.outliers.length).toBeGreaterThan(0);
    
    // Each outlier should have deviation scores for both attributes
    for (const outlier of result.outliers) {
      expect(outlier.deviationScores['value']).toBeDefined();
      expect(outlier.deviationScores['squareFeet']).toBeDefined();
      
      // Should identify which attribute is the primary cause
      expect(outlier.primaryAttribute).toBeDefined();
    }
    
    // Looking specifically for value/size relationship outliers
    const valueSizeOutliers = result.outliers.filter(
      o => Math.abs(o.deviationScores['value']) > 1.5 && 
           Math.abs(o.deviationScores['squareFeet']) < 1.0
    );
    
    // Property 4 should be a value/size outlier (high value for its size)
    expect(valueSizeOutliers.some(o => o.propertyId === 4)).toBe(true);
  });
  
  test('should handle neighborhoods with minimal data points', () => {
    // Create a small set of data with a single property in a neighborhood
    const smallDataset = [
      ...mockProperties,
      {
        id: 9,
        parcelId: "S001",
        address: "999 Lone St",
        latitude: 40.75,
        longitude: -74.1,
        value: "600000",
        neighborhood: "Smallville", // Only property in this neighborhood
        propertyType: "Residential",
        squareFeet: 2000,
        yearBuilt: 2010,
        bedrooms: 3,
        bathrooms: 2
      }
    ];
    
    // Detect outliers
    const result = detectOutliers(smallDataset, {
      attributes: ['value'],
      threshold: 2.0,
      neighborhoodContext: true
    });
    
    // Verify Smallville statistics exist but outlier detection is skipped due to insufficient data
    const smallvilleStats = result.neighborhoodStatistics['Smallville'];
    expect(smallvilleStats).toBeDefined();
    expect(smallvilleStats.count).toBe(1);
    expect(smallvilleStats.outlierCount).toBe(0);
    expect(smallvilleStats.skippedDueToInsufficientData).toBe(true);
    
    // The lone property should not be an outlier
    expect(result.outliers.some(o => o.propertyId === 9)).toBe(false);
  });
  
  test('should handle properties with missing values', () => {
    // Detect outliers using a property without value data
    const result = detectOutliers(mockProperties, {
      attributes: ['value'],
      threshold: 2.0,
      neighborhoodContext: true
    });
    
    // Property 8 should be excluded from analysis (has no value)
    expect(result.metadata.excludedProperties).toBe(1);
    expect(result.metadata.totalProperties).toBe(mockProperties.length - 1);
    
    // Property 8 should not be in the outliers list
    expect(result.outliers.some(o => o.propertyId === 8)).toBe(false);
  });
});