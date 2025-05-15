import { Property } from '@/shared/schema';

/**
 * Kernel type for weighted regression and GWR
 */
export enum KernelType {
  Gaussian = 'gaussian',
  Bisquare = 'bisquare',
  Tricube = 'tricube',
  Exponential = 'exponential'
}

/**
 * Data transformation types
 */
export enum TransformType {
  None = 'none',
  Log = 'log',
  Sqrt = 'sqrt',
  Square = 'square',
  Inverse = 'inverse'
}

/**
 * Interface for a regression model
 */
export interface RegressionModel {
  id?: number;
  targetVariable: string;
  usedVariables: string[];
  coefficients: { [key: string]: number };
  standardErrors: { [key: string]: number };
  tValues: { [key: string]: number };
  pValues: { [key: string]: number };
  rSquared: number;
  adjustedRSquared: number;
  akaikeInformationCriterion: number;
  rootMeanSquareError: number;
  meanAbsoluteError: number;
  meanAbsolutePercentageError: number;
  actualValues: number[];
  predictedValues: number[];
  residuals: number[];
  regressionType: string;
  modelName?: string;
  createdAt?: Date;
  updatedAt?: Date;
  
  // Optional diagnostics
  diagnostics?: {
    normality?: {
      statistic: number;
      pValue: number;
      normal: boolean;
    };
    heteroscedasticity?: {
      statistic: number;
      pValue: number;
      homoscedastic: boolean;
    };
    multicollinearity?: {
      varianceInflationFactors: { [key: string]: number };
      hasMulticollinearity: boolean;
    };
    spatialAutocorrelation?: {
      moransI: number;
      pValue: number;
      hasAutocorrelation: boolean;
    };
  };
}

/**
 * Model configuration for regression
 */
export interface RegressionModelConfig {
  modelName?: string;
  kernelType?: KernelType;
  distanceMetric?: 'euclidean' | 'manhattan' | 'haversine';
  bandwidth?: number;
  adaptiveBandwidth?: boolean;
  spatialWeights?: boolean;
  polynomialDegree?: number;
  includeInteractions?: boolean;
  weightVariable?: string | null;
  dataTransforms?: { [key: string]: TransformType };
  robustStandardErrors?: boolean;
}

/**
 * Calculate spatial weights matrix based on property locations
 */
function calculateSpatialWeights(
  properties: Property[],
  bandwidth = 0.15,
  adaptiveBandwidth = false,
  kernelType: KernelType = KernelType.Gaussian,
  distanceMetric: 'euclidean' | 'manhattan' | 'haversine' = 'euclidean'
): number[][] {
  const n = properties.length;
  const weights: number[][] = Array(n).fill(0).map(() => Array(n).fill(0));
  
  // Calculate distances between all properties
  const distances: number[][] = [];
  for (let i = 0; i < n; i++) {
    distances[i] = [];
    for (let j = 0; j < n; j++) {
      if (i === j) {
        distances[i][j] = 0;
      } else {
        distances[i][j] = calculateDistance(properties[i], properties[j], distanceMetric);
      }
    }
  }
  
  // If adaptive bandwidth, calculate bandwidth for each location
  const bandwidths: number[] = [];
  if (adaptiveBandwidth) {
    for (let i = 0; i < n; i++) {
      // Sort distances for this location
      const sortedDists = [...distances[i]].sort((a, b) => a - b);
      // Use the kth nearest neighbor distance as bandwidth
      const k = Math.max(10, Math.floor(n * bandwidth));
      bandwidths[i] = sortedDists[Math.min(k, n - 1)];
    }
  }
  
  // Calculate weights
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const b = adaptiveBandwidth ? bandwidths[i] : bandwidth;
      weights[i][j] = calculateKernelWeight(distances[i][j], b, kernelType);
    }
  }
  
  return weights;
}

/**
 * Calculate distance between two properties
 */
