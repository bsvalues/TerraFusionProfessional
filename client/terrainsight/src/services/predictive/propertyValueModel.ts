import { Property } from '@shared/schema';
import { formatCurrency } from '../../lib/utils';

/**
 * Training result with status and metadata
 */
export interface TrainingResult {
  trained: boolean;
  features: string[];
  error?: string;
  metrics?: {
    r2: number;
    rmse: number;
  };
}

/**
 * Prediction result with value and confidence
 */
export interface PredictionResult {
  value: number;
  formattedValue: string;
  confidence: number;
  warning?: string;
}

/**
 * Model evaluation metrics
 */
export interface ModelEvaluation {
  accuracy: number;
  rmse: number;
  r2: number;
  predictions: Array<{
    actual: number;
    predicted: number;
    error: number;
    percentError: number;
  }>;
}

/**
 * Feature importance entry
 */
export interface FeatureImportance {
  feature: string;
  importance: number;
  coefficient: number;
}

/**
 * Multiple regression model for predicting property values
 */
export class PropertyValueModel {
  private trained: boolean = false;
  private features: string[] = [];
  private coefficients: Map<string, number> = new Map();
  private intercept: number = 0;
  private featureImportance: FeatureImportance[] = [];
  private trainingStats: {
    meanValues: Map<string, number>;
    stdValues: Map<string, number>;
    meanTarget: number;
    stdTarget: number;
  } | null = null;

  /**
   * Train the model on a set of properties
   */
  async train(features: string[], properties: Property[]): Promise<TrainingResult> {
    this.features = [...features];
    
    // Validation
    if (properties.length < 10) {
      return {
        trained: false,
        features,
        error: 'insufficient data for reliable training (minimum 10 properties required)'
      };
    }

    if (!this.validateFeatures(features, properties)) {
      return {
        trained: false,
        features,
        error: 'selected features have too many missing values'
      };
    }

    try {
      // Extract training data
      const { X, y, meanValues, stdValues, meanTarget, stdTarget } = this.prepareTrainingData(features, properties);
      
      // Store stats for normalization during prediction
      this.trainingStats = {
        meanValues,
        stdValues,
        meanTarget,
        stdTarget
      };

      // Train multiple linear regression using normal equation
      const result = this.trainMultipleRegression(X, y);
      this.coefficients = result.coefficients;
      this.intercept = result.intercept;
      this.trained = true;
      
      // Calculate feature importance
      this.calculateFeatureImportance();
      
      // Calculate training metrics
      const trainEvaluation = await this.evaluate(properties);
      
      return {
        trained: true,
        features,
        metrics: {
          r2: trainEvaluation.r2,
          rmse: trainEvaluation.rmse
        }
      };
    } catch (err) {
      return {
        trained: false,
        features,
        error: `training failed: ${err instanceof Error ? err.message : 'unknown error'}`
      };
    }
  }

  /**
   * Predict property value
   */
  async predict(property: Property): Promise<PredictionResult> {
    if (!this.trained) {
      throw new Error('Model has not been trained');
    }

    // Check for missing features
    const missingFeatures = this.features.filter(f => 
      property[f as keyof Property] === undefined || 
      property[f as keyof Property] === null
    );
    
    // Calculate confidence based on missing features
    const confidence = Math.max(0, 1 - (missingFeatures.length / this.features.length) * 0.5);
    
    // Fill missing values with means from training
    const inputData = this.features.map(feature => {
      const value = property[feature as keyof Property];
      
      if (value === undefined || value === null) {
        // Use mean from training if available
        return this.trainingStats?.meanValues.get(feature) || 0;
      }
      
      return typeof value === 'number' ? value : 0;
    });
    
    // Normalize input
    const normalizedInput = this.normalizeInput(inputData);
    
    // Make prediction
    let predictedValue = this.intercept;
    
    this.features.forEach((feature, i) => {
      const coefficient = this.coefficients.get(feature) || 0;
      predictedValue += coefficient * normalizedInput[i];
    });
    
    // Denormalize prediction
    if (this.trainingStats) {
      predictedValue = predictedValue * this.trainingStats.stdTarget + this.trainingStats.meanTarget;
    }
    
    // Ensure prediction is positive
    predictedValue = Math.max(0, predictedValue);
    
    return {
      value: predictedValue,
      formattedValue: formatCurrency(predictedValue),
      confidence,
      warning: missingFeatures.length > 0 
        ? `Missing ${missingFeatures.length} features; prediction may be less accurate` 
        : undefined
    };
  }

