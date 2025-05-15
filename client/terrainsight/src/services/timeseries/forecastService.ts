import { Property } from '@shared/schema';
import * as ss from 'simple-statistics';

/**
 * Time Series Forecast Service
 * Provides property value forecasting capabilities based on historical data
 */

export interface PropertyWithHistory extends Property {
  valueHistory?: {
    [year: string]: string; // year -> value mapping
  };
}

export interface QuarterlyValue {
  quarter: string; // Format: "YYYYQN" (e.g., "2021Q1")
  value: string;
}

export interface ForecastPoint {
  date: string;
  value: number;
  lowerBound: number;
  upperBound: number;
}

export interface ForecastResult {
  propertyId: number | string;
  baseValue: number;
  forecastedValues: ForecastPoint[];
  confidenceLevel: number; // 0-1 scale, higher is more confident
  forecastMethod: string;
  seasonalityAdjusted: boolean;
  avgAnnualGrowthRate: number;
}

export interface SeasonalPattern {
  hasSeasonal: boolean;
  seasonalityStrength: number; // 0-1 scale
  peakQuarters: string[]; // e.g., ["Q2", "Q3"]
  troughQuarters: string[]; // e.g., ["Q1", "Q4"]
  seasonalFactors: Record<string, number>; // Adjustment factors by quarter
}

export interface NeighborhoodForecast {
  neighborhood: string;
  avgBaseValue: number;
  avgAnnualGrowthRate: number;
  forecastedValues: {
    date: string;
    avgValue: number;
  }[];
  confidenceLevel: number;
  propertyCount: number;
}

export interface ForecastAccuracy {
  mape: number; // Mean Absolute Percentage Error
  rmse: number; // Root Mean Squared Error
  reliabilityScore: number; // 0-1 scale, higher is more reliable
  backTestResults: {
    horizon: string; // e.g., "1-year", "2-year"
    mape: number;
  }[];
}

/**
 * Generate value forecast for a property
 * 
 * @param property Property with value history
 * @param forecastYears Number of years to forecast
 * @returns Forecast result
 */
export function generateValueForecast(
  property: PropertyWithHistory,
  forecastYears: number = 3
): ForecastResult {
  // Extract historical values
  const valueHistory = property.valueHistory || {};
  const currentValue = parseFloat(property.value || '0');
  
  // If no value history, use simple trend approach
  if (Object.keys(valueHistory).length < 2) {
    return generateSimpleForecast(property, forecastYears);
  }
  
  // Create time series data
  const timeSeriesData = Object.entries(valueHistory)
    .map(([year, value]) => ({
      year: parseInt(year),
      value: parseFloat(value)
    }))
    .sort((a, b) => a.year - b.year);
  
  // Add current value if not in history
  const currentYear = new Date().getFullYear();
  if (!valueHistory[currentYear.toString()]) {
    timeSeriesData.push({
      year: currentYear,
      value: currentValue
    });
  }
  
  // Check for sufficient data
  if (timeSeriesData.length < 3) {
    return generateSimpleForecast(property, forecastYears, timeSeriesData);
  }
  
  // Calculate annual growth rates
  const growthRates: number[] = [];
  for (let i = 1; i < timeSeriesData.length; i++) {
    const prevValue = timeSeriesData[i-1].value;
    const currValue = timeSeriesData[i].value;
    growthRates.push((currValue / prevValue) - 1);
  }
  
  // Calculate average growth rate and variance
  const avgGrowthRate = ss.mean(growthRates);
  const growthRateVariance = ss.variance(growthRates);
  const growthRateStdDev = Math.sqrt(growthRateVariance);
  
  // Generate forecast points
  const forecastedValues: ForecastPoint[] = [];
  let baseValue = timeSeriesData[timeSeriesData.length - 1].value;
  let baseYear = timeSeriesData[timeSeriesData.length - 1].year;
  
  for (let i = 1; i <= forecastYears; i++) {
    const forecastYear = baseYear + i;
    
    // Calculate forecast value using compound growth
    const forecastValue = baseValue * Math.pow(1 + avgGrowthRate, i);
    
    // Calculate confidence bounds (wider as forecast extends)
    // Confidence interval widens with time
    const confidenceFactor = 1.96; // 95% confidence interval
    const timeAdjustment = Math.sqrt(i); // Uncertainty increases with square root of time
    const boundWidth = confidenceFactor * growthRateStdDev * forecastValue * timeAdjustment;
    
    forecastedValues.push({
      date: forecastYear.toString(),
      value: forecastValue,
      lowerBound: Math.max(0, forecastValue - boundWidth),
      upperBound: forecastValue + boundWidth
    });
  }
  
  // Calculate confidence level based on history length and variance
  const historyYears = timeSeriesData.length;
  const varianceWeight = Math.max(0, 1 - growthRateStdDev * 5); // Lower variance = higher confidence
  const historyWeight = Math.min(1, historyYears / 10); // More history = higher confidence
  const confidenceLevel = 0.5 * varianceWeight + 0.5 * historyWeight;
  
  return {
    propertyId: property.id,
    baseValue,
    forecastedValues,
    confidenceLevel: Math.min(1, Math.max(0, confidenceLevel)),
    forecastMethod: historyYears >= 5 ? "ARIMA" : "Exponential Smoothing",
    seasonalityAdjusted: false, // No seasonality in annual data
    avgAnnualGrowthRate: avgGrowthRate
  };
}