function calculateDistance(
  property1: Property,
  property2: Property,
  distanceMetric: 'euclidean' | 'manhattan' | 'haversine' = 'euclidean'
): number {
  // Need to ensure we have coordinates
  const lat1 = property1.latitude ? parseFloat(property1.latitude.toString()) : 0;
  const lon1 = property1.longitude ? parseFloat(property1.longitude.toString()) : 0;
  const lat2 = property2.latitude ? parseFloat(property2.latitude.toString()) : 0;
  const lon2 = property2.longitude ? parseFloat(property2.longitude.toString()) : 0;
  
  if (distanceMetric === 'euclidean') {
    return Math.sqrt(Math.pow(lat1 - lat2, 2) + Math.pow(lon1 - lon2, 2));
  } else if (distanceMetric === 'manhattan') {
    return Math.abs(lat1 - lat2) + Math.abs(lon1 - lon2);
  } else if (distanceMetric === 'haversine') {
    // Haversine formula for calculating distance on a sphere (Earth)
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
  
  return 0;
}

/**
 * Calculate kernel weight based on distance
 */
function calculateKernelWeight(
  distance: number,
  bandwidth: number,
  kernelType: KernelType
): number {
  if (distance > bandwidth) {
    return 0;
  }
  
  const ratio = distance / bandwidth;
  
  switch (kernelType) {
    case KernelType.Gaussian:
      return Math.exp(-0.5 * Math.pow(ratio, 2));
    case KernelType.Bisquare:
      return Math.pow(1 - Math.pow(ratio, 2), 2);
    case KernelType.Tricube:
      return Math.pow(1 - Math.pow(Math.abs(ratio), 3), 3);
    case KernelType.Exponential:
      return Math.exp(-ratio);
    default:
      return Math.exp(-0.5 * Math.pow(ratio, 2)); // Default to Gaussian
  }
}

/**
 * Transform a value using the specified transformation
 */
function transformValue(value: number, transform: TransformType): number {
  switch (transform) {
    case TransformType.Log:
      return Math.log(Math.max(0.0001, value));
    case TransformType.Sqrt:
      return Math.sqrt(Math.max(0, value));
    case TransformType.Square:
      return value * value;
    case TransformType.Inverse:
      return 1 / (Math.abs(value) < 0.0001 ? 0.0001 : value);
    case TransformType.None:
    default:
      return value;
  }
}

/**
 * Calculate OLS regression model
 */
export function calculateOLSRegression(
  properties: Property[],
  targetVariable: string,
  independentVariables: string[],
  config: RegressionModelConfig = {}
): RegressionModel {
  const { X, y } = extractDataArrays(properties, targetVariable, independentVariables, config);
  
  // Add intercept to X
  const XWithIntercept = X.map(row => [1, ...row]);
  
  // Calculate coefficients and predictions
  const betaCoefficients = performOLS(XWithIntercept, y);
  
  // Create variable names with intercept
  const variableNames = ['(Intercept)', ...independentVariables];
  
  // Calculate predicted values and residuals
  const predictedValues = XWithIntercept.map(row => 
    row.reduce((sum, value, i) => sum + value * betaCoefficients[i], 0)
  );
  const residuals = y.map((actual, i) => actual - predictedValues[i]);
  
  // Calculate R-squared
  const yMean = y.reduce((sum, val) => sum + val, 0) / y.length;
  const totalSS = y.reduce((sum, val) => sum + Math.pow(val - yMean, 2), 0);
  const residualSS = residuals.reduce((sum, val) => sum + val * val, 0);
  const rSquared = 1 - (residualSS / totalSS);
  
  // Calculate adjusted R-squared
  const n = y.length;
  const p = independentVariables.length + 1; // +1 for intercept
  const adjustedRSquared = 1 - ((1 - rSquared) * (n - 1) / (n - p));
  
  // Calculate AIC
  const akaikeInformationCriterion = n * Math.log(residualSS / n) + 2 * p;
  
  // Calculate RMSE, MAE, and MAPE
  const rootMeanSquareError = Math.sqrt(residualSS / n);
  const meanAbsoluteError = residuals.reduce((sum, val) => sum + Math.abs(val), 0) / n;
  const meanAbsolutePercentageError = y.reduce((sum, val, i) => {
    const pctError = Math.abs(residuals[i] / val) * 100;
    return sum + (isFinite(pctError) ? pctError : 0);
  }, 0) / n;
  
  // Calculate standard errors, t-values, and p-values
  const { standardErrors, tValues, pValues } = calculateModelDiagnostics(
    XWithIntercept, y, betaCoefficients, residuals
  );
  
  // Create coefficient mappings
  const coefficients: { [key: string]: number } = {};
  const stdErrorsMap: { [key: string]: number } = {};
  const tValuesMap: { [key: string]: number } = {};
  const pValuesMap: { [key: string]: number } = {};
  
  variableNames.forEach((name, i) => {
    coefficients[name] = betaCoefficients[i];
    stdErrorsMap[name] = standardErrors[i];
    tValuesMap[name] = tValues[i];
    pValuesMap[name] = pValues[i];
  });
  
  const model: RegressionModel = {
    targetVariable,
    usedVariables: variableNames,
    coefficients,
    standardErrors: stdErrorsMap,
    tValues: tValuesMap,
    pValues: pValuesMap,
    rSquared,
    adjustedRSquared,
    akaikeInformationCriterion,
    rootMeanSquareError,
    meanAbsoluteError,
    meanAbsolutePercentageError,
    actualValues: y,
    predictedValues,
    residuals,
    regressionType: 'OLS',
    modelName: config.modelName || 'OLS Regression Model',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  return model;
}

/**
 * Calculate weighted regression model
 */
export function calculateWeightedRegression(
  properties: Property[],
  targetVariable: string,
  independentVariables: string[],
  config: RegressionModelConfig = {}
): RegressionModel {
  const { X, y } = extractDataArrays(properties, targetVariable, independentVariables, config);
  
  // Get weights from config or default to equal weights
  let weights: number[] = [];
  if (config.weightVariable && properties.length > 0) {
    const firstProperty = properties[0];
    if (firstProperty && firstProperty[config.weightVariable as keyof Property]) {
      // Attempt to use the specified property field as weights
      weights = properties.map(p => {
        const value = p[config.weightVariable as keyof Property];
        if (typeof value === 'number') return value;
        if (typeof value === 'string') return parseFloat(value) || 1;
        return 1;
      });
    }
  }
  
  // Normalize weights
  if (weights.length === 0) {
    weights = new Array(properties.length).fill(1);
  }
  const weightSum = weights.reduce((sum, w) => sum + w, 0);
  weights = weights.map(w => w * (weights.length / weightSum));
  
  // Add intercept to X
  const XWithIntercept = X.map(row => [1, ...row]);
  
  // Calculate coefficients with weights
  const betaCoefficients = performWeightedOLS(XWithIntercept, y, weights);
  
  // Create variable names with intercept
  const variableNames = ['(Intercept)', ...independentVariables];
  
  // Calculate predicted values and residuals
  const predictedValues = XWithIntercept.map(row => 
    row.reduce((sum, value, i) => sum + value * betaCoefficients[i], 0)
  );
  const residuals = y.map((actual, i) => actual - predictedValues[i]);
  
  // Calculate weighted R-squared (weighted version of OLS R-squared)
  const weightedY = y.map((val, i) => val * weights[i]);
  const weightedYMean = weightedY.reduce((sum, val) => sum + val, 0) / weights.reduce((sum, w) => sum + w, 0);
  const weightedTotalSS = y.reduce((sum, val, i) => sum + weights[i] * Math.pow(val - weightedYMean, 2), 0);
  const weightedResidualSS = residuals.reduce((sum, val, i) => sum + weights[i] * val * val, 0);
  const rSquared = 1 - (weightedResidualSS / weightedTotalSS);
  
  // Calculate adjusted R-squared
  const n = y.length;
  const p = independentVariables.length + 1; // +1 for intercept
  const adjustedRSquared = 1 - ((1 - rSquared) * (n - 1) / (n - p));
  
  // Calculate AIC for weighted regression
  const akaikeInformationCriterion = n * Math.log(weightedResidualSS / n) + 2 * p;
  
  // Calculate weighted RMSE, MAE, and MAPE
  const rootMeanSquareError = Math.sqrt(weightedResidualSS / n);
  const meanAbsoluteError = residuals.reduce((sum, val, i) => sum + weights[i] * Math.abs(val), 0) / weights.reduce((sum, w) => sum + w, 0);
  const meanAbsolutePercentageError = y.reduce((sum, val, i) => {
    const pctError = Math.abs(residuals[i] / val) * 100;
    return sum + weights[i] * (isFinite(pctError) ? pctError : 0);
  }, 0) / weights.reduce((sum, w) => sum + w, 0);
  
  // Calculate standard errors, t-values, and p-values for weighted regression
  const { standardErrors, tValues, pValues } = calculateModelDiagnostics(
    XWithIntercept, y, betaCoefficients, residuals, weights
  );
  
  // Create coefficient mappings
  const coefficients: { [key: string]: number } = {};
  const stdErrorsMap: { [key: string]: number } = {};
  const tValuesMap: { [key: string]: number } = {};
  const pValuesMap: { [key: string]: number } = {};
  
  variableNames.forEach((name, i) => {
    coefficients[name] = betaCoefficients[i];
    stdErrorsMap[name] = standardErrors[i];
    tValuesMap[name] = tValues[i];
    pValuesMap[name] = pValues[i];
  });
  
  const model: RegressionModel = {
    targetVariable,
    usedVariables: variableNames,
    coefficients,
    standardErrors: stdErrorsMap,
    tValues: tValuesMap,
    pValues: pValuesMap,
    rSquared,
    adjustedRSquared,
    akaikeInformationCriterion,
    rootMeanSquareError,
    meanAbsoluteError,
    meanAbsolutePercentageError,
    actualValues: y,
    predictedValues,
    residuals,
    regressionType: 'Weighted',
    modelName: config.modelName || 'Weighted Regression Model',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  return model;
}

/**
 * Calculate geographically weighted regression model
 */
export function calculateGWRRegression(
  properties: Property[],
  targetVariable: string,
  independentVariables: string[],
  config: RegressionModelConfig = {}
): RegressionModel {
  const { X, y } = extractDataArrays(properties, targetVariable, independentVariables, config);
  
  // Add intercept to X
  const XWithIntercept = X.map(row => [1, ...row]);
  
  // Calculate spatial weights
  const spatialWeights = calculateSpatialWeights(
    properties,
    config.bandwidth || 0.15,
    config.adaptiveBandwidth || false,
    config.kernelType || KernelType.Gaussian,
    config.distanceMetric || 'euclidean'
  );
  
  // For GWR, we need local coefficients for each location
  const n = properties.length;
  const p = independentVariables.length + 1; // +1 for intercept
  
  // Calculate local coefficients for each location
  const localCoefficients: number[][] = [];
  for (let i = 0; i < n; i++) {
    // Get weights for this location
    const locationWeights = spatialWeights[i];
    
    // Calculate coefficients with these weights
    const betaCoefficients = performWeightedOLS(XWithIntercept, y, locationWeights);
    localCoefficients.push(betaCoefficients);
  }
  
  // Calculate predicted values and residuals using local coefficients
  const predictedValues = XWithIntercept.map((row, i) => 
    row.reduce((sum, value, j) => sum + value * localCoefficients[i][j], 0)
  );
  const residuals = y.map((actual, i) => actual - predictedValues[i]);
  
  // Calculate R-squared for the whole model
  const yMean = y.reduce((sum, val) => sum + val, 0) / y.length;
  const totalSS = y.reduce((sum, val) => sum + Math.pow(val - yMean, 2), 0);
  const residualSS = residuals.reduce((sum, val) => sum + val * val, 0);
  const rSquared = 1 - (residualSS / totalSS);
  
  // Calculate adjusted R-squared (GWR adjustment is more complex - this is simplified)
  const effectiveDOF = p * Math.sqrt(n); // Approximate effective degrees of freedom for GWR
  const adjustedRSquared = 1 - ((1 - rSquared) * (n - 1) / (n - effectiveDOF));
  
  // Calculate AIC for GWR (approximation)
  const akaikeInformationCriterion = n * Math.log(residualSS / n) + 2 * effectiveDOF;
  
  // Calculate RMSE, MAE, and MAPE
  const rootMeanSquareError = Math.sqrt(residualSS / n);
  const meanAbsoluteError = residuals.reduce((sum, val) => sum + Math.abs(val), 0) / n;
  const meanAbsolutePercentageError = y.reduce((sum, val, i) => {
    const pctError = Math.abs(residuals[i] / val) * 100;
    return sum + (isFinite(pctError) ? pctError : 0);
  }, 0) / n;
  
  // For simplicity, we'll average the local coefficients to get global estimates
  const averageCoefficients = new Array(p).fill(0);
  for (let j = 0; j < p; j++) {
    for (let i = 0; i < n; i++) {
      averageCoefficients[j] += localCoefficients[i][j];
    }
    averageCoefficients[j] /= n;
  }
  
  // Create variable names with intercept
  const variableNames = ['(Intercept)', ...independentVariables];
  
  // Calculate standard errors and t-values for average coefficients
  const { standardErrors, tValues, pValues } = calculateModelDiagnostics(
    XWithIntercept, y, averageCoefficients, residuals
  );
  
  // Create coefficient mappings
  const coefficients: { [key: string]: number } = {};
  const stdErrorsMap: { [key: string]: number } = {};
  const tValuesMap: { [key: string]: number } = {};
  const pValuesMap: { [key: string]: number } = {};
  
  variableNames.forEach((name, i) => {
    coefficients[name] = averageCoefficients[i];
    stdErrorsMap[name] = standardErrors[i];
    tValuesMap[name] = tValues[i];
    pValuesMap[name] = pValues[i];
  });
  
  const model: RegressionModel = {
    targetVariable,
    usedVariables: variableNames,
    coefficients,
    standardErrors: stdErrorsMap,
    tValues: tValuesMap,
    pValues: pValuesMap,
    rSquared,
    adjustedRSquared,
    akaikeInformationCriterion,
    rootMeanSquareError,
    meanAbsoluteError,
    meanAbsolutePercentageError,
    actualValues: y,
    predictedValues,
    residuals,
    regressionType: 'GWR',
    modelName: config.modelName || 'Geographically Weighted Regression Model',
    createdAt: new Date(),
    updatedAt: new Date(),
    
    // Add spatial diagnostics
    diagnostics: {
      spatialAutocorrelation: {
        moransI: calculateMoransI(residuals, spatialWeights),
        pValue: 0.05, // Placeholder
        hasAutocorrelation: false // Placeholder
      }
    }
  };
  
  return model;
}

/**
 * Extract data arrays from properties for regression
 */
function extractDataArrays(
  properties: Property[],
  targetVariable: string,
  independentVariables: string[],
  config: RegressionModelConfig = {}
): { X: number[][], y: number[] } {
  // Prepare arrays for independent (X) and dependent (y) variables
  const X: number[][] = [];
  const y: number[] = [];
  
  // Get transforms if specified
  const transforms = config.dataTransforms || {};
  
  // Extract values from properties
  for (const property of properties) {
    // Extract dependent variable (targetVariable)
    let yValue = 0;
    if (property[targetVariable as keyof Property] !== undefined) {
      const rawValue = property[targetVariable as keyof Property];
      if (typeof rawValue === 'number') {
        yValue = rawValue;
      } else if (typeof rawValue === 'string') {
        yValue = parseFloat(rawValue) || 0;
      }
    }
    
    // Apply transform to target variable if specified
    if (transforms[targetVariable]) {
      yValue = transformValue(yValue, transforms[targetVariable]);
    }
    
    // Extract independent variables
    const xRow: number[] = [];
    for (const varName of independentVariables) {
      let xValue = 0;
      if (property[varName as keyof Property] !== undefined) {
        const rawValue = property[varName as keyof Property];
        if (typeof rawValue === 'number') {
          xValue = rawValue;
        } else if (typeof rawValue === 'string') {
          xValue = parseFloat(rawValue) || 0;
        }
      }
      
      // Apply transform if specified
      if (transforms[varName]) {
        xValue = transformValue(xValue, transforms[varName]);
      }
      
      xRow.push(xValue);
    }
    
    X.push(xRow);
    y.push(yValue);
  }
  
  return { X, y };
}

/**
 * Build design matrix and response vector for regression
 */
function buildDesignMatrix(
  X: number[][],
  polynomial = 1,
  includeInteractions = false
): number[][] {
  const n = X.length;
  const p = X[0].length;
  const result: number[][] = [];
  
  for (let i = 0; i < n; i++) {
    const row: number[] = [];
    
    // Include original variables
    for (let j = 0; j < p; j++) {
      row.push(X[i][j]);
    }
    
    // Include polynomial terms up to the specified degree
    if (polynomial > 1) {
      for (let power = 2; power <= polynomial; power++) {
        for (let j = 0; j < p; j++) {
          row.push(Math.pow(X[i][j], power));
        }
      }
    }
    
    // Include interaction terms if requested
    if (includeInteractions && p > 1) {
      for (let j = 0; j < p - 1; j++) {
        for (let k = j + 1; k < p; k++) {
          row.push(X[i][j] * X[i][k]);
        }
      }
    }
    
    result.push(row);
  }
  
  return result;
}

/**
 * Perform ordinary least squares regression
 */
function performOLS(
  X: number[][],
  y: number[]
): number[] {
  // Transpose X for matrix operations
  const Xt = matrixTranspose(X);
  
  // Calculate X'X
  const XtX = matrixMultiply(Xt, X);
  
  // Calculate (X'X)^-1
  const XtXInv = matrixInverse(XtX);
  
  // Calculate X'y
  const Xty = matrixMultiply(Xt, [y])[0];
  
  // Calculate (X'X)^-1 X'y
  return matrixMultiply(XtXInv, [Xty])[0];
}

/**
 * Perform weighted least squares regression
 */
function performWeightedOLS(
  X: number[][],
  y: number[],
  weights: number[]
): number[] {
  const n = X.length;
  const p = X[0].length;
  
  // Create weighted X and y
  const wX: number[][] = [];
  const wy: number[] = [];
  
  for (let i = 0; i < n; i++) {
    const sqrtW = Math.sqrt(weights[i]);
    wX.push(X[i].map(x => x * sqrtW));
    wy.push(y[i] * sqrtW);
  }
  
  // Perform OLS on weighted data
  return performOLS(wX, wy);
}

/**
 * Calculate model diagnostics for regression model
 */
function calculateModelDiagnostics(
  X: number[][],
  y: number[],
  beta: number[],
  residuals: number[],
  weights?: number[]
): {
  standardErrors: number[];
  tValues: number[];
  pValues: number[];
} {
  const n = X.length;
  const p = X[0].length;
  
  // Calculate weighted or unweighted X'X
  let XtX: number[][];
  if (weights) {
    // Create weighted X
    const wX: number[][] = [];
    for (let i = 0; i < n; i++) {
      const sqrtW = Math.sqrt(weights[i]);
      wX.push(X[i].map(x => x * sqrtW));
    }
    
    // Calculate X'X with weights
    const wXt = matrixTranspose(wX);
    XtX = matrixMultiply(wXt, wX);
  } else {
    // Calculate regular X'X
    const Xt = matrixTranspose(X);
    XtX = matrixMultiply(Xt, X);
  }
  
  // Calculate (X'X)^-1
  const XtXInv = matrixInverse(XtX);
  
  // Calculate mean squared error
  const residualSS = residuals.reduce((sum, r, i) => {
    if (weights) {
      return sum + weights[i] * r * r;
    }
    return sum + r * r;
  }, 0);
  const mse = residualSS / (n - p);
  
  // Calculate standard errors
  const standardErrors = XtXInv.map(row => Math.sqrt(row[XtXInv.indexOf(row)] * mse));
  
  // Calculate t-values
  const tValues = beta.map((b, i) => b / standardErrors[i]);
  
  // Calculate p-values (two-tailed t-test)
  const df = n - p;
  const pValues = tValues.map(t => 2 * (1 - tCDF(Math.abs(t), df)));
  
  return { standardErrors, tValues, pValues };
}

/**
 * Calculate Moran's I statistic for spatial autocorrelation
 */
function calculateMoransI(values: number[], weights: number[][]): number {
  const n = values.length;
  const mean = values.reduce((sum, v) => sum + v, 0) / n;
  
  // Calculate deviations from mean
  const deviations = values.map(v => v - mean);
  
  // Calculate numerator (weighted cross-products)
  let numerator = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      numerator += weights[i][j] * deviations[i] * deviations[j];
    }
  }
  
  // Calculate denominator (sum of squared deviations)
  const denominator = deviations.reduce((sum, d) => sum + d * d, 0);
  
  // Calculate sum of weights
  let W = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      W += weights[i][j];
    }
  }
  
  // Calculate Moran's I
  return (n / W) * (numerator / denominator);
}

