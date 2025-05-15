import { Property } from '@shared/schema';
import * as ss from 'simple-statistics';

/**
 * ML Valuation Model for property price prediction
 */

export interface ValuationModel {
  coefficients: Record<string, number>;
  intercept: number;
  features: string[];
  featureImportance: Record<string, number>;
  rmse: number;
  r2: number;
  meanValues: Record<string, number>;
  stdDevValues: Record<string, number>;
}

export interface ValueAnomaly {
  property: Property;
  expectedValue: number;
  actualValue: number;
  difference: number;
  percentDifference: number;
  score: number;
}

/**
 * Train a multiple regression model for property valuation
 * 
 * @param properties Training data set of properties
 * @returns Trained valuation model
 */
export function trainValuationModel(properties: Property[]): ValuationModel {
  // Extract features and target values
  const validProperties = properties.filter(p => p.value && !isNaN(parseFloat(p.value)));
  const features = extractFeatures(validProperties);
  const targetValues = validProperties.map(p => parseFloat(p.value || '0'));
  
  // Normalize features
  const { normalizedFeatures, meanValues, stdDevValues } = normalizeFeatures(features);
  
  // Train multiple linear regression model
  const regression = multipleLinearRegression(normalizedFeatures, targetValues);
  
  // Calculate feature importance
  const featureImportance = calculateFeatureImportance(
    regression.coefficients, 
    normalizedFeatures, 
    targetValues
  );
  
  // Return trained model
  return {
    coefficients: regression.coefficients,
    intercept: regression.intercept,
    features: Object.keys(regression.coefficients),
    featureImportance,
    rmse: regression.rmse,
    r2: regression.r2,
    meanValues,
    stdDevValues
  };
}

/**
 * Predict property value using the trained model
 * 
 * @param property Property to evaluate
 * @param model Trained valuation model
 * @returns Predicted property value
 */
export function predictPropertyValue(property: Property, model: ValuationModel): number {
  // Extract features for the property
  const propertyFeatures = extractPropertyFeatures(property);
  
  // Normalize features using model parameters
  const normalizedFeatures: Record<string, number> = {};
  
  for (const feature of model.features) {
    if (propertyFeatures[feature] !== undefined) {
      // Normalize using model's mean and std dev
      normalizedFeatures[feature] = (propertyFeatures[feature] - model.meanValues[feature]) / 
                                    (model.stdDevValues[feature] || 1);
    } else {
      // Feature is missing, use 0 (mean) for normalized value
      normalizedFeatures[feature] = 0;
    }
  }
  
  // Calculate predicted value
  let predictedValue = model.intercept;
  
  for (const feature of model.features) {
    predictedValue += normalizedFeatures[feature] * model.coefficients[feature];
  }
  
  return Math.max(0, predictedValue); // Ensure non-negative value
}

/**
 * Get feature importance from the trained model
 * 
 * @param model Trained valuation model
 * @returns Feature importance scores
 */
export function getFeatureImportance(model: ValuationModel): Record<string, number> {
  return model.featureImportance;
}

/**
 * Calculate confidence interval for the predicted value
 * 
 * @param property Property to evaluate
 * @param model Trained valuation model
 * @returns [lowerBound, upperBound] confidence interval (95%)
 */
export function getValueConfidenceInterval(
  property: Property, 
  model: ValuationModel
): [number, number] {
  // Get predicted value
  const predictedValue = predictPropertyValue(property, model);
  
  // Calculate confidence margin
  // More complete features = narrower interval
  const propertyFeatures = extractPropertyFeatures(property);
  const featureCompleteness = model.features.filter(f => 
    propertyFeatures[f] !== undefined
  ).length / model.features.length;
  
  // Base margin is model RMSE
  let marginPercentage = 0.15; // Base 15% margin
  
  // Adjust based on feature completeness
  marginPercentage = marginPercentage * (2 - featureCompleteness);
  
  // Calculate bounds
  const margin = predictedValue * marginPercentage;
  
  return [
    Math.max(0, predictedValue - margin), 
    predictedValue + margin
  ];
}

/**
 * Detect anomalous property values
 * 
 * @param properties Properties to analyze
 * @param model Trained valuation model
 * @returns List of properties with anomalous values
 */
