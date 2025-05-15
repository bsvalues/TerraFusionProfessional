import { describe, expect, test } from '@jest/globals';
import { 
  calculateOLSRegression, 
  calculateGWRRegression,
  calculateWeightedRegression,
  KernelType,
  predictWithModel,
  calculateVariableImportance,
  calculateModelQuality
} from '../services/regressionService';
import { Property } from '@shared/schema';

// Create test data
const createTestProperties = (): Property[] => {
  // Create properties with known relationships for testing
  return Array.from({ length: 100 }, (_, i) => ({
    id: i + 1,
    parcelId: `PARCEL${i + 1}`,
    address: `${i + 100} Test Street`,
    city: 'Testville',
    state: 'WA',
    zip: '99999',
    propertyType: i % 3 === 0 ? 'Residential' : i % 3 === 1 ? 'Commercial' : 'Industrial',
    zoning: i % 2 === 0 ? 'R1' : 'C1',
    yearBuilt: 1950 + Math.floor(i / 5), // Groups by year
    assessedValue: 100000 + (i * 5000) + (Math.random() * 10000), // Base + trend + noise
    marketValue: 120000 + (i * 5500) + (Math.random() * 12000), // Similar to assessed but different scale
    landValue: 40000 + (i * 1500) + (Math.random() * 5000),
    improvements: 60000 + (i * 3500) + (Math.random() * 8000),
    bedrooms: (i % 5) + 1, // 1-5 bedrooms
    bathrooms: ((i % 3) * 0.5) + 1, // 1, 1.5, 2, 2.5, 3
    squareFeet: 1000 + (i * 20) + (Math.random() * 200),
    lotSize: 5000 + (i * 100) + (Math.random() * 1000),
    lastSaleDate: new Date(2018, i % 12, (i % 28) + 1).toISOString(),
    lastSalePrice: 110000 + (i * 4800) + (Math.random() * 15000),
    latitude: 46.2 + (i * 0.001), // Create spatial pattern
    longitude: -119.1 - (i * 0.001), // Create spatial pattern
    neighborhood: `Zone${Math.floor(i / 20) + 1}`, // Creates 5 neighborhoods
    schoolDistrict: `District${Math.floor(i / 33) + 1}`, // Creates 3 districts
    floodZone: i % 10 === 0, // 10% in flood zone
    taxExempt: i % 20 === 0, // 5% tax exempt
    taxYear: 2023,
    taxAmount: 2000 + (i * 100) + (Math.random() * 500),
    ownerName: `Owner ${i + 1}`,
    ownerAddress: `${i + 200} Owner Street`,
    ownerCity: 'Ownersville',
    ownerState: 'WA',
    ownerZip: '99998',
    attributes: {
      hasGarage: i % 2 === 0,
      hasPool: i % 10 === 0,
      hasFireplace: i % 3 === 0,
      hasCentralAir: i % 2 === 1,
      hasBasement: i % 4 === 0,
      stories: (i % 3) + 1,
      parkingSpaces: (i % 4) + 1,
      condition: ['Excellent', 'Good', 'Fair', 'Poor'][i % 4],
      yearRenovated: i % 3 === 0 ? 2010 + Math.floor(i / 10) : null,
      constructionType: ['Frame', 'Brick', 'Stone', 'Stucco'][i % 4],
      roofType: ['Asphalt', 'Tile', 'Metal', 'Slate'][i % 4],
      foundationType: ['Concrete', 'Crawl Space', 'Slab', 'Basement'][i % 4]
    }
  }));
};

