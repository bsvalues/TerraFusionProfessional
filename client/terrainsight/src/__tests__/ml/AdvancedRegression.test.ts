import { Property } from '@shared/schema';
import { 
  AdvancedRegressionService, 
  RegressionModelResult, 
  FeatureImportance 
} from '../../services/ml/advancedRegressionService';

// Helper to generate sample properties
const generateSampleProperties = (count: number): Property[] => {
  const properties: Property[] = [];
  
  for (let i = 0; i < count; i++) {
    const baseValue = 250000 + (Math.random() * 100000) - 50000; // Normal distribution around $250k
    const squareFeet = 2000 + (Math.random() * 800) - 400; // Normal distribution around 2000 sqft
    const yearBuilt = 1990 + Math.floor((Math.random() * 30) - 15); // Normal distribution around 1990
    const bedrooms = Math.floor(Math.random() * 3) + 2; // 2-4 bedrooms
    const bathrooms = Math.floor(Math.random() * 2) + 1; // 1-2 bathrooms
    const lotSize = 5000 + (Math.random() * 3000); // 5000-8000 sq ft lots
    
    // Add relationship between features and value
    const calculatedValue = 
      (squareFeet * 120) + // $120 per sq ft
      ((yearBuilt - 1950) * 500) + // $500 per year newer than 1950
      (bedrooms * 15000) + // $15k per bedroom
      (bathrooms * 25000) + // $25k per bathroom
      (lotSize * 5 / 100) + // $5 per 100 sq ft of lot
      (Math.random() * 30000 - 15000); // Random noise
    
    properties.push({
      id: i + 1,
      parcelId: `P${(i + 1).toString().padStart(6, '0')}`,
      address: `${i + 100} Regression Rd`,
      value: calculatedValue.toFixed(2),
      squareFeet: Math.round(squareFeet),
      yearBuilt: Math.round(yearBuilt),
      bedrooms,
      bathrooms,
      lotSize: Math.round(lotSize),
      neighborhood: i % 5 === 0 ? 'North End' : 
                  i % 5 === 1 ? 'Downtown' : 
                  i % 5 === 2 ? 'Westside' : 
                  i % 5 === 3 ? 'South Hills' : 'East Village',
      propertyType: i % 10 === 0 ? 'Commercial' : 'Residential',
      coordinates: [
        47.1 + (Math.random() * 0.2), 
        -122.5 + (Math.random() * 0.2)
      ],
      landValue: (calculatedValue * 0.3).toFixed(2),
    });
  }
  
  return properties;
};