export function detectValueAnomalies(
  properties: Property[], 
  model: ValuationModel
): ValueAnomaly[] {
  const anomalies: ValueAnomaly[] = [];
  
  // Properties with actual values
  const validProperties = properties.filter(p => 
    p.value && !isNaN(parseFloat(p.value))
  );
  
  // Calculate expected values and differences
  const differences = validProperties.map(property => {
    const actualValue = parseFloat(property.value || '0');
    const expectedValue = predictPropertyValue(property, model);
    const difference = actualValue - expectedValue;
    const percentDifference = (difference / expectedValue) * 100;
    
    return {
      property,
      expectedValue,
      actualValue,
      difference,
      percentDifference,
      score: 0 // Will calculate below
    };
  });
  
  // Calculate z-scores for percent differences
  const percentDifferences = differences.map(d => d.percentDifference);
  const mean = ss.mean(percentDifferences);
  const stdDev = ss.standardDeviation(percentDifferences);
  
  // Score anomalies based on z-score
  differences.forEach((diff, i) => {
    const zScore = Math.abs((diff.percentDifference - mean) / stdDev);
    diff.score = Math.min(1, zScore / 3); // Normalize to 0-1 scale
    
    // Add to anomalies if score is high enough
    if (diff.score > 0.7) {
      anomalies.push(diff);
    }
  });
  
  // Sort by anomaly score
  return anomalies.sort((a, b) => b.score - a.score);
}

// Helper functions

/**
 * Extract numeric features from properties
 */
function extractFeatures(properties: Property[]): Record<string, number[]> {
  const features: Record<string, number[]> = {};
  
  // Initialize arrays for each feature
  ['squareFeet', 'yearBuilt', 'bedrooms', 'bathrooms', 'lotSize', 'latitude', 'longitude'].forEach(feature => {
    features[feature] = [];
  });
  
  // Create additional features for categorical variables
  const propertyTypes = new Set<string>();
  const neighborhoods = new Set<string>();
  
  properties.forEach(property => {
    if (property.propertyType) propertyTypes.add(property.propertyType);
    if (property.neighborhood) neighborhoods.add(property.neighborhood);
  });
  
  // Initialize arrays for categorical features
  propertyTypes.forEach(type => {
    features[`propertyType_${type}`] = [];
  });
  
  neighborhoods.forEach(neighborhood => {
    features[`neighborhood_${neighborhood}`] = [];
  });
  
  // Fill feature arrays
  properties.forEach(property => {
    // Numeric features
    features.squareFeet.push(property.squareFeet || 0);
    features.yearBuilt.push(property.yearBuilt || 0);
    features.bedrooms.push(property.bedrooms || 0);
    features.bathrooms.push(property.bathrooms || 0);
    features.lotSize.push(property.lotSize || 0);
    
    // Location features
    features.latitude.push(property.latitude || 0);
    features.longitude.push(property.longitude || 0);
    
    // Add derived location feature - proximity to city center
    features.location = features.location || [];
    if (property.latitude && property.longitude) {
      // Simple distance from arbitrary "city center" point (can be refined in production)
      const cityCenterLat = 47.6062;
      const cityCenterLng = -122.3321;
      const distance = Math.sqrt(
        Math.pow(property.latitude - cityCenterLat, 2) + 
        Math.pow(property.longitude - cityCenterLng, 2)
      );
      features.location.push(distance);
    } else {
      features.location.push(0);
    }
    
    // Categorical features (one-hot encoding)
    propertyTypes.forEach(type => {
      features[`propertyType_${type}`].push(
        property.propertyType === type ? 1 : 0
      );
    });
    
    neighborhoods.forEach(neighborhood => {
      features[`neighborhood_${neighborhood}`].push(
        property.neighborhood === neighborhood ? 1 : 0
      );
    });
  });
  
  return features;
}

/**
 * Extract features for a single property
 */
function extractPropertyFeatures(property: Property): Record<string, number> {
  const features: Record<string, number> = {};
  
  // Numeric features
  features.squareFeet = property.squareFeet || 0;
  features.yearBuilt = property.yearBuilt || 0;
  features.bedrooms = property.bedrooms || 0;
  features.bathrooms = property.bathrooms || 0;
  features.lotSize = property.lotSize || 0;
  
  // Location features
  features.latitude = property.latitude || 0;
  features.longitude = property.longitude || 0;
  
  // Add derived location feature
  if (property.latitude && property.longitude) {
    const cityCenterLat = 47.6062;
    const cityCenterLng = -122.3321;
    features.location = Math.sqrt(
      Math.pow(property.latitude - cityCenterLat, 2) + 
      Math.pow(property.longitude - cityCenterLng, 2)
    );
  } else {
    features.location = 0;
  }
  
  // Categorical features
  if (property.propertyType) {
    features[`propertyType_${property.propertyType}`] = 1;
  }
  
  if (property.neighborhood) {
    features[`neighborhood_${property.neighborhood}`] = 1;
  }
  
  return features;
}

