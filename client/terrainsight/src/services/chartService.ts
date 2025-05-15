import { Property } from '@shared/schema';
import { RegressionModel } from './regressionService';

/**
 * Common chart theme settings for consistent styling
 */
export const chartTheme = {
  colors: {
    primary: '#10b981', // emerald-500
    secondary: '#6366f1', // indigo-500
    error: '#ef4444', // red-500
    warning: '#f59e0b', // amber-500
    info: '#3b82f6', // blue-500
    gray: '#9ca3af', // gray-400
    lightGray: '#e5e7eb', // gray-200
    background: '#ffffff', // white
  },
  fontFamily: 'inherit',
  fontSize: 12,
  axisColor: '#9ca3af', // gray-400
  gridColor: '#e5e7eb', // gray-200
};

/**
 * Formats a number as currency
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
};

/**
 * Interface for scatter plot data
 */
export interface ScatterPoint {
  x: number;
  y: number;
  id?: number | string;
  name?: string;
  error?: number;
  errorPercent?: number;
}

/**
 * Generates scatter plot data from regression model
 */
export function generatePredictionScatterData(model: RegressionModel): ScatterPoint[] {
  return model.actualValues.map((actual, index) => {
    const predicted = model.predictedValues[index];
    const error = actual - predicted;
    const errorPercent = (error / actual) * 100;
    
    return {
      x: predicted,
      y: actual,
      id: index,
      error,
      errorPercent,
    };
  });
}

/**
 * Interface for coefficient impact data
 */
export interface CoefficientImpact {
  variable: string;
  coefficient: number;
  impact: number;
  standardError: number;
  tValue: number;
  pValue: number;
  significant: boolean;
}

/**
 * Generates coefficient impact data from regression model
 */
export function generateCoefficientImpactData(model: RegressionModel): CoefficientImpact[] {
  // Calculate the absolute impact of each variable
  const impacts = model.usedVariables.map(variable => {
    const coefficient = model.coefficients[variable];
    const impact = Math.abs(coefficient); // Simple impact measure
    const standardError = model.standardErrors[variable];
    const tValue = model.tValues[variable];
    const pValue = model.pValues[variable];
    const significant = pValue < 0.05;
    
    return {
      variable,
      coefficient,
      impact,
      standardError,
      tValue,
      pValue,
      significant,
    };
  });
  
  // Sort by absolute impact (descending)
  return impacts.sort((a, b) => b.impact - a.impact);
}

/**
 * Interface for histogram bin
 */
export interface HistogramBin {
  min: number;
  max: number;
  count: number;
  frequency: number;
}

/**
 * Generates histogram data from an array of values
 */
export function generateHistogramData(
  values: number[],
  numBins: number = 10
): HistogramBin[] {
  if (values.length === 0) return [];
  
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;
  const binWidth = range / numBins;
  
  // Create empty bins
  const bins: HistogramBin[] = Array(numBins)
    .fill(0)
    .map((_, i) => ({
      min: min + i * binWidth,
      max: min + (i + 1) * binWidth,
      count: 0,
      frequency: 0,
    }));
  
  // Fill bins
  values.forEach(value => {
    // Special case for max value - put it in the last bin
    if (value === max) {
      bins[numBins - 1].count++;
      return;
    }
    
    const binIndex = Math.floor((value - min) / binWidth);
    bins[binIndex].count++;
  });
  
  // Calculate frequencies
  const totalCount = values.length;
  bins.forEach(bin => {
    bin.frequency = bin.count / totalCount;
  });
  
  return bins;
}

/**
 * Interface for correlation matrix cell
 */
export interface CorrelationCell {
  xVariable: string;
  yVariable: string;
  correlation: number;
}

/**
 * Calculates Pearson correlation coefficient between two arrays
 */
function calculateCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length === 0) return 0;
  
  // Calculate means
  const xMean = x.reduce((a, b) => a + b, 0) / x.length;
  const yMean = y.reduce((a, b) => a + b, 0) / y.length;
  
  // Calculate numerator and denominators
  let numerator = 0;
  let xDenom = 0;
  let yDenom = 0;
  
  for (let i = 0; i < x.length; i++) {
    const xDiff = x[i] - xMean;
    const yDiff = y[i] - yMean;
    numerator += xDiff * yDiff;
    xDenom += xDiff * xDiff;
    yDenom += yDiff * yDiff;
  }
  
  // Handle zero denominators
  if (xDenom === 0 || yDenom === 0) return 0;
  
  return numerator / Math.sqrt(xDenom * yDenom);
}

/**
 * Generates correlation matrix data for a set of properties and variables
 */