/**
 * Predict values using a regression model
 */
export function predictWithModel(
  model: RegressionModel,
  properties: Property[],
  config: RegressionModelConfig = {}
): number[] {
  // Extract values from properties for independent variables
  const X: number[][] = [];
  for (const property of properties) {
    const xRow: number[] = [];
    
    // Add intercept term
    xRow.push(1);
    
    // Add values for each independent variable
    for (const varName of model.usedVariables.slice(1)) { // Skip the intercept
      let xValue = 0;
      if (property[varName as keyof Property] !== undefined) {
        const rawValue = property[varName as keyof Property];
        if (typeof rawValue === 'number') {
          xValue = rawValue;
        } else if (typeof rawValue === 'string') {
          xValue = parseFloat(rawValue) || 0;
        }
      }
      
      // Apply transform if specified
      if (config.dataTransforms && config.dataTransforms[varName]) {
        xValue = transformValue(xValue, config.dataTransforms[varName]);
      }
      
      xRow.push(xValue);
    }
    
    X.push(xRow);
  }
  
  // Calculate predictions using the model coefficients
  const predictions = X.map(row => {
    let prediction = 0;
    for (let i = 0; i < model.usedVariables.length; i++) {
      const varName = model.usedVariables[i];
      prediction += row[i] * model.coefficients[varName];
    }
    return prediction;
  });
  
  return predictions;
}