describe('Regression Service', () => {
  const properties = createTestProperties();
  
  test('OLS regression calculates correct coefficients', () => {
    const model = calculateOLSRegression(
      properties, 
      'marketValue', 
      ['squareFeet', 'bedrooms', 'bathrooms']
    );
    
    expect(model.coefficients).toBeDefined();
    expect(model.rSquared).toBeGreaterThan(0);
    expect(model.rSquared).toBeLessThanOrEqual(1);
    
    // Square feet should have a positive effect on value
    expect(model.coefficients.squareFeet).toBeGreaterThan(0);
    
    // Check statistical properties
    expect(model.observations).toBe(properties.length);
    expect(model.usedVariables).toEqual(['squareFeet', 'bedrooms', 'bathrooms']);
    expect(model.predictedValues.length).toBe(properties.length);
    expect(model.residuals.length).toBe(properties.length);
  });
  
  test('Weighted regression applies weights correctly', () => {
    // Weight older properties less
    const weightFunction = (property: Property) => {
      const yearDiff = 2023 - (property.yearBuilt || 2000);
      return Math.max(0.1, 1 - (yearDiff / 100)); // Newer properties have weight closer to 1
    };
    
    const model = calculateWeightedRegression(
      properties, 
      'marketValue', 
      ['squareFeet', 'bedrooms', 'bathrooms'],
      weightFunction
    );
    
    expect(model.coefficients).toBeDefined();
    expect(model.rSquared).toBeGreaterThan(0);
    
    // Compare with unweighted model to verify difference
    const unweightedModel = calculateOLSRegression(
      properties, 
      'marketValue', 
      ['squareFeet', 'bedrooms', 'bathrooms']
    );
    
    // Coefficients should be different due to weighting
    expect(model.coefficients.squareFeet).not.toEqual(unweightedModel.coefficients.squareFeet);
  });
  
  test('GWR regression calculates local coefficients', () => {
    // Skip this test if properties don't have coordinates
    if (!properties[0].latitude || !properties[0].longitude) {
      console.warn('Properties missing coordinates, skipping GWR test');
      return;
    }
    
    const model = calculateGWRRegression(
      properties, 
      'marketValue', 
      ['squareFeet', 'bedrooms'],
      { bandwidth: 0.5, kernel: KernelType.GAUSSIAN }
    );
    
    // Each property should have its own set of coefficients
    expect(model.localCoefficients.length).toEqual(properties.length);
    expect(model.localRSquared.length).toEqual(properties.length);
    expect(model.globalRSquared).toBeGreaterThan(0);
    
    // Check that coefficients vary spatially
    const squareFeetCoeffs = model.localCoefficients.map(c => c.squareFeet);
    const min = Math.min(...squareFeetCoeffs);
    const max = Math.max(...squareFeetCoeffs);
    
    // There should be variation in coefficients
    expect(max - min).toBeGreaterThan(0);
  });
  
  test('Handles collinear variables gracefully', () => {
    // Create test data with perfectly collinear variables
    const collinearProperties = properties.map(p => ({
      ...p,
      redundantVar: p.squareFeet * 2 // Perfect collinearity
    })) as Property[];
    
    const model = calculateOLSRegression(
      collinearProperties, 
      'marketValue', 
      ['squareFeet', 'redundantVar', 'bedrooms']
    );
    
    // Should detect collinearity
    expect(model.diagnostics.collinearity).toBeTruthy();
    expect(model.diagnostics.vif.redundantVar).toBeGreaterThan(5); // High VIF indicates collinearity
  });
  
  test('regression with single variable works correctly', () => {
    const model = calculateOLSRegression(properties, 'marketValue', ['squareFeet']);
    
    expect(model.coefficients).toBeDefined();
    expect(model.coefficients.squareFeet).toBeDefined();
    expect(model.rSquared).toBeGreaterThan(0);
    
    // Predictions should make sense
    const smallProperty = properties.find(p => p.squareFeet < 1500);
    const largeProperty = properties.find(p => p.squareFeet > 2500);
    
    if (smallProperty && largeProperty) {
      const smallPrediction = predictWithModel(model, [smallProperty])[0];
      const largePrediction = predictWithModel(model, [largeProperty])[0];
      
      // Larger property should have higher predicted value
      expect(largePrediction).toBeGreaterThan(smallPrediction);
    }
  });
  
  test('prediction function works correctly', () => {
    const model = calculateOLSRegression(
      properties, 
      'marketValue', 
      ['squareFeet', 'bedrooms', 'bathrooms']
    );
    
    // Make predictions for the first 5 properties
    const testProperties = properties.slice(0, 5);
    const predictions = predictWithModel(model, testProperties);
    
    expect(predictions.length).toBe(5);
    expect(typeof predictions[0]).toBe('number');
    
    // Predictions should be in a reasonable range
    predictions.forEach(pred => {
      expect(pred).toBeGreaterThan(0); // Values should be positive
      expect(pred).toBeLessThan(1000000); // And not unreasonably high based on test data
    });
  });
  
  test('variable importance calculation works', () => {
    const model = calculateOLSRegression(
      properties, 
      'marketValue', 
      ['squareFeet', 'bedrooms', 'bathrooms', 'yearBuilt']
    );
    
    const importance = calculateVariableImportance(model);
    
    expect(Object.keys(importance).length).toBe(4); // Same as number of variables
    
    // Importance scores should sum to approximately 1
    const sum = Object.values(importance).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1, 1);
    
    // Each importance should be between 0 and 1
    Object.values(importance).forEach(value => {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(1);
    });
  });
  
  test('model quality metrics calculation works', () => {
    const model = calculateOLSRegression(
      properties, 
      'marketValue', 
      ['squareFeet', 'bedrooms', 'bathrooms']
    );
    
    const quality = calculateModelQuality(model);
    
    // Check that metrics exist and are in reasonable ranges
    expect(quality.cod).toBeGreaterThan(0); // Should be positive
    expect(quality.prd).toBeGreaterThan(0.8); // Should be close to 1 for unbiased model
    expect(quality.prd).toBeLessThan(1.2);
    expect(quality.rootMeanSquaredError).toBeGreaterThan(0);
    expect(quality.averageAbsoluteError).toBeGreaterThan(0);
    expect(quality.medianAbsoluteError).toBeGreaterThan(0);
  });
  
  test('throwing error when insufficient observations', () => {
    // Only 3 properties, trying to fit 3 variables (4 parameters including intercept)
    const fewProperties = properties.slice(0, 3);
    
    // Should throw error
    expect(() => 
      calculateOLSRegression(fewProperties, 'marketValue', ['squareFeet', 'bedrooms', 'bathrooms'])
    ).toThrow('Insufficient observations');
  });
});