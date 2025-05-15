import { Property } from '@shared/schema';

/**
 * Extended Property interface with value history
 */
export interface PropertyWithHistory extends Property {
  valueHistory?: {
    [year: string]: string;
  }
}

/**
 * Time series data for a single property
 */
export interface PropertyTimeSeriesData {
  id: number | string;
  values: number[];
}

/**
 * Complete time series data for all properties
 */
export interface TimeSeriesData {
  periods: string[];
  properties: PropertyTimeSeriesData[];
}

/**
 * Value change result for a property between two time periods
 */
export interface ValueChangeResult {
  propertyId: number | string;
  startValue: number;
  endValue: number;
  absoluteChange: number;
  percentageChange: number;
}

/**
 * Neighborhood aggregated data
 */
export interface NeighborhoodData {
  propertyCount: number;
  averageValues: number[];
  medianValues: number[];
  minValues: number[];
  maxValues: number[];
  totalValue: number[];
}

/**
 * Service for analyzing property values over time
 */
export class TimeSeriesAnalysis {
  private properties: PropertyWithHistory[];
  
  constructor(properties: PropertyWithHistory[]) {
    this.properties = properties;
  }
  
  /**
   * Converts a property value from string to number
   * @param value Property value as string (e.g., "$200,000")
   * @returns Numeric value
   */
  private parsePropertyValue(value: string | undefined): number {
    if (!value) return 0;
    return parseFloat(value.replace(/[^0-9.-]+/g, ''));
  }
  
  /**
   * Determines all available time periods from property histories
   * @returns Array of time period identifiers (e.g., years)
   */
  private getAllPeriods(): string[] {
    // Collect all unique periods from property histories
    const periodsSet = new Set<string>();
    
    this.properties.forEach(property => {
      if (property.valueHistory) {
        Object.keys(property.valueHistory).forEach(period => {
          periodsSet.add(period);
        });
      }
    });
    
    // If no history data available, return empty array
    if (periodsSet.size === 0) return [];
    
    // Sort periods (assuming they are years or sortable strings)
    return Array.from(periodsSet).sort();
  }
  
  /**
   * Prepares property time series data for analysis and visualization
   * @returns Structured time series data
   */
  public prepareTimeSeriesData(): TimeSeriesData {
    const periods = this.getAllPeriods();
    
    // If no periods found, return empty data
    if (periods.length === 0) {
      return { periods: [], properties: [] };
    }
    
    // Prepare property data
    const propertyData: PropertyTimeSeriesData[] = this.properties.map(property => {
      const values = periods.map(period => {
        if (property.valueHistory && property.valueHistory[period]) {
          return this.parsePropertyValue(property.valueHistory[period]);
        } else if (period === periods[periods.length - 1] && property.value) {
          // If this is the latest period and we have a current value but no history
          return this.parsePropertyValue(property.value);
        } else if (property.value && !property.valueHistory) {
          // If property has no history, use current value for all periods
          return this.parsePropertyValue(property.value);
        }
        return 0; // Default for missing values
      });
      
      return {
        id: property.id,
        values
      };
    });
    
    return {
      periods,
      properties: propertyData
    };
  }
  
  /**
   * Calculates value changes between two time periods
   * @param startPeriod The starting period (e.g., "2020")
   * @param endPeriod The ending period (e.g., "2023")
   * @returns Array of value change results
   */
  public calculateValueChanges(startPeriod: string, endPeriod: string): ValueChangeResult[] {
    const timeSeriesData = this.prepareTimeSeriesData();
    
    // Get period indices
    const startIdx = timeSeriesData.periods.indexOf(startPeriod);
    const endIdx = timeSeriesData.periods.indexOf(endPeriod);
    
    // Handle invalid periods
    if (startIdx === -1 || endIdx === -1) {
      return [];
    }
    
    // Calculate changes for each property
    return timeSeriesData.properties.map(property => {
      const startValue = property.values[startIdx];
      const endValue = property.values[endIdx];
      const absoluteChange = endValue - startValue;
      
      // Calculate percentage change, handling division by zero
      const percentageChange = startValue !== 0 
        ? Math.round((absoluteChange / startValue) * 100) 
        : 0;
      
      return {
        propertyId: property.id,
        startValue,
        endValue,
        absoluteChange,
        percentageChange
      };
    });
  }
  
