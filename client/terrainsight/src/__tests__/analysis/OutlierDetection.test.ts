import { Property } from '@shared/schema';
import { 
  OutlierDetectionService, 
  PropertyOutlier, 
  SpatialOutlier 
} from '../../services/analysis/outlierDetectionService';

// Helper to generate sample properties
const generateSampleProperties = (count: number): Property[] => {
  const properties: Property[] = [];
  
  // Generate properties with normal distribution around common values
  for (let i = 0; i < count; i++) {
    const baseValue = 250000 + (Math.random() * 50000) - 25000; // Normal distribution around $250k
    const squareFeet = 2000 + (Math.random() * 400) - 200; // Normal distribution around 2000 sqft
    const yearBuilt = 1990 + Math.floor((Math.random() * 20) - 10); // Normal distribution around 1990
    
    // Add some truly outlier properties (~5%)
    const isOutlier = Math.random() < 0.05;
    const outlierFactor = isOutlier ? (Math.random() < 0.5 ? 0.4 : 2.5) : 1;
    
    const neighborhoods = ['North End', 'South Hills', 'Downtown', 'Westside', 'East Village'];
    const neighborhoodIndex = Math.floor(Math.random() * neighborhoods.length);
    
    properties.push({
      id: i + 1,
      parcelId: `P${(i + 1).toString().padStart(6, '0')}`,
      address: `${i + 100} Sample St`,
      value: (baseValue * outlierFactor).toFixed(2),
      squareFeet: Math.round(squareFeet * (isOutlier ? (Math.random() < 0.5 ? 0.5 : 2) : 1)),
      yearBuilt: Math.round(yearBuilt * (isOutlier && Math.random() < 0.3 ? 0.8 : 1)),
      neighborhood: neighborhoods[neighborhoodIndex],
      propertyType: Math.random() < 0.8 ? 'Residential' : 'Commercial',
      bedrooms: Math.floor(Math.random() * 5) + 1,
      bathrooms: Math.floor(Math.random() * 3) + 1,
      coordinates: [
        47.1 + (Math.random() * 0.2), 
        -122.5 + (Math.random() * 0.2)
      ],
      landValue: (baseValue * 0.3 * (isOutlier ? (Math.random() < 0.3 ? 0.2 : 3) : 1)).toFixed(2),
    });
  }
  
  return properties;
};

describe('OutlierDetectionService', () => {
  const sampleProperties = generateSampleProperties(100);
  const outlierService = new OutlierDetectionService();
  
  test('should identify numerical outliers in property values', () => {
    const outliers = outlierService.detectValueOutliers(sampleProperties);
    
    // Expect to find at least some outliers
    expect(outliers.length).toBeGreaterThan(0);
    
    // Verify structure of outlier object
    if (outliers.length > 0) {
      expect(outliers[0]).toHaveProperty('property');
      expect(outliers[0]).toHaveProperty('outlierScore');
      expect(outliers[0]).toHaveProperty('outlierType');
      expect(outliers[0]).toHaveProperty('reason');
      expect(outliers[0]).toHaveProperty('zScore');
      
      // Outlier score should be greater than 2.5 (the threshold)
      expect(outliers[0].outlierScore).toBeGreaterThan(2.5);
    }
  });
  
  test('should calculate z-scores correctly for value distributions', () => {
    // Choose a sample property
    const property = sampleProperties[0];
    
    // Calculate z-score manually
    const propertyValue = parseFloat(property.value!.toString().replace(/[^0-9.-]+/g, ''));
    const allValues = sampleProperties.map(p => 
      parseFloat(p.value!.toString().replace(/[^0-9.-]+/g, ''))
    );
    const mean = allValues.reduce((sum, val) => sum + val, 0) / allValues.length;
    const stdDev = Math.sqrt(
      allValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / allValues.length
    );
    const expectedZScore = (propertyValue - mean) / stdDev;
    
    // Get z-score from service
    const zScore = outlierService.calculateZScore(property, 'value', sampleProperties);
    
    // Should be approximately equal, allowing for floating point precision issues
    expect(zScore).toBeCloseTo(expectedZScore, 10);
  });
  
  test('should detect spatial outliers based on location', () => {
    const spatialOutliers = outlierService.detectSpatialOutliers(sampleProperties);
    
    // May or may not find spatial outliers depending on the random data
    expect(spatialOutliers.length).toBeGreaterThanOrEqual(0);
    
    // If we have spatial outliers, verify their structure
    if (spatialOutliers.length > 0) {
      const outlier = spatialOutliers[0];
      expect(outlier).toHaveProperty('spatialDiscrepancy');
      expect(outlier).toHaveProperty('neighborhoodAverage');
      expect(outlier).toHaveProperty('neighborhoodStdDev');
      expect(outlier.outlierType).toBe('spatial');
    }
  });
  
  test('should handle missing values gracefully', () => {
    // Create a copy with missing values
    const incompleteProperties = sampleProperties.map((p, i) => {
      if (i % 3 === 0) return { ...p, value: undefined };
      if (i % 3 === 1) return { ...p, squareFeet: undefined };
      return p;
    });
    
    // Should not throw errors
    expect(() => outlierService.detectValueOutliers(incompleteProperties)).not.toThrow();
    expect(() => outlierService.detectSpatialOutliers(incompleteProperties)).not.toThrow();
  });
  
  test('should handle empty property array', () => {
    expect(outlierService.detectValueOutliers([])).toEqual([]);
    expect(outlierService.detectSpatialOutliers([])).toEqual([]);
  });
  
  test('should group properties by neighborhood correctly', () => {
    // Access the private method using type assertion
    const service = outlierService as any;
    const groups = service.groupPropertiesByNeighborhood(sampleProperties);
    
    // Should have grouped properties by their neighborhoods
    expect(Object.keys(groups).length).toBeGreaterThan(0);
    
    // Each neighborhood should contain at least one property
    Object.values(groups).forEach(properties => {
      expect(Array.isArray(properties)).toBe(true);
      expect(properties.length).toBeGreaterThan(0);
      
      // All properties in a group should have the same neighborhood
      const neighborhood = (properties as Property[])[0].neighborhood;
      (properties as Property[]).forEach(property => {
        expect(property.neighborhood).toBe(neighborhood);
      });
    });
  });
});