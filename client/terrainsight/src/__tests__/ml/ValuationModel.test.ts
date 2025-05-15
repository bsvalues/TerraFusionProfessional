import { Property } from '@shared/schema';
import { 
  trainValuationModel, 
  predictPropertyValue, 
  getFeatureImportance, 
  getValueConfidenceInterval,
  detectValueAnomalies
} from '../../services/ml/valuationModel';

const mockProperties: Property[] = [
  {
    id: 1,
    parcelId: "SAMPLE001",
    address: "123 Sample St",
    propertyType: "Single Family",
    squareFeet: 2500,
    yearBuilt: 2000,
    bedrooms: 4,
    bathrooms: 3,
    lotSize: 7500,
    value: "550000",
    neighborhood: "Downtown",
    latitude: 47.6062,
    longitude: -122.3321
  },
  {
    id: 2,
    parcelId: "SAMPLE002",
    address: "456 Test Ave",
    propertyType: "Single Family",
    squareFeet: 1800,
    yearBuilt: 1995,
    bedrooms: 3,
    bathrooms: 2,
    lotSize: 6000,
    value: "425000",
    neighborhood: "Downtown",
    latitude: 47.6082,
    longitude: -122.3351
  },
  {
    id: 3,
    parcelId: "SAMPLE003",
    address: "789 Eval Rd",
    propertyType: "Condo",
    squareFeet: 1200,
    yearBuilt: 2010,
    bedrooms: 2,
    bathrooms: 2,
    lotSize: 0,
    value: "380000",
    neighborhood: "Uptown",
    latitude: 47.6152,
    longitude: -122.3251
  },
  {
    id: 4,
    parcelId: "SAMPLE004",
    address: "101 Edge Case Ln",
    propertyType: "Single Family",
    squareFeet: 3200,
    yearBuilt: 1960,
    bedrooms: 5,
    bathrooms: 3,
    lotSize: 12000,
    value: "720000",
    neighborhood: "Suburbs",
    latitude: 47.7062,
    longitude: -122.2321
  },
  {
    id: 5,
    parcelId: "SAMPLE005",
    address: "202 Missing Data Dr",
    parcelId: "SAMPLE005",
    address: "202 Missing Data Dr",
    propertyType: "Single Family",
    value: "480000",
    neighborhood: "Suburbs",
    latitude: 47.7082,
    longitude: -122.2351
  }
];

const incompleteProperty: Property = {
  id: 6,
  parcelId: "SAMPLE006",
  address: "303 Partial Info Pl",
  propertyType: "Single Family",
  squareFeet: 2200,
  yearBuilt: 2005,
  neighborhood: "Downtown"
};

const outlierProperty: Property = {
  id: 7,
  parcelId: "SAMPLE007",
  address: "404 Outlier Ct",
  propertyType: "Single Family",
  squareFeet: 1900,
  yearBuilt: 2015,
  bedrooms: 3,
  bathrooms: 2,
  lotSize: 6500,
  value: "1200000", // Much higher than expected for characteristics
  neighborhood: "Downtown",
  latitude: 47.6092,
  longitude: -122.3361
};

describe('ML Valuation Model', () => {
  let trainedModel: any;
  
  beforeAll(() => {
    // Train the model before running tests
    trainedModel = trainValuationModel(mockProperties);
  });

  test('should predict within 20% of actual value for known properties', () => {
    // Test prediction on a property from the training set
    const property = mockProperties[0];
    const actualValue = parseFloat(property.value || '0');
    
    if (actualValue === 0) {
      throw new Error("Test property has no value");
    }
    
    const predictedValue = predictPropertyValue(property, trainedModel);
    
    // Calculate error percentage
    const errorPercentage = Math.abs((predictedValue - actualValue) / actualValue) * 100;
    
    // Prediction should be within 20% of actual value
    expect(errorPercentage).toBeLessThan(20);
  });

  test('should identify key value drivers', () => {
    // Get feature importance from the model
    const featureImportance = getFeatureImportance(trainedModel);
    
    // Make sure key features are identified
    expect(featureImportance).toHaveProperty('squareFeet');
    expect(featureImportance).toHaveProperty('location');
    expect(featureImportance).toHaveProperty('yearBuilt');
    
    // Location and square footage should be among the top factors
    const topFeatures = Object.entries(featureImportance)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(entry => entry[0]);
      
    expect(topFeatures).toContain('squareFeet');
    // Location factor should be important in some form (either direct or via neighborhood)
    expect(
      topFeatures.some(feature => 
        feature === 'location' || 
        feature === 'latitude' || 
        feature === 'longitude' || 
        feature === 'neighborhood'
      )
    ).toBeTruthy();
  });

  test('should produce reasonable confidence intervals', () => {
    // Test property
    const property = mockProperties[1];
    const predictedValue = predictPropertyValue(property, trainedModel);
    
    // Get confidence interval
    const [lowerBound, upperBound] = getValueConfidenceInterval(property, trainedModel);
    
    // Predicted value should be within the confidence interval
    expect(predictedValue).toBeGreaterThanOrEqual(lowerBound);
    expect(predictedValue).toBeLessThanOrEqual(upperBound);
    
    // Interval shouldn't be too wide or too narrow
    const intervalWidth = upperBound - lowerBound;
    const intervalPercentage = intervalWidth / predictedValue * 100;
    
    // Interval should be reasonable for real estate (typically 5-30%)
    expect(intervalPercentage).toBeGreaterThan(5);
    expect(intervalPercentage).toBeLessThan(30);
  });

  test('should handle outlier properties appropriately', () => {
    // Check if the outlier is detected
    const anomalies = detectValueAnomalies([...mockProperties, outlierProperty], trainedModel);
    
    // The outlier property should be in the anomalies list
    const outlierIds = anomalies.map(a => a.property.id);
    expect(outlierIds).toContain(outlierProperty.id);
    
    // The outlier should have a high anomaly score
    const outlierAnomaly = anomalies.find(a => a.property.id === outlierProperty.id);
    expect(outlierAnomaly?.score).toBeGreaterThan(0.7); // Assuming scale 0-1 where > 0.7 is high
  });

  test('should handle missing feature data gracefully', () => {
    // Should not throw error for incomplete property
    expect(() => predictPropertyValue(incompleteProperty, trainedModel)).not.toThrow();
    
    // Prediction should still be a reasonable value
    const predictedValue = predictPropertyValue(incompleteProperty, trainedModel);
    expect(predictedValue).toBeGreaterThan(0);
    
    // Confidence interval should be wider for properties with missing data
    const [lowerBound, upperBound] = getValueConfidenceInterval(incompleteProperty, trainedModel);
    const completeProperty = mockProperties[0];
    const [completeLower, completeUpper] = getValueConfidenceInterval(completeProperty, trainedModel);
    
    const incompleteWidth = upperBound - lowerBound;
    const completeWidth = completeUpper - completeLower;
    
    // Incomplete property should have wider confidence interval
    expect(incompleteWidth).toBeGreaterThan(completeWidth);
  });
});