  /**
   * Aggregates time series data by neighborhood
   * @returns Object with neighborhood data
   */
  public aggregateByNeighborhood(): Record<string, NeighborhoodData> {
    const timeSeriesData = this.prepareTimeSeriesData();
    const neighborhoods: Record<string, NeighborhoodData> = {};
    
    // Initialize neighborhoods
    this.properties.forEach(property => {
      const neighborhood = property.neighborhood || 'Unknown';
      
      if (!neighborhoods[neighborhood]) {
        neighborhoods[neighborhood] = {
          propertyCount: 0,
          averageValues: Array(timeSeriesData.periods.length).fill(0),
          medianValues: Array(timeSeriesData.periods.length).fill(0),
          minValues: Array(timeSeriesData.periods.length).fill(Number.MAX_VALUE),
          maxValues: Array(timeSeriesData.periods.length).fill(0),
          totalValue: Array(timeSeriesData.periods.length).fill(0)
        };
      }
    });
    
    // Group properties by neighborhood
    const propertiesByNeighborhood: Record<string, PropertyTimeSeriesData[]> = {};
    
    timeSeriesData.properties.forEach(propertyData => {
      const property = this.properties.find(p => p.id === propertyData.id);
      if (!property) return;
      
      const neighborhood = property.neighborhood || 'Unknown';
      
      if (!propertiesByNeighborhood[neighborhood]) {
        propertiesByNeighborhood[neighborhood] = [];
      }
      
      propertiesByNeighborhood[neighborhood].push(propertyData);
    });
    
    // Calculate neighborhood statistics
    Object.keys(propertiesByNeighborhood).forEach(neighborhood => {
      const properties = propertiesByNeighborhood[neighborhood];
      neighborhoods[neighborhood].propertyCount = properties.length;
      
      // For each time period
      for (let i = 0; i < timeSeriesData.periods.length; i++) {
        // Get values for this period
        const periodValues = properties
          .map(p => p.values[i])
          .filter(v => v > 0); // Filter out missing values
        
        if (periodValues.length === 0) continue;
        
        // Calculate statistics
        const total = periodValues.reduce((sum, val) => sum + val, 0);
        const avg = total / periodValues.length;
        const min = Math.min(...periodValues);
        const max = Math.max(...periodValues);
        
        // Calculate median
        const sorted = [...periodValues].sort((a, b) => a - b);
        const middle = Math.floor(sorted.length / 2);
        const median = sorted.length % 2 === 0 
          ? (sorted[middle - 1] + sorted[middle]) / 2 
          : sorted[middle];
        
        // Store results
        neighborhoods[neighborhood].averageValues[i] = avg;
        neighborhoods[neighborhood].medianValues[i] = median;
        neighborhoods[neighborhood].minValues[i] = min;
        neighborhoods[neighborhood].maxValues[i] = max;
        neighborhoods[neighborhood].totalValue[i] = total;
      }
    });
    
    return neighborhoods;
  }
  
  /**
   * Calculates the average annual growth rate for each property
   * @returns Map of property IDs to growth rates
   */
  public calculateAnnualGrowthRates(): Map<number | string, number> {
    const timeSeriesData = this.prepareTimeSeriesData();
    const result = new Map<number | string, number>();
    
    // Need at least 2 periods for growth rate
    if (timeSeriesData.periods.length < 2) {
      return result;
    }
    
    const years = timeSeriesData.periods.length;
    
    timeSeriesData.properties.forEach(property => {
      const firstValue = property.values[0];
      const lastValue = property.values[years - 1];
      
      // Skip if missing values
      if (firstValue <= 0 || lastValue <= 0) {
        result.set(property.id, 0);
        return;
      }
      
      // Calculate compound annual growth rate
      // CAGR = (FV/PV)^(1/n) - 1
      const growthRate = Math.pow(lastValue / firstValue, 1 / (years - 1)) - 1;
      result.set(property.id, growthRate * 100); // Convert to percentage
    });
    
    return result;
  }
  
  /**
   * Finds properties with the highest growth rates
   * @param count Number of properties to return
   * @returns Array of property IDs and their growth rates
   */
  public findHighestGrowthProperties(count: number = 5): Array<{id: number | string, growthRate: number}> {
    const growthRates = this.calculateAnnualGrowthRates();
    
    // Convert map to array and sort by growth rate
    return Array.from(growthRates.entries())
      .map(([id, growthRate]) => ({ id, growthRate }))
      .sort((a, b) => b.growthRate - a.growthRate)
      .slice(0, count);
  }
  
  /**
   * Predicts future value for a specific property using linear regression
   * @param propertyId ID of the property
   * @param periodsAhead Number of periods to predict ahead
   * @returns Predicted value or null if prediction isn't possible
   */
  public predictFutureValue(propertyId: number | string, periodsAhead: number = 1): number | null {
    const timeSeriesData = this.prepareTimeSeriesData();
    
    // Find property data
    const propertyData = timeSeriesData.properties.find(p => p.id === propertyId);
    if (!propertyData) return null;
    
    const values = propertyData.values;
    
    // Need at least 2 data points for prediction
    if (values.filter(v => v > 0).length < 2) {
      return null;
    }
    
    // Simple linear regression for prediction
    const n = values.length;
    const indices = Array.from({ length: n }, (_, i) => i);
    
    // Calculate means
    const meanX = indices.reduce((sum, val) => sum + val, 0) / n;
    const meanY = values.reduce((sum, val) => sum + val, 0) / n;
    
    // Calculate coefficients
    let numerator = 0;
    let denominator = 0;
    
    for (let i = 0; i < n; i++) {
      numerator += (indices[i] - meanX) * (values[i] - meanY);
      denominator += Math.pow(indices[i] - meanX, 2);
    }
    
    const slope = denominator !== 0 ? numerator / denominator : 0;
    const intercept = meanY - (slope * meanX);
    
    // Calculate prediction
    const predictedValue = intercept + (slope * (n + periodsAhead - 1));
    
    return predictedValue > 0 ? predictedValue : null;
  }
}