import { PropertyValueModel } from '../services/predictive/propertyValueModel';
import { Property } from '../../shared/schema';

// Sample test properties
const testProperty: Property = {
  id: 1,
  parcelId: 'TEST001',
  address: '123 Test St',
  propertyType: 'Residential',
  yearBuilt: 2000,
  squareFeet: 2000,
  bedrooms: 3,
  bathrooms: 2,
  lotSize: 0.25,
  value: '350000',
  coordinates: [47.6062, -122.3321]
};

const trainingProperties: Property[] = [
  {
    id: 2,
    parcelId: 'TEST002',
    address: '124 Test St',
    propertyType: 'Residential',
    yearBuilt: 1995,
    squareFeet: 1800,
    bedrooms: 3,
    bathrooms: 2,
    lotSize: 0.2,
    value: '320000',
    coordinates: [47.6063, -122.3322]
  },
  {
    id: 3,
    parcelId: 'TEST003',
    address: '125 Test St',
    propertyType: 'Residential',
    yearBuilt: 2005,
    squareFeet: 2200,
    bedrooms: 4,
    bathrooms: 2.5,
    lotSize: 0.3,
    value: '380000',
    coordinates: [47.6064, -122.3323]
  },
  {
    id: 4,
    parcelId: 'TEST004',
    address: '126 Test St',
    propertyType: 'Residential',
    yearBuilt: 1980,
    squareFeet: 1600,
    bedrooms: 3,
    bathrooms: 1,
    lotSize: 0.2,
    value: '280000',
    coordinates: [47.6065, -122.3324]
  }
];

const incompleteProperty: Property = {
  id: 5,
  parcelId: 'TEST005',
  address: '127 Test St',
  propertyType: 'Residential',
  yearBuilt: undefined,
  squareFeet: undefined,
  value: '300000',
  coordinates: [47.6066, -122.3325]
};

describe('Predictive Modeling', () => {
  // Core functionality tests
  test('should train regression model with given features', async () => {
    const model = new PropertyValueModel();
    const result = await model.train(['squareFeet', 'bedrooms', 'yearBuilt'], trainingProperties);
    expect(result.trained).toBe(true);
    expect(result.features).toContain('squareFeet');
  });

  test('should predict property values within reasonable bounds', async () => {
    const model = new PropertyValueModel();
    await model.train(['squareFeet', 'bedrooms', 'yearBuilt'], trainingProperties);
    const prediction = await model.predict(testProperty);
    expect(prediction.value).toBeGreaterThan(0);
    expect(prediction.confidence).toBeGreaterThanOrEqual(0);
    expect(prediction.confidence).toBeLessThanOrEqual(1);
  });

  // Edge cases
  test('should handle properties with missing features', async () => {
    const model = new PropertyValueModel();
    await model.train(['squareFeet', 'bedrooms', 'yearBuilt'], trainingProperties);
    const prediction = await model.predict(incompleteProperty);
    expect(prediction.value).toBeGreaterThan(0);
    expect(prediction.confidence).toBeLessThan(0.8); // Lower confidence with missing data
  });

  test('should handle insufficient training data', async () => {
    const model = new PropertyValueModel();
    const result = await model.train(['squareFeet', 'bedrooms'], []);
    expect(result.trained).toBe(false);
    expect(result.error).toContain('insufficient data');
  });

  // Performance and visualization tests
  test('should calculate model accuracy metrics', async () => {
    const model = new PropertyValueModel();
    await model.train(['squareFeet', 'bedrooms', 'yearBuilt'], trainingProperties);
    const evaluation = await model.evaluate(trainingProperties);
    expect(evaluation.accuracy).toBeDefined();
    expect(evaluation.rmse).toBeDefined();
    expect(evaluation.r2).toBeGreaterThan(0);
  });

  test('should generate feature importance data', async () => {
    const model = new PropertyValueModel();
    await model.train(['squareFeet', 'bedrooms', 'yearBuilt', 'bathrooms', 'lotSize'], trainingProperties);
    const importance = model.getFeatureImportance();
    expect(importance.length).toBe(5);
    expect(importance[0]).toHaveProperty('feature');
    expect(importance[0]).toHaveProperty('importance');
  });
});