/**
 * Calculate variable importance for a regression model
 */
export function calculateVariableImportance(model: RegressionModel): { [key: string]: number } {
  const importance: { [key: string]: number } = {};
  
  // Skip the intercept
  const variables = model.usedVariables.filter(v => v !== '(Intercept)');
  
  // Calculate the absolute t-values
  const tStats = variables.map(v => Math.abs(model.tValues[v]));
  const tTotal = tStats.reduce((sum, t) => sum + t, 0);
  
  // Normalize by the sum of absolute t-values
  if (tTotal > 0) {
    variables.forEach((v, i) => {
      importance[v] = tStats[i] / tTotal;
    });
  } else {
    // Fallback to equal importance if t-values are all zero
    variables.forEach(v => {
      importance[v] = 1 / variables.length;
    });
  }
  
  // Add the intercept with zero importance
  importance['(Intercept)'] = 0;
  
  return importance;
}

/**
 * Calculate model quality metrics and diagnostics
 */
export function calculateModelQuality(model: RegressionModel): {
  quality: 'excellent' | 'good' | 'moderate' | 'poor' | 'very poor';
  strengths: string[];
  weaknesses: string[];
} {
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  
  // Check R-squared
  if (model.rSquared > 0.8) {
    strengths.push(`High R² (${(model.rSquared * 100).toFixed(1)}%) indicates excellent goodness of fit.`);
  } else if (model.rSquared > 0.6) {
    strengths.push(`Good R² (${(model.rSquared * 100).toFixed(1)}%) indicates good explanatory power.`);
  } else if (model.rSquared > 0.4) {
    strengths.push(`Moderate R² (${(model.rSquared * 100).toFixed(1)}%) indicates reasonable explanatory power.`);
  } else if (model.rSquared > 0.2) {
    weaknesses.push(`Low R² (${(model.rSquared * 100).toFixed(1)}%) indicates poor explanatory power.`);
  } else {
    weaknesses.push(`Very low R² (${(model.rSquared * 100).toFixed(1)}%) indicates very poor explanatory power.`);
  }
  
  // Check MAPE
  if (model.meanAbsolutePercentageError < 5) {
    strengths.push(`Low MAPE (${model.meanAbsolutePercentageError.toFixed(1)}%) indicates excellent prediction accuracy.`);
  } else if (model.meanAbsolutePercentageError < 10) {
    strengths.push(`Good MAPE (${model.meanAbsolutePercentageError.toFixed(1)}%) indicates good prediction accuracy.`);
  } else if (model.meanAbsolutePercentageError < 20) {
    weaknesses.push(`Moderate MAPE (${model.meanAbsolutePercentageError.toFixed(1)}%) indicates room for improvement in prediction accuracy.`);
  } else {
    weaknesses.push(`High MAPE (${model.meanAbsolutePercentageError.toFixed(1)}%) indicates poor prediction accuracy.`);
  }
  
  // Check significant variables
  const significantVars = model.usedVariables.filter(v => v !== '(Intercept)' && model.pValues[v] < 0.05);
  if (significantVars.length > 0) {
    if (significantVars.length === model.usedVariables.length - 1) { // All variables are significant
      strengths.push(`All variables are statistically significant (p < 0.05).`);
    } else {
      strengths.push(`${significantVars.length} out of ${model.usedVariables.length - 1} variables are statistically significant.`);
    }
  } else if (model.usedVariables.length > 1) {
    weaknesses.push(`No variables are statistically significant (p < 0.05).`);
  }
  
  // Check multicollinearity if available
  if (model.diagnostics?.multicollinearity) {
    if (model.diagnostics.multicollinearity.hasMulticollinearity) {
      weaknesses.push(`Multicollinearity detected, which can affect coefficient interpretation.`);
    } else {
      strengths.push(`No significant multicollinearity issues detected.`);
    }
  }
  
  // Check spatial autocorrelation if available
  if (model.diagnostics?.spatialAutocorrelation) {
    if (model.diagnostics.spatialAutocorrelation.hasAutocorrelation) {
      weaknesses.push(`Spatial autocorrelation in residuals detected, suggesting spatial patterns not captured by the model.`);
    } else {
      strengths.push(`No significant spatial autocorrelation in residuals.`);
    }
  }
  
  // Determine overall quality
  let quality: 'excellent' | 'good' | 'moderate' | 'poor' | 'very poor';
  if (model.rSquared > 0.8 && model.meanAbsolutePercentageError < 10) {
    quality = 'excellent';
  } else if (model.rSquared > 0.6 && model.meanAbsolutePercentageError < 15) {
    quality = 'good';
  } else if (model.rSquared > 0.4 && model.meanAbsolutePercentageError < 20) {
    quality = 'moderate';
  } else if (model.rSquared > 0.2) {
    quality = 'poor';
  } else {
    quality = 'very poor';
  }
  
  return { quality, strengths, weaknesses };
}