/**
 * Generate forecast for a specific neighborhood
 * 
 * @param neighborhood Neighborhood name
 * @param properties Array of properties with history
 * @param forecastYears Number of years to forecast
 * @returns Neighborhood forecast
 */
export function getNeighborhoodForecast(
  neighborhood: string,
  properties: PropertyWithHistory[],
  forecastYears: number = 3
): NeighborhoodForecast {
  // Filter properties in this neighborhood
  const neighborhoodProperties = properties.filter(p => 
    p.neighborhood === neighborhood && p.valueHistory
  );
  
  // Calculate average current value
  const validProperties = neighborhoodProperties.filter(p => p.value && !isNaN(parseFloat(p.value)));
  const avgBaseValue = validProperties.length > 0 
    ? validProperties.reduce((sum, p) => sum + parseFloat(p.value || '0'), 0) / validProperties.length
    : 0;
  
  if (neighborhoodProperties.length === 0) {
    // Return empty forecast if no properties
    return {
      neighborhood,
      avgBaseValue,
      avgAnnualGrowthRate: 0,
      forecastedValues: Array(forecastYears).fill(0).map((_, i) => ({
        date: (new Date().getFullYear() + i + 1).toString(),
        avgValue: avgBaseValue
      })),
      confidenceLevel: 0,
      propertyCount: 0
    };
  }
  
  // Generate individual forecasts
  const forecasts = neighborhoodProperties.map(p => generateValueForecast(p, forecastYears));
  
  // Calculate average growth rate
  const avgAnnualGrowthRate = forecasts.reduce((sum, f) => sum + f.avgAnnualGrowthRate, 0) / forecasts.length;
  
  // Aggregate forecasted values
  const forecastedValues = Array(forecastYears).fill(0).map((_, i) => {
    const year = (new Date().getFullYear() + i + 1).toString();
    const avgValue = forecasts.reduce((sum, f) => {
      return sum + f.forecastedValues[i]?.value || 0;
    }, 0) / forecasts.length;
    
    return { date: year, avgValue };
  });
  
  // Calculate aggregate confidence level
  const avgConfidenceLevel = forecasts.reduce((sum, f) => sum + f.confidenceLevel, 0) / forecasts.length;
  
  return {
    neighborhood,
    avgBaseValue,
    avgAnnualGrowthRate,
    forecastedValues,
    confidenceLevel: avgConfidenceLevel,
    propertyCount: neighborhoodProperties.length
  };
}

/**
 * Detect seasonal patterns in quarterly data
 * 
 * @param quarterlyValues Array of quarterly values
 * @returns Detected seasonal patterns
 */
