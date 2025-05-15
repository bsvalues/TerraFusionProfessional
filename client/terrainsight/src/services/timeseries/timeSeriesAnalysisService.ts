import { Property } from '@shared/schema';

/**
 * Time series data point
 */
export interface TimeSeriesDataPoint {
  date: Date;
  value: number;
  interpolated?: boolean;
}

/**
 * Forecast data point with confidence intervals
 */
export interface ForecastDataPoint {
  date: Date;
  value: number;
  lowerBound?: number;
  upperBound?: number;
}

/**
 * Trend analysis result
 */
export interface TrendAnalysisResult {
  direction: 'up' | 'down' | 'stable';
  growthRate: number;
  averageAnnualChange: number;
  totalChange: number;
  startValue: number;
  endValue: number;
}

/**
 * Types of forecasting models
 */
export type ForecastingModel = 'linear' | 'exponential' | 'average';

/**
 * Forecast result
 */
export interface ForecastResult {
  predictions: ForecastDataPoint[];
  model: ForecastingModel;
  confidence: number;
  warnings?: string[];
}

/**
 * Property comparison result
 */
export interface PropertyComparisonResult {
  id: number | string;
  address: string;
  parcelId: string;
  currentValue: number;
  growthRate: number;
  totalAppreciation: number;
  averageAnnualChange: number;
}

/**
 * Time series analysis service
 */
export class TimeSeriesAnalysisService {
  
  /**
   * Convert property history to time series format
   */
  convertToTimeSeries(property: Property & { valueHistory?: Record<string, string> }): TimeSeriesDataPoint[] {
    // Initialize array to hold time series data
    const timeSeries: TimeSeriesDataPoint[] = [];
    
    // Check if the property has a history
    if (property.valueHistory && Object.keys(property.valueHistory).length > 0) {
      // Convert history to time series
      Object.entries(property.valueHistory).forEach(([year, valueStr]) => {
        timeSeries.push({
          date: new Date(`${year}-01-01`),
          value: parseFloat(valueStr),
          interpolated: false
        });
      });
      
      // Sort by date
      timeSeries.sort((a, b) => a.date.getTime() - b.date.getTime());
    } else {
      // If no history, use current value
      if (property.value) {
        const currentYear = new Date().getFullYear();
        timeSeries.push({
          date: new Date(`${currentYear}-01-01`),
          value: parseFloat(property.value),
          interpolated: false
        });
      }
    }
    
    return timeSeries;
  }
  
  /**
   * Fill gaps in time series data using linear interpolation
   */
  fillTimeSeriesGaps(timeSeries: TimeSeriesDataPoint[]): TimeSeriesDataPoint[] {
    if (timeSeries.length <= 1) {
      return [...timeSeries];
    }
    
    // Sort by date
    const sortedSeries = [...timeSeries].sort((a, b) => a.date.getTime() - b.date.getTime());
    const result: TimeSeriesDataPoint[] = [];
    
    const startYear = sortedSeries[0].date.getFullYear();
    const endYear = sortedSeries[sortedSeries.length - 1].date.getFullYear();
    
    // Prepare lookup map for quick access
    const valueByYear = new Map<number, TimeSeriesDataPoint>();
    sortedSeries.forEach(point => {
      valueByYear.set(point.date.getFullYear(), point);
    });
    
    // Fill in missing years with interpolated values
    for (let year = startYear; year <= endYear; year++) {
      if (valueByYear.has(year)) {
        // Use existing data point
        result.push(valueByYear.get(year)!);
      } else {
        // Find nearest previous and next years with data
        let prevYear = year - 1;
        let nextYear = year + 1;
        
        while (prevYear >= startYear && !valueByYear.has(prevYear)) {
          prevYear--;
        }
        
        while (nextYear <= endYear && !valueByYear.has(nextYear)) {
          nextYear++;
        }
        
        if (valueByYear.has(prevYear) && valueByYear.has(nextYear)) {
          const prevValue = valueByYear.get(prevYear)!.value;
          const nextValue = valueByYear.get(nextYear)!.value;
          const yearsDiff = nextYear - prevYear;
          
          // Linear interpolation: prev + (next - prev) * (current - prev) / (next - prev)
          const interpolatedValue = prevValue + 
            (nextValue - prevValue) * (year - prevYear) / yearsDiff;
          
          result.push({
            date: new Date(`${year}-01-01`),
            value: interpolatedValue,
            interpolated: true
          });
        }
      }
    }
    
    return result.sort((a, b) => a.date.getTime() - b.date.getTime());
  }
  