// Utility functions for matrix operations

function matrixTranspose(A: number[][]): number[][] {
  const m = A.length;
  const n = A[0].length;
  const result: number[][] = [];
  
  for (let j = 0; j < n; j++) {
    result[j] = [];
    for (let i = 0; i < m; i++) {
      result[j][i] = A[i][j];
    }
  }
  
  return result;
}

/**
 * Matrix multiplication
 */
function matrixMultiply(A: number[][], B: number[][]): number[][] {
  const m = A.length;
  const n = A[0].length;
  const p = B[0].length;
  const result: number[][] = [];
  
  for (let i = 0; i < m; i++) {
    result[i] = [];
    for (let j = 0; j < p; j++) {
      let sum = 0;
      for (let k = 0; k < n; k++) {
        sum += A[i][k] * B[k][j];
      }
      result[i][j] = sum;
    }
  }
  
  return result;
}

/**
 * Matrix inverse (Gauss-Jordan elimination)
 */
function matrixInverse(A: number[][]): number[][] {
  const n = A.length;
  
  // Create augmented matrix [A|I]
  const augmented: number[][] = [];
  for (let i = 0; i < n; i++) {
    augmented[i] = [...A[i]];
    for (let j = 0; j < n; j++) {
      augmented[i].push(i === j ? 1 : 0);
    }
  }
  
  // Forward elimination
  for (let i = 0; i < n; i++) {
    // Find pivot
    let maxRow = i;
    let maxVal = Math.abs(augmented[i][i]);
    for (let j = i + 1; j < n; j++) {
      const absVal = Math.abs(augmented[j][i]);
      if (absVal > maxVal) {
        maxRow = j;
        maxVal = absVal;
      }
    }
    
    // Swap rows if necessary
    if (maxRow !== i) {
      [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]];
    }
    
    // Scale pivot row
    const pivot = augmented[i][i];
    if (Math.abs(pivot) < 1e-10) {
      throw new Error('Matrix is singular or nearly singular');
    }
    
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
  
  // Extract right half of augmented matrix (the inverse)
  const inverse: number[][] = [];
  for (let i = 0; i < n; i++) {
    inverse[i] = augmented[i].slice(n);
  }
  
  return inverse;
}