describe('AdvancedRegressionService', () => {
  const sampleProperties = generateSampleProperties(200);
  const regressionService = new AdvancedRegressionService();
  
  test('should train multiple regression models successfully', () => {
    const models = regressionService.trainMultipleModels(sampleProperties);
    
    // Check that all three models were trained
    expect(models).toHaveProperty('linearRegression');
    expect(models).toHaveProperty('randomForest');
    expect(models).toHaveProperty('gradientBoosting');
    
    // Check basic model structure
    expect(models.linearRegression.modelType).toBe('linear');
    expect(models.randomForest.modelType).toBe('randomForest');
    expect(models.gradientBoosting.modelType).toBe('gradientBoosting');
    
    // Each model should have predicted values, confidence scores, and metrics
    expect(models.linearRegression.predictedValue).toBeGreaterThan(0);
    expect(models.linearRegression.confidence).toBeGreaterThan(0);
    expect(models.linearRegression.r2Score).toBeGreaterThan(0);
    expect(models.linearRegression.featureImportance.length).toBeGreaterThan(0);
  });
  
  test('should calculate feature importance for property attributes', () => {
    const featureImportance = regressionService.calculateFeatureImportance(sampleProperties);
    
    // Should have feature importance results
    expect(featureImportance.length).toBeGreaterThan(0);
    
    // Check structure of feature importance object
    const firstFeature = featureImportance[0];
    expect(firstFeature).toHaveProperty('feature');
    expect(firstFeature).toHaveProperty('importance');
    expect(firstFeature).toHaveProperty('description');
    
    // Importance should be between 0 and 1
    expect(firstFeature.importance).toBeGreaterThan(0);
    expect(firstFeature.importance).toBeLessThanOrEqual(1);
    
    // Should be sorted by importance (descending)
    for (let i = 1; i < featureImportance.length; i++) {
      expect(featureImportance[i - 1].importance).toBeGreaterThanOrEqual(featureImportance[i].importance);
    }
  });
  
  test('should predict property values with confidence intervals', () => {
    const testProperty = sampleProperties[0];
    const prediction = regressionService.predictWithConfidence(testProperty, sampleProperties);
    
    // Check prediction structure
    expect(prediction).toHaveProperty('predictedValue');
    expect(prediction).toHaveProperty('lowerBound');
    expect(prediction).toHaveProperty('upperBound');
    expect(prediction).toHaveProperty('confidenceInterval');
    expect(prediction).toHaveProperty('features');
    
    // Bounds should be logical
    expect(prediction.lowerBound).toBeLessThan(prediction.predictedValue);
    expect(prediction.upperBound).toBeGreaterThan(prediction.predictedValue);
    
    // Prediction should be within a reasonable range of the actual value
    const actualValue = parseFloat(testProperty.value!.toString().replace(/[^0-9.-]+/g, ''));
    const percentageDifference = Math.abs((prediction.predictedValue - actualValue) / actualValue);
    expect(percentageDifference).toBeLessThan(0.3); // Within 30%
    
    // Features should include all property attributes used in the model
    expect(prediction.features).toHaveProperty('squareFeet');
    expect(prediction.features).toHaveProperty('yearBuilt');
    expect(prediction.features).toHaveProperty('bedrooms');
    expect(prediction.features).toHaveProperty('bathrooms');
  });
  
  test('should compare model performance metrics', () => {
    const metrics = regressionService.compareModelPerformance(sampleProperties);
    
    // Should have metrics for all three models
    expect(metrics).toHaveProperty('linearRegression');
    expect(metrics).toHaveProperty('randomForest');
    expect(metrics).toHaveProperty('gradientBoosting');
    
    // Each model should have performance metrics
    expect(metrics.linearRegression).toHaveProperty('r2');
    expect(metrics.linearRegression).toHaveProperty('mse');
    expect(metrics.linearRegression).toHaveProperty('mae');
    expect(metrics.linearRegression).toHaveProperty('accuracy');
    
    // R2 should be between 0 and 1
    expect(metrics.linearRegression.r2).toBeGreaterThanOrEqual(0);
    expect(metrics.linearRegression.r2).toBeLessThanOrEqual(1);
    
    // MSE and MAE should be positive
    expect(metrics.linearRegression.mse).toBeGreaterThanOrEqual(0);
    expect(metrics.linearRegression.mae).toBeGreaterThanOrEqual(0);
    
    // Accuracy should be a percentage
    expect(metrics.linearRegression.accuracy).toBeGreaterThanOrEqual(0);
    expect(metrics.linearRegression.accuracy).toBeLessThanOrEqual(100);
  });
  
  test('should handle empty property arrays gracefully', () => {
    const models = regressionService.trainMultipleModels([]);
    expect(Object.keys(models).length).toBe(0);
    
    const featureImportance = regressionService.calculateFeatureImportance([]);
    expect(featureImportance.length).toBe(0);
    
    const metrics = regressionService.compareModelPerformance([]);
    expect(metrics.linearRegression.r2).toBe(0);
    expect(metrics.randomForest.r2).toBe(0);
    expect(metrics.gradientBoosting.r2).toBe(0);
  });
  
  test('should handle properties with missing values', () => {
    // Create copies with missing values
    const incompleteProperties = sampleProperties.map((p, i) => {
      if (i % 3 === 0) return { ...p, value: undefined };
      if (i % 3 === 1) return { ...p, squareFeet: undefined };
      if (i % 5 === 0) return { ...p, yearBuilt: undefined };
      return p;
    });
    
    // Should not throw errors with incomplete data
    expect(() => regressionService.trainMultipleModels(incompleteProperties)).not.toThrow();
    expect(() => regressionService.calculateFeatureImportance(incompleteProperties)).not.toThrow();
    expect(() => regressionService.compareModelPerformance(incompleteProperties)).not.toThrow();
  });
});