  /**
   * Analyze trend in time series data
   */
  analyzeTrend(timeSeries: TimeSeriesDataPoint[]): TrendAnalysisResult {
    if (timeSeries.length < 2) {
      throw new Error('Insufficient data points for trend analysis. Need at least 2 data points.');
    }
    
    // Sort by date
    const sortedSeries = [...timeSeries].sort((a, b) => a.date.getTime() - b.date.getTime());
    
    const startValue = sortedSeries[0].value;
    const endValue = sortedSeries[sortedSeries.length - 1].value;
    const totalChange = endValue - startValue;
    
    // Calculate years between first and last data point
    const startYear = sortedSeries[0].date.getFullYear();
    const endYear = sortedSeries[sortedSeries.length - 1].date.getFullYear();
    const years = endYear - startYear;
    
    if (years === 0) {
      throw new Error('Insufficient time range for trend analysis');
    }
    
    // Calculate average annual change
    const averageAnnualChange = totalChange / years;
    
    // Calculate compound annual growth rate (CAGR)
    // Formula: (endValue / startValue)^(1/years) - 1
    const growthRate = Math.pow(endValue / startValue, 1 / years) - 1;
    
    // Determine trend direction
    let direction: 'up' | 'down' | 'stable';
    if (growthRate > 0.005) {
      direction = 'up';
    } else if (growthRate < -0.005) {
      direction = 'down';
    } else {
      direction = 'stable';
    }
    
    return {
      direction,
      growthRate,
      averageAnnualChange,
      totalChange,
      startValue,
      endValue
    };
  }
  