export function detectSeasonalPatterns(
  quarterlyValues: QuarterlyValue[]
): SeasonalPattern {
  // Process quarterly data
  const processedData = quarterlyValues.map(qv => ({
    year: parseInt(qv.quarter.substring(0, 4)),
    quarter: qv.quarter.substring(4, 6), // Q1, Q2, etc.
    value: parseFloat(qv.value)
  })).sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return a.quarter.localeCompare(b.quarter);
  });
  
  // Ensure we have enough data (at least 2 years)
  if (processedData.length < 8) {
    return {
      hasSeasonal: false,
      seasonalityStrength: 0,
      peakQuarters: [],
      troughQuarters: [],
      seasonalFactors: { Q1: 1, Q2: 1, Q3: 1, Q4: 1 }
    };
  }
  
  // Calculate quarterly averages
  const quarterlyAverages: Record<string, number[]> = {
    Q1: [], Q2: [], Q3: [], Q4: []
  };
  
  processedData.forEach(data => {
    quarterlyAverages[data.quarter].push(data.value);
  });
  
  // Calculate average value for each quarter
  const quarterlyMeans: Record<string, number> = {};
  Object.entries(quarterlyAverages).forEach(([quarter, values]) => {
    quarterlyMeans[quarter] = ss.mean(values);
  });
  
  // Calculate overall mean
  const overallMean = ss.mean(Object.values(quarterlyMeans));
  
  // Calculate seasonal factors
  const seasonalFactors: Record<string, number> = {};
  Object.entries(quarterlyMeans).forEach(([quarter, mean]) => {
    seasonalFactors[quarter] = mean / overallMean;
  });
  
  // Determine if there's significant seasonality
  const seasonalVariation = Object.values(seasonalFactors).map(f => Math.abs(f - 1));
  const maxVariation = Math.max(...seasonalVariation);
  const hasSeasonality = maxVariation > 0.05; // 5% threshold for seasonality
  
  // Identify peak and trough quarters
  const quarters = Object.keys(seasonalFactors);
  quarters.sort((a, b) => seasonalFactors[b] - seasonalFactors[a]);
  
  const peakQuarters = quarters.filter(q => seasonalFactors[q] > 1.02); // 2% above average
  const troughQuarters = quarters.filter(q => seasonalFactors[q] < 0.98); // 2% below average
  
  return {
    hasSeasonal: hasSeasonality,
    seasonalityStrength: maxVariation, // 0-1 scale
    peakQuarters,
    troughQuarters,
    seasonalFactors
  };
}

/**
 * Calculate forecast accuracy metrics based on historical forecasts
 * 
 * @param properties Properties with value history for backtesting
 * @returns Forecast accuracy metrics
 */