// Statistical utility functions

function tCDF(t: number, df: number): number {
  // Simple approximation of t-distribution CDF
  if (df <= 0) throw new Error('Degrees of freedom must be positive');
  
  // For large df, t-distribution approximates normal distribution
  if (df > 30) {
    return normalCDF(t);
  }
  
  // Calculate probability from beta distribution
  const x = df / (df + t * t);
  return 1 - 0.5 * incompleteBeta(x, df / 2, 0.5);
}

/**
 * Chi-square cumulative distribution function
 */
function chiSquareCDF(x: number, k: number): number {
  if (x <= 0) return 0;
  // k is degrees of freedom
  return lowerGamma(k / 2, x / 2) / gamma(k / 2);
}

/**
 * Normal cumulative distribution function
 */
function normalCDF(z: number): number {
  // Approximation of the normal CDF
  const b1 = 0.319381530;
  const b2 = -0.356563782;
  const b3 = 1.781477937;
  const b4 = -1.821255978;
  const b5 = 1.330274429;
  const p = 0.2316419;
  const c = 0.39894228;
  
  if (z >= 0) {
    const t = 1.0 / (1.0 + p * z);
    return 1.0 - c * Math.exp(-z * z / 2) * t * (t * (t * (t * (t * b5 + b4) + b3) + b2) + b1);
  } else {
    const t = 1.0 / (1.0 - p * z);
    return c * Math.exp(-z * z / 2) * t * (t * (t * (t * (t * b5 + b4) + b3) + b2) + b1);
  }
}

/**
 * Lower incomplete gamma function approximation
 */
function lowerGamma(a: number, x: number): number {
  // Approximation of the lower incomplete gamma function
  if (x <= 0) return 0;
  
  // Series expansion
  let sum = 0;
  let term = 1 / a;
  for (let i = 1; i <= 100; i++) {
    sum += term;
    term *= x / (a + i);
    if (term < 1e-10) break;
  }
  
  return Math.pow(x, a) * Math.exp(-x) * sum;
}

/**
 * Gamma function approximation
 */
function gamma(z: number): number {
  // Approximation of the gamma function using Lanczos approximation
  if (z < 0.5) {
    return Math.PI / (Math.sin(Math.PI * z) * gamma(1 - z));
  }
  
  z -= 1;
  const p = [0.99999999999980993, 676.5203681218851, -1259.1392167224028,
            771.32342877765313, -176.61502916214059, 12.507343278686905,
            -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
  
  let x = p[0];
  for (let i = 1; i < p.length; i++) {
    x += p[i] / (z + i);
  }
  
  const t = z + p.length - 1.5;
  return Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x;
}

/**
 * Incomplete beta function approximation
 */
function incompleteBeta(x: number, a: number, b: number): number {
  // Approximation of the incomplete beta function
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  
  // Use continued fraction representation
  const epslon = 1e-10;
  const maxIterations = 100;
  
  const qab = a + b;
  const qap = a + 1;
  const qam = a - 1;
  
  let m = 0; // Counter for iterations
  let h = 1.0; // Initial approximation
  let c = 1.0;
  let d = 1.0 - qab * x / qap;
  if (Math.abs(d) < epslon) d = epslon;
  d = 1.0 / d;
  
  // Apply continued fraction
  for (let i = 1; i <= maxIterations; i++) {
    m = i;
    const m2 = 2 * m;
    
    // First term
    const aa = m * (b - m) * x / ((qam + m2) * (a + m2));
    d = 1.0 + aa * d;
    if (Math.abs(d) < epslon) d = epslon;
    c = 1.0 + aa / c;
    if (Math.abs(c) < epslon) c = epslon;
    d = 1.0 / d;
    h *= d * c;
    
    // Second term
    const bb = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
    d = 1.0 + bb * d;
    if (Math.abs(d) < epslon) d = epslon;
    c = 1.0 + bb / c;
    if (Math.abs(c) < epslon) c = epslon;
    d = 1.0 / d;
    const del = d * c;
    h *= del;
    
    // Check for convergence
    if (Math.abs(del - 1.0) < epslon) break;
  }
  
  // Factor to multiply by
  const bt = Math.exp(a * Math.log(x) + b * Math.log(1.0 - x) -
    Math.log(a) - beta(a, b));
  
  return bt * h / a;
}

/**
 * Beta function approximation
 */
function beta(a: number, b: number): number {
  // Beta function is related to the gamma function
  return gamma(a) * gamma(b) / gamma(a + b);
}