export function generateCorrelationMatrix(
  properties: Property[],
  variables: string[]
): CorrelationCell[] {
  const cells: CorrelationCell[] = [];
  
  // Extract variable values from properties
  const variableValues: { [key: string]: number[] } = {};
  
  variables.forEach(variable => {
    variableValues[variable] = properties
      .map(property => {
        // Handle nested paths (e.g., 'attributes.squareFeet')
        const parts = variable.split('.');
        let value: any = property;
        
        for (const part of parts) {
          if (value === null || value === undefined) return null;
          value = value[part];
        }
        
        return typeof value === 'number' ? value : null;
      })
      .filter((value): value is number => value !== null);
  });
  
  // Calculate correlations between each pair of variables
  for (let i = 0; i < variables.length; i++) {
    for (let j = 0; j < variables.length; j++) {
      const xVar = variables[i];
      const yVar = variables[j];
      
      const xValues = variableValues[xVar];
      const yValues = variableValues[yVar];
      
      // Only calculate correlation if we have enough data
      if (xValues.length > 2 && yValues.length > 2) {
        // Find common indices (where both variables have values)
        const commonIndices = properties
          .map((_, idx) => idx)
          .filter(
            idx => 
              idx < xValues.length && 
              idx < yValues.length &&
              xValues[idx] !== null && 
              yValues[idx] !== null
          );
        
        const xFiltered = commonIndices.map(idx => xValues[idx]);
        const yFiltered = commonIndices.map(idx => yValues[idx]);
        
        const correlation = calculateCorrelation(xFiltered, yFiltered);
        
        cells.push({
          xVariable: xVar,
          yVariable: yVar,
          correlation,
        });
      } else {
        cells.push({
          xVariable: xVar,
          yVariable: yVar,
          correlation: 0,
        });
      }
    }
  }
  
  return cells;
}

/**
 * Interface for residual map data
 */
export interface ResidualMapPoint {
  id: number;
  latitude: number;
  longitude: number;
  address: string;
  actual: number;
  predicted: number;
  residual: number;
  percentError: number;
  color: string;
}

/**
 * Generates map data for residual visualization
 */
export function generateResidualMapData(
  model: RegressionModel,
  properties: Property[]
): ResidualMapPoint[] {
  // Ensure properties have coordinates
  const validProperties = properties.filter(
    p => p.latitude !== null && p.longitude !== null
  );
  
  if (validProperties.length === 0) return [];
  
  // Get value field from target variable
  const valueField = model.targetVariable;
  
  // Calculate color scale based on residuals
  const maxResidual = Math.max(
    ...model.residuals.map(r => Math.abs(r))
  );
  
  return model.residuals.map((residual, index) => {
    const property = validProperties[index];
    if (!property) return null;
    
    const actual = model.actualValues[index];
    const predicted = model.predictedValues[index];
    const percentError = (residual / actual) * 100;
    
    // Generate color (green for undervalued, red for overvalued)
    let color = '#9ca3af'; // gray as default
    
    if (residual < 0) {
      // Overvalued (actual < predicted) - use red scale
      const intensity = Math.min(1, Math.abs(residual) / maxResidual);
      const hex = Math.round(intensity * 255).toString(16).padStart(2, '0');
      color = `#${hex}4444`; // red with varying intensity
    } else {
      // Undervalued (actual > predicted) - use green scale
      const intensity = Math.min(1, Math.abs(residual) / maxResidual);
      const hex = Math.round(intensity * 255).toString(16).padStart(2, '0');
      color = `#44${hex}44`; // green with varying intensity
    }
    
    return {
      id: property.id,
      latitude: property.latitude!,
      longitude: property.longitude!,
      address: property.address,
      actual,
      predicted,
      residual,
      percentError,
      color,
    };
  }).filter((point): point is ResidualMapPoint => point !== null);
}

/**
 * Calculates summary statistics for a dataset
 */
export function calculateStatistics(values: number[]) {
  if (values.length === 0) {
    return {
      min: 0,
      max: 0,
      mean: 0,
      median: 0,
      standardDeviation: 0,
      count: 0,
    };
  }
  
  // Sort values for median and percentile calculations
  const sorted = [...values].sort((a, b) => a - b);
  
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const sum = values.reduce((a, b) => a + b, 0);
  const mean = sum / values.length;
  
  // Calculate median
  const midIndex = Math.floor(sorted.length / 2);
  const median = 
    sorted.length % 2 === 0
      ? (sorted[midIndex - 1] + sorted[midIndex]) / 2
      : sorted[midIndex];
  
  // Calculate standard deviation
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  const standardDeviation = Math.sqrt(variance);
  
  return {
    min,
    max,
    mean,
    median,
    standardDeviation,
    count: values.length,
  };
}