  /**
   * Evaluate model on a set of properties
   */
  async evaluate(properties: Property[]): Promise<ModelEvaluation> {
    if (!this.trained) {
      throw new Error('Model has not been trained');
    }

    const predictions = [];
    let sumSquaredError = 0;
    let sumActual = 0;
    let sumActualSquared = 0;
    let sumPredicted = 0;
    let sumPredictedSquared = 0;
    let sumProductActualPredicted = 0;
    
    // Make predictions for all properties
    for (const property of properties) {
      const actual = property.value ? parseFloat(property.value) : 0;
      if (actual === 0) continue; // Skip properties with no value
      
      const prediction = await this.predict(property);
      const predicted = prediction.value;
      
      const error = predicted - actual;
      const percentError = (error / actual) * 100;
      
      predictions.push({
        actual,
        predicted,
        error,
        percentError
      });
      
      // For RMSE calculation
      sumSquaredError += error * error;
      
      // For R² calculation
      sumActual += actual;
      sumActualSquared += actual * actual;
      sumPredicted += predicted;
      sumPredictedSquared += predicted * predicted;
      sumProductActualPredicted += actual * predicted;
    }
    
    const n = predictions.length;
    
    // Root Mean Squared Error
    const rmse = Math.sqrt(sumSquaredError / n);
    
    // Calculate R² (coefficient of determination)
    const numerator = (n * sumProductActualPredicted) - (sumActual * sumPredicted);
    const denominator = Math.sqrt(
      ((n * sumActualSquared) - (sumActual * sumActual)) *
      ((n * sumPredictedSquared) - (sumPredicted * sumPredicted))
    );
    
    const r = numerator / denominator;
    const r2 = r * r;
    
    // Calculate accuracy (1 - mean absolute percentage error)
    const mape = predictions.reduce((sum, p) => sum + Math.abs(p.percentError), 0) / n;
    const accuracy = Math.max(0, 1 - (mape / 100));
    
    return {
      accuracy,
      rmse,
      r2,
      predictions
    };
  }

  /**
   * Get feature importance
   */
  getFeatureImportance(): FeatureImportance[] {
    if (!this.trained) {
      throw new Error('Model has not been trained');
    }
    
    return [...this.featureImportance];
  }

  /**
   * Reset the model
   */
  reset(): void {
    this.trained = false;
    this.features = [];
    this.coefficients = new Map();
    this.intercept = 0;
    this.featureImportance = [];
    this.trainingStats = null;
  }

  /**
   * Prepare training data
   */
  private prepareTrainingData(features: string[], properties: Property[]) {
    const X: number[][] = [];
    const y: number[] = [];
    
    // Calculate means for each feature for normalization
    const meanValues = new Map<string, number>();
    const stdValues = new Map<string, number>();
    
    // Calculate feature means
    features.forEach(feature => {
      const values = properties.map(p => {
        const val = p[feature as keyof Property];
        return typeof val === 'number' ? val : 0;
      }).filter(v => v > 0);
      
      const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
      meanValues.set(feature, mean);
      
      // Calculate standard deviation
      const squaredDiffs = values.map(v => (v - mean) ** 2);
      const variance = squaredDiffs.reduce((sum, v) => sum + v, 0) / values.length;
      const std = Math.sqrt(variance);
      stdValues.set(feature, std > 0 ? std : 1); // Avoid division by zero
    });
    
    // Extract target values
    const targetValues = properties.map(p => p.value ? parseFloat(p.value) : 0).filter(v => v > 0);
    const meanTarget = targetValues.reduce((sum, v) => sum + v, 0) / targetValues.length;
    
    // Calculate target standard deviation
    const targetSquaredDiffs = targetValues.map(v => (v - meanTarget) ** 2);
    const targetVariance = targetSquaredDiffs.reduce((sum, v) => sum + v, 0) / targetValues.length;
    const stdTarget = Math.sqrt(targetVariance);
    
    // Prepare normalized training data
    properties.forEach(property => {
      if (!property.value) return; // Skip properties without value
      
      const featureValues = features.map(feature => {
        const value = property[feature as keyof Property];
        return typeof value === 'number' ? value : meanValues.get(feature) || 0;
      });
      
      // Normalize feature values
      const normalizedFeatures = featureValues.map((value, i) => {
        const mean = meanValues.get(features[i]) || 0;
        const std = stdValues.get(features[i]) || 1;
        return (value - mean) / std;
      });
      
      X.push(normalizedFeatures);
      
      // Normalize target value
      const targetValue = parseFloat(property.value);
      const normalizedTarget = (targetValue - meanTarget) / stdTarget;
      y.push(normalizedTarget);
    });
    
    return { X, y, meanValues, stdValues, meanTarget, stdTarget };
  }