  /**
   * Generate forecast based on historical data
   */
  forecast(
    timeSeries: TimeSeriesDataPoint[], 
    years: number = 3, 
    model: ForecastingModel = 'linear'
  ): ForecastResult {
    if (timeSeries.length < 3) {
      throw new Error('Insufficient data points for forecasting. Need at least 3 data points.');
    }
    
    // Sort by date
    const sortedSeries = [...timeSeries].sort((a, b) => a.date.getTime() - b.date.getTime());
    
    // Count number of interpolated points to affect confidence
    const interpolatedCount = sortedSeries.filter(point => point.interpolated).length;
    let confidencePenalty = interpolatedCount / sortedSeries.length * 0.3;
    
    // Base confidence on model and data quality
    let confidence = 0;
    const warnings: string[] = [];
    
    // Generate predictions based on the selected model
    const predictions: ForecastDataPoint[] = [];
    const lastYear = sortedSeries[sortedSeries.length - 1].date.getFullYear();
    const lastValue = sortedSeries[sortedSeries.length - 1].value;
    
    switch (model) {
      case 'linear': {
        // Simple linear regression
        // y = mx + b
        const xValues = sortedSeries.map((_, i) => i);
        const yValues = sortedSeries.map(point => point.value);
        
        const { slope, intercept } = this.linearRegression(xValues, yValues);
        
        // Base confidence on R-squared
        const rSquared = this.calculateRSquared(xValues, yValues, slope, intercept);
        confidence = Math.max(0, Math.min(1, rSquared - confidencePenalty));
        
        // Generate predictions
        for (let i = 1; i <= years; i++) {
          const predictedValue = slope * (sortedSeries.length - 1 + i) + intercept;
          const uncertainty = (1 - confidence) * predictedValue * 0.2 * i; // Increasing uncertainty with time
          
          predictions.push({
            date: new Date(`${lastYear + i}-01-01`),
            value: predictedValue,
            lowerBound: Math.max(0, predictedValue - uncertainty),
            upperBound: predictedValue + uncertainty
          });
        }
        
        if (rSquared < 0.7) {
          warnings.push('Low correlation in historical data may reduce forecast accuracy');
        }
        break;
      }
      
      case 'exponential': {
        // Exponential growth model
        // Estimate growth rate from historical data
        try {
          const trend = this.analyzeTrend(sortedSeries);
          const growthRate = trend.growthRate;
          
          // Base confidence on consistency of growth
          const growthRates: number[] = [];
          for (let i = 1; i < sortedSeries.length; i++) {
            const prevValue = sortedSeries[i-1].value;
            const currValue = sortedSeries[i].value;
            if (prevValue > 0) {
              growthRates.push(currValue / prevValue - 1);
            }
          }
          
          // Calculate standard deviation of growth rates
          const meanGrowthRate = growthRates.reduce((sum, rate) => sum + rate, 0) / growthRates.length;
          const variance = growthRates.reduce((sum, rate) => sum + Math.pow(rate - meanGrowthRate, 2), 0) / growthRates.length;
          const stdDev = Math.sqrt(variance);
          
          // Lower confidence if growth rates are highly variable
          confidence = Math.max(0, Math.min(1, 0.9 - stdDev * 2 - confidencePenalty));
          
          // Generate predictions
          for (let i = 1; i <= years; i++) {
            const predictedValue = lastValue * Math.pow(1 + growthRate, i);
            const uncertainty = (1 - confidence) * predictedValue * 0.25 * i; // Higher uncertainty for exponential
            
            predictions.push({
              date: new Date(`${lastYear + i}-01-01`),
              value: predictedValue,
              lowerBound: Math.max(0, predictedValue - uncertainty),
              upperBound: predictedValue + uncertainty
            });
          }
          
          if (stdDev > 0.1) {
            warnings.push('Highly variable growth rates in historical data');
          }
        } catch (error) {
          throw new Error('Could not calculate growth trend for exponential forecast');
        }
        break;
      }
      
      case 'average': {
        // Moving average model (simple implementation)
        const recentValues = sortedSeries.slice(-3).map(point => point.value);
        const averageChange = (recentValues[recentValues.length - 1] - recentValues[0]) / (recentValues.length - 1);
        
        confidence = Math.max(0, Math.min(1, 0.7 - confidencePenalty));
        
        // Generate predictions
        for (let i = 1; i <= years; i++) {
          const predictedValue = lastValue + averageChange * i;
          const uncertainty = (1 - confidence) * predictedValue * 0.15 * i;
          
          predictions.push({
            date: new Date(`${lastYear + i}-01-01`),
            value: predictedValue,
            lowerBound: Math.max(0, predictedValue - uncertainty),
            upperBound: predictedValue + uncertainty
          });
        }
        
        warnings.push('Simple averaging provides less precise forecasts than regression models');
        break;
      }
    }
    
    if (sortedSeries.length < 5) {
      warnings.push('Limited historical data may affect forecast reliability');
      confidence = Math.max(0, confidence - 0.1);
    }
    
    return {
      predictions,
      model,
      confidence,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }
  
  /**
   * Compare trends between multiple properties
   */
  compareProperties(
    propertyData: Array<{ property: Property; timeSeries: TimeSeriesDataPoint[] }>
  ): PropertyComparisonResult[] {
    return propertyData.map(({ property, timeSeries }) => {
      try {
        const trend = this.analyzeTrend(timeSeries);
        const currentValue = timeSeries[timeSeries.length - 1].value;
        
        return {
          id: property.id,
          address: property.address,
          parcelId: property.parcelId,
          currentValue,
          growthRate: trend.growthRate,
          totalAppreciation: trend.totalChange,
          averageAnnualChange: trend.averageAnnualChange
        };
      } catch (error) {
        // Return partial data if trend analysis fails
        return {
          id: property.id,
          address: property.address,
          parcelId: property.parcelId,
          currentValue: property.value ? parseFloat(property.value) : 0,
          growthRate: 0,
          totalAppreciation: 0,
          averageAnnualChange: 0
        };
      }
    });
  }
  
  /**
   * Perform linear regression
   * y = mx + b
   */
  private linearRegression(x: number[], y: number[]): { slope: number; intercept: number } {
    const n = x.length;
    
    if (n !== y.length || n === 0) {
      throw new Error('Input arrays must have the same length and not be empty');
    }
    
    // Calculate means
    const xMean = x.reduce((sum, val) => sum + val, 0) / n;
    const yMean = y.reduce((sum, val) => sum + val, 0) / n;
    
    // Calculate slope (m)
    let numerator = 0;
    let denominator = 0;
    
    for (let i = 0; i < n; i++) {
      numerator += (x[i] - xMean) * (y[i] - yMean);
      denominator += Math.pow(x[i] - xMean, 2);
    }
    
    if (denominator === 0) {
      return { slope: 0, intercept: yMean };
    }
    
    const slope = numerator / denominator;
    
    // Calculate intercept (b)
    const intercept = yMean - slope * xMean;
    
    return { slope, intercept };
  }
  
  /**
   * Calculate R-squared (coefficient of determination)
   */
  private calculateRSquared(x: number[], y: number[], slope: number, intercept: number): number {
    const n = x.length;
    
    // Calculate total sum of squares (TSS)
    const yMean = y.reduce((sum, val) => sum + val, 0) / n;
    let tss = 0;
    
    for (let i = 0; i < n; i++) {
      tss += Math.pow(y[i] - yMean, 2);
    }
    
    // Calculate residual sum of squares (RSS)
    let rss = 0;
    
    for (let i = 0; i < n; i++) {
      const prediction = slope * x[i] + intercept;
      rss += Math.pow(y[i] - prediction, 2);
    }
    
    if (tss === 0) {
      return 1; // Perfect fit if all y values are identical
    }
    
    return 1 - (rss / tss);
  }
}