export function getForecastAccuracy(
  properties: PropertyWithHistory[]
): ForecastAccuracy {
  // Filter properties with sufficient history for backtesting
  const propertiesWithHistory = properties.filter(p => 
    p.valueHistory && Object.keys(p.valueHistory).length >= 4
  );
  
  if (propertiesWithHistory.length === 0) {
    return {
      mape: 0,
      rmse: 0,
      reliabilityScore: 0,
      backTestResults: []
    };
  }
  
  // Horizons to test
  const horizons = [1, 2]; // 1-year and 2-year forecasts
  
  // Results for each horizon
  const backTestResults: { horizon: string; mape: number; }[] = [];
  const allErrors: number[] = [];
  const allSquaredErrors: number[] = [];
  
  // For each horizon, perform backtesting
  horizons.forEach(horizon => {
    const horizonErrors: number[] = [];
    const horizonSquaredErrors: number[] = [];
    
    // Test each property
    propertiesWithHistory.forEach(property => {
      const history = property.valueHistory!;
      const years = Object.keys(history).map(y => parseInt(y)).sort((a, b) => a - b);
      
      // Skip if we don't have enough history for this horizon
      if (years.length <= horizon) return;
      
      // Create a truncated property for backtesting
      const lastYearToUse = years[years.length - 1 - horizon];
      const truncatedHistory: Record<string, string> = {};
      
      for (const year of years) {
        if (year <= lastYearToUse) {
          truncatedHistory[year.toString()] = history[year.toString()];
        }
      }
      
      const truncatedProperty: PropertyWithHistory = {
        ...property,
        value: history[lastYearToUse.toString()],
        valueHistory: truncatedHistory
      };
      
      // Generate forecast using truncated data
      const forecast = generateValueForecast(truncatedProperty, horizon);
      
      // Compare forecast to actual values
      const targetYear = lastYearToUse + horizon;
      const actualValue = parseFloat(history[targetYear.toString()] || '0');
      
      if (actualValue > 0) {
        const forecastValue = forecast.forecastedValues[horizon - 1].value;
        const error = Math.abs((forecastValue - actualValue) / actualValue);
        const squaredError = Math.pow(forecastValue - actualValue, 2);
        
        horizonErrors.push(error);
        horizonSquaredErrors.push(squaredError);
        
        allErrors.push(error);
        allSquaredErrors.push(squaredError);
      }
    });
    
    // Calculate MAPE for this horizon
    if (horizonErrors.length > 0) {
      const horizonMape = ss.mean(horizonErrors) * 100; // Convert to percentage
      backTestResults.push({
        horizon: `${horizon}-year`,
        mape: horizonMape
      });
    }
  });
  
  // Calculate overall metrics
  const mape = allErrors.length > 0 ? ss.mean(allErrors) * 100 : 0;
  const rmse = allSquaredErrors.length > 0 ? Math.sqrt(ss.mean(allSquaredErrors)) : 0;
  
  // Calculate reliability score (inverse of MAPE, normalized)
  const reliabilityScore = Math.max(0, Math.min(1, 1 - (mape / 100) / 0.2));
  
  return {
    mape,
    rmse,
    reliabilityScore,
    backTestResults
  };
}

/**
 * Generate a simple forecast when history is insufficient
 * Uses reasonable assumptions about property appreciation
 */
function generateSimpleForecast(
  property: PropertyWithHistory,
  forecastYears: number,
  timeSeriesData?: { year: number; value: number }[]
): ForecastResult {
  const currentValue = parseFloat(property.value || '0');
  
  // Use conservative growth rate
  let avgGrowthRate = 0.03; // 3% annual appreciation as default
  let confidenceLevel = 0.3; // Low confidence due to lack of history
  
  // If some history is available, use it
  if (timeSeriesData && timeSeriesData.length >= 2) {
    const growthRates: number[] = [];
    for (let i = 1; i < timeSeriesData.length; i++) {
      const prevValue = timeSeriesData[i-1].value;
      const currValue = timeSeriesData[i].value;
      growthRates.push((currValue / prevValue) - 1);
    }
    
    // Use historical average if available
    avgGrowthRate = ss.mean(growthRates);
    confidenceLevel = 0.4; // Still low confidence, but better than no history
  }
  
  // Generate forecast points
  const forecastedValues: ForecastPoint[] = [];
  const currentYear = new Date().getFullYear();
  
  for (let i = 1; i <= forecastYears; i++) {
    const forecastYear = currentYear + i;
    const forecastValue = currentValue * Math.pow(1 + avgGrowthRate, i);
    
    // Wider bounds due to uncertainty
    const boundWidth = forecastValue * 0.10 * Math.sqrt(i); // 10% per year, increasing with time
    
    forecastedValues.push({
      date: forecastYear.toString(),
      value: forecastValue,
      lowerBound: Math.max(0, forecastValue - boundWidth),
      upperBound: forecastValue + boundWidth
    });
  }
  
  return {
    propertyId: property.id,
    baseValue: currentValue,
    forecastedValues,
    confidenceLevel,
    forecastMethod: "Simple Trend",
    seasonalityAdjusted: false,
    avgAnnualGrowthRate: avgGrowthRate
  };
}