  /**
   * Train multiple linear regression using normal equation
   */
  private trainMultipleRegression(X: number[][], y: number[]) {
    const n = X.length; // Number of samples
    const p = X[0].length; // Number of features
    
    // Add bias term (intercept)
    const X_with_bias = X.map(row => [1, ...row]);
    
    // Calculate X'X (transpose(X) * X)
    const X_transpose_X = new Array(p + 1).fill(0).map(() => new Array(p + 1).fill(0));
    
    for (let i = 0; i < p + 1; i++) {
      for (let j = 0; j < p + 1; j++) {
        let sum = 0;
        for (let k = 0; k < n; k++) {
          sum += X_with_bias[k][i] * X_with_bias[k][j];
        }
        X_transpose_X[i][j] = sum;
      }
    }
    
    // Calculate X'y (transpose(X) * y)
    const X_transpose_y = new Array(p + 1).fill(0);
    
    for (let i = 0; i < p + 1; i++) {
      let sum = 0;
      for (let k = 0; k < n; k++) {
        sum += X_with_bias[k][i] * y[k];
      }
      X_transpose_y[i] = sum;
    }
    
    // Solve the normal equation: (X'X)^-1 * X'y
    const inverse = this.invertMatrix(X_transpose_X);
    const coefficients_array = this.multiplyMatrixVector(inverse, X_transpose_y);
    
    // Extract intercept and coefficients
    const intercept = coefficients_array[0];
    const coefficients = new Map<string, number>();
    
    this.features.forEach((feature, i) => {
      coefficients.set(feature, coefficients_array[i + 1]);
    });
    
    return { intercept, coefficients };
  }
  
  /**
   * Matrix inversion for solving normal equation
   */
  private invertMatrix(matrix: number[][]) {
    const n = matrix.length;
    
    // Create the identity matrix
    const identity = new Array(n).fill(0).map((_, i) => 
      new Array(n).fill(0).map((_, j) => i === j ? 1 : 0)
    );
    
    // Create a copy of the matrix
    const augmented = matrix.map(row => [...row]);
    
    // Augment the matrix with the identity matrix
    for (let i = 0; i < n; i++) {
      augmented[i] = [...augmented[i], ...identity[i]];
    }
    
    // Gaussian elimination with partial pivoting
    for (let i = 0; i < n; i++) {
      // Find pivot
      let max_val = Math.abs(augmented[i][i]);
      let max_row = i;
      
      for (let j = i + 1; j < n; j++) {
        if (Math.abs(augmented[j][i]) > max_val) {
          max_val = Math.abs(augmented[j][i]);
          max_row = j;
        }
      }
      
      // Swap rows if necessary
      if (max_row !== i) {
        [augmented[i], augmented[max_row]] = [augmented[max_row], augmented[i]];
      }
      
      // Scale pivot row
      const pivot = augmented[i][i];
      
      for (let j = i; j < 2 * n; j++) {
        augmented[i][j] /= pivot;
      }
      
      // Eliminate other rows
      for (let j = 0; j < n; j++) {
        if (j !== i) {
          const factor = augmented[j][i];
          
          for (let k = i; k < 2 * n; k++) {
            augmented[j][k] -= factor * augmented[i][k];
          }
        }
      }
    }
    
    // Extract inverse from augmented matrix
    const inverse = new Array(n).fill(0).map(() => new Array(n).fill(0));
    
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        inverse[i][j] = augmented[i][j + n];
      }
    }
    
    return inverse;
  }
  
  /**
   * Multiply matrix by vector
   */
  private multiplyMatrixVector(matrix: number[][], vector: number[]) {
    const n = matrix.length;
    const result = new Array(n).fill(0);
    
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        result[i] += matrix[i][j] * vector[j];
      }
    }
    
    return result;
  }

  /**
   * Normalize input for prediction
   */
  private normalizeInput(input: number[]): number[] {
    if (!this.trainingStats) return input;
    
    return input.map((value, i) => {
      const feature = this.features[i];
      const mean = this.trainingStats?.meanValues.get(feature) || 0;
      const std = this.trainingStats?.stdValues.get(feature) || 1;
      return (value - mean) / std;
    });
  }

  /**
   * Calculate feature importance
   */
  private calculateFeatureImportance() {
    if (!this.trainingStats) return;
    
    const importance: FeatureImportance[] = [];
    
    this.features.forEach(feature => {
      const coefficient = this.coefficients.get(feature) || 0;
      const std = this.trainingStats?.stdValues.get(feature) || 1;
      
      // Calculate standardized coefficient (importance)
      const standardizedCoef = Math.abs(coefficient * std / (this.trainingStats?.stdTarget || 1));
      
      importance.push({
        feature,
        importance: standardizedCoef,
        coefficient
      });
    });
    
    // Sort by importance (descending)
    this.featureImportance = importance.sort((a, b) => b.importance - a.importance);
  }

  /**
   * Validate that features have sufficient data
   */
  private validateFeatures(features: string[], properties: Property[]): boolean {
    const threshold = 0.5; // At least 50% of properties should have the feature
    
    for (const feature of features) {
      const validCount = properties.filter(p => {
        const value = p[feature as keyof Property];
        return value !== undefined && value !== null;
      }).length;
      
      const ratio = validCount / properties.length;
      
      if (ratio < threshold) {
        return false;
      }
    }
    
    // Also check target values
    const validTargets = properties.filter(p => p.value !== undefined && p.value !== null).length;
    const targetRatio = validTargets / properties.length;
    
    return targetRatio >= threshold;
  }
}