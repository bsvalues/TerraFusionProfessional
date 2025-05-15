import { Property } from "@shared/schema";

/**
 * Represents a property value change over time
 */
export interface ValueChange {
  propertyType: string;
  previousValue: number;
  currentValue: number;
  changeAmount: number;
  changePercentage: number;
}

/**
 * Represents a regional property performance metrics
 */
export interface RegionalPerformance {
  region: string;
  averageValue: number;
  valueChange: number;
  percentageChange: number;
  propertyCount: number;
}

/**
 * Represents a market trend data point
 */
export interface MarketTrend {
  date: Date;
  averageValue: number;
  salesVolume: number;
  percentageChange: number;
}

/**
 * Represents valuation distribution metrics
 */
export interface ValuationMetrics {
  totalValue: number;
  totalProperties: number;
  averageValue: number;
  medianValue: number;
  minValue: number;
  maxValue: number;
  valuationRanges: {
    range: string;
    count: number;
    percentage: number;
  }[];
}

/**
 * Service for KPI dashboard data analysis
 */
class KPIService {
  /**
   * Calculate valuation metrics from a set of properties
   */
  calculateValuationMetrics(properties: Property[]): ValuationMetrics {
    if (!properties.length) {
      return {
        totalValue: 0,
        totalProperties: 0,
        averageValue: 0,
        medianValue: 0,
        minValue: 0,
        maxValue: 0,
        valuationRanges: []
      };
    }

    // Extract numeric values
    const values = properties
      .map(p => p.value ? parseFloat(p.value) : 0)
      .filter(v => v > 0)
      .sort((a, b) => a - b);

    if (!values.length) {
      return {
        totalValue: 0,
        totalProperties: 0,
        averageValue: 0,
        medianValue: 0,
        minValue: 0,
        maxValue: 0,
        valuationRanges: []
      };
    }

    // Calculate basic metrics
    const totalValue = values.reduce((sum, val) => sum + val, 0);
    const averageValue = totalValue / values.length;
    const medianValue = values.length % 2 === 0
      ? (values[values.length / 2 - 1] + values[values.length / 2]) / 2
      : values[Math.floor(values.length / 2)];
    const minValue = values[0];
    const maxValue = values[values.length - 1];

    // Create value ranges
    const rangeSize = (maxValue - minValue) / 5;
    const ranges = Array.from({ length: 5 }, (_, i) => {
      const rangeMin = minValue + i * rangeSize;
      const rangeMax = i === 4 ? maxValue : minValue + (i + 1) * rangeSize;
      const label = `${Math.round(rangeMin).toLocaleString()} - ${Math.round(rangeMax).toLocaleString()}`;
      const count = values.filter(v => v >= rangeMin && v <= rangeMax).length;
      return {
        range: label,
        count,
        percentage: (count / values.length) * 100
      };
    });

    return {
      totalValue,
      totalProperties: values.length,
      averageValue,
      medianValue,
      minValue,
      maxValue,
      valuationRanges: ranges
    };
  }

  /**
   * Calculate market trends from historical property data
   */
  calculateMarketTrends(properties: Property[]): MarketTrend[] {
    // In a real implementation, this would analyze properties with 
    // historical sales data to track market trends over time
    // For demonstration, we'll generate some sample data
    
    // Get current date
    const currentDate = new Date();
    
    // Generate monthly trends for the past 12 months
    const trends: MarketTrend[] = [];
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(currentDate);
      date.setMonth(date.getMonth() - i);
      
      // Base value with some randomization
      const baseValue = 250000;
      const randomFactor = 0.9 + Math.random() * 0.2; // 0.9 to 1.1
      const trendFactor = 1 + (0.015 * (12 - i)); // Increasing trend
      const averageValue = baseValue * randomFactor * trendFactor;
      
      // Sales volume with seasonality
      const month = date.getMonth();
      const seasonality = month >= 3 && month <= 8 ? 1.3 : 0.8; // Higher in spring/summer
      const salesVolume = Math.round(50 * seasonality * (0.9 + Math.random() * 0.2));
      
      // Calculate percentage change from previous month
      const prevValue = trends.length > 0 ? trends[trends.length - 1].averageValue : averageValue;
      const percentageChange = ((averageValue - prevValue) / prevValue) * 100;
      
      trends.push({
        date,
        averageValue,
        salesVolume,
        percentageChange: trends.length > 0 ? percentageChange : 0
      });
    }
    
    return trends;
  }

  /**
   * Calculate regional performance metrics
   */
  calculateRegionalPerformance(properties: Property[]): RegionalPerformance[] {
    // Group properties by neighborhood
    const regionMap = new Map<string, Property[]>();
    
    properties.forEach(property => {
      if (!property.neighborhood) return;
      
      const region = property.neighborhood;
      if (!regionMap.has(region)) {
        regionMap.set(region, []);
      }
      regionMap.get(region)?.push(property);
    });
    
    // Calculate performance metrics for each region
    const performance: RegionalPerformance[] = [];
    
    regionMap.forEach((props, region) => {
      const values = props
        .map(p => p.value ? parseFloat(p.value) : 0)
        .filter(v => v > 0);
      
      if (!values.length) return;
      
      const averageValue = values.reduce((sum, val) => sum + val, 0) / values.length;
      const previousAverage = averageValue * (0.9 + Math.random() * 0.1); // Simulate previous value
      const valueChange = averageValue - previousAverage;
      const percentageChange = (valueChange / previousAverage) * 100;
      
      performance.push({
        region,
        averageValue,
        valueChange,
        percentageChange,
        propertyCount: props.length
      });
    });
    
    // Sort by absolute percentage change
    return performance.sort((a, b) => Math.abs(b.percentageChange) - Math.abs(a.percentageChange));
  }

  /**
   * Calculate value changes by property type
   */
  calculateValueChanges(properties: Property[]): ValueChange[] {
    // Group properties by property type
    const typeMap = new Map<string, Property[]>();
    
    properties.forEach(property => {
      if (!property.propertyType) return;
      
      const type = property.propertyType;
      if (!typeMap.has(type)) {
        typeMap.set(type, []);
      }
      typeMap.get(type)?.push(property);
    });
    
    // Calculate change metrics for each property type
    const changes: ValueChange[] = [];
    
    typeMap.forEach((props, propertyType) => {
      const values = props
        .map(p => p.value ? parseFloat(p.value) : 0)
        .filter(v => v > 0);
      
      if (!values.length) return;
      
      const currentValue = values.reduce((sum, val) => sum + val, 0);
      const previousValue = currentValue * (0.85 + Math.random() * 0.2); // Simulate previous total value
      const changeAmount = currentValue - previousValue;
      const changePercentage = (changeAmount / previousValue) * 100;
      
      changes.push({
        propertyType,
        previousValue,
        currentValue,
        changeAmount,
        changePercentage
      });
    });
    
    // Sort by absolute percentage change
    return changes.sort((a, b) => Math.abs(b.changePercentage) - Math.abs(a.changePercentage));
  }
}

export const kpiService = new KPIService();