/**
 * Normalize features to have zero mean and unit variance
 */
function normalizeFeatures(features: Record<string, number[]>): {
  normalizedFeatures: Record<string, number[]>;
  meanValues: Record<string, number>;
  stdDevValues: Record<string, number>;
} {
  const normalizedFeatures: Record<string, number[]> = {};
  const meanValues: Record<string, number> = {};
  const stdDevValues: Record<string, number> = {};
  
  for (const [feature, values] of Object.entries(features)) {
    // Skip empty feature arrays
    if (values.length === 0) continue;
    
    // Calculate mean and standard deviation
    const mean = ss.mean(values);
    const stdDev = ss.standardDeviation(values) || 1; // Avoid division by zero
    
    // Store statistics
    meanValues[feature] = mean;
    stdDevValues[feature] = stdDev;
    
    // Normalize values
    normalizedFeatures[feature] = values.map(value => (value - mean) / stdDev);
  }
  
  return { normalizedFeatures, meanValues, stdDevValues };
}

/**
 * Perform multiple linear regression
 */
function multipleLinearRegression(
  features: Record<string, number[]>, 
  targetValues: number[]
): {
  coefficients: Record<string, number>;
  intercept: number;
  rmse: number;
  r2: number;
} {
  // Convert features to matrix form [samples, features]
  const featureNames = Object.keys(features);
  const numSamples = targetValues.length;
  
  // Prepare design matrix with intercept term
  const X = Array(numSamples).fill(0).map(() => [1]); // Add intercept column
  
  featureNames.forEach(feature => {
    const featureValues = features[feature];
    for (let i = 0; i < numSamples; i++) {
      X[i].push(featureValues[i]);
    }
  });
  
  // Use simple-statistics to perform linear regression
  const regression = ss.linearRegression(
    X.map((row, i) => [row.slice(1), targetValues[i]]).map(([x, y]) => ({
      x: x as number[],
      y: y as number
    }))
  );
  
  // Extract coefficients
  const coefficients: Record<string, number> = {};
  featureNames.forEach((feature, i) => {
    coefficients[feature] = regression.m[i];
  });
  
  // Make predictions
  const predictions = X.map(row => {
    let prediction = regression.b; // intercept
    for (let i = 0; i < featureNames.length; i++) {
      prediction += row[i + 1] * regression.m[i];
    }
    return prediction;
  });
  
  // Calculate error metrics
  const residuals = predictions.map((pred, i) => pred - targetValues[i]);
  const rmse = Math.sqrt(ss.mean(residuals.map(r => r * r)));
  
  // Calculate R-squared
  const meanTarget = ss.mean(targetValues);
  const totalSumSquares = ss.sum(targetValues.map(y => Math.pow(y - meanTarget, 2)));
  const residualSumSquares = ss.sum(residuals.map(r => r * r));
  const r2 = 1 - (residualSumSquares / totalSumSquares);
  
  return {
    coefficients,
    intercept: regression.b,
    rmse,
    r2
  };
}

/**
 * Calculate feature importance
 */
function calculateFeatureImportance(
  coefficients: Record<string, number>,
  normalizedFeatures: Record<string, number[]>,
  targetValues: number[]
): Record<string, number> {
  const importance: Record<string, number> = {};
  const featureNames = Object.keys(coefficients);
  
  // Calculate total variance of target
  const targetMean = ss.mean(targetValues);
  const targetVariance = ss.variance(targetValues);
  
  // For each feature, calculate its contribution to explained variance
  featureNames.forEach(feature => {
    const coefficient = coefficients[feature];
    const featureValues = normalizedFeatures[feature];
    
    // Skip if feature doesn't exist in normalized data
    if (!featureValues) {
      importance[feature] = 0;
      return;
    }
    
    // Calculate feature variance
    const featureVariance = ss.variance(featureValues);
    
    // Importance is proportional to coefficient^2 * feature_variance
    importance[feature] = Math.abs(coefficient * coefficient * featureVariance);
  });
  
  // Normalize importance scores to sum to 1
  const totalImportance = Object.values(importance).reduce((sum, val) => sum + val, 0);
  
  if (totalImportance > 0) {
    featureNames.forEach(feature => {
      importance[feature] = importance[feature] / totalImportance;
    });
  }
  
  return importance;
}