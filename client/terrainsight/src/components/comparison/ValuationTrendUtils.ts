/**
 * Represents a data point for property valuation over time
 */
export interface ValuationDataPoint {
  year: string;
  value: number;
}

/**
 * Calculate the total growth rate between the first and last data points
 * @param data - Array of valuation data points
 * @returns Growth rate as a percentage (e.g., 40 means 40% growth)
 */
export function calculateGrowthRate(data: ValuationDataPoint[]): number {
  if (!data || data.length <= 1) return 0;
  
  const firstValue = data[0].value;
  const lastValue = data[data.length - 1].value;
  
  if (firstValue === 0) return 0; // Avoid division by zero
  
  return ((lastValue - firstValue) / firstValue) * 100;
}

/**
 * Calculate the Compound Annual Growth Rate (CAGR)
 * @param data - Array of valuation data points
 * @returns CAGR as a percentage
 */
export function calculateCompoundAnnualGrowthRate(data: ValuationDataPoint[]): number {
  if (!data || data.length <= 1) return 0;
  
  const firstValue = data[0].value;
  const lastValue = data[data.length - 1].value;
  const years = data.length - 1; // Number of years between first and last data point
  
  if (firstValue === 0) return 0; // Avoid division by zero
  
  // CAGR formula: (endValue / startValue)^(1/years) - 1
  const cagr = Math.pow(lastValue / firstValue, 1 / years) - 1;
  return cagr * 100;
}

/**
 * Generate data points for a trend line based on linear regression
 * @param data - Array of valuation data points
 * @returns Array of data points for the trend line
 */
export function generateTrendLineData(data: ValuationDataPoint[]): ValuationDataPoint[] {
  if (!data || data.length <= 1) return data;
  
  // Convert years to numerical values for regression calculation
  const yearBase = parseInt(data[0].year);
  const points = data.map((point, index) => ({
    x: parseInt(point.year) - yearBase, // Normalize to years since first data point
    y: point.value
  }));
  
  // Calculate linear regression (y = mx + b)
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  const n = points.length;
  
  for (let i = 0; i < n; i++) {
    sumX += points[i].x;
    sumY += points[i].y;
    sumXY += points[i].x * points[i].y;
    sumXX += points[i].x * points[i].x;
  }
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  // Generate trend line points
  return data.map((point, index) => ({
    year: point.year,
    value: intercept + slope * (parseInt(point.year) - yearBase)
  }));
}

/**
 * Predict future property values based on historical trend
 * @param data - Array of historical valuation data points
 * @param years - Number of years to predict into the future
 * @returns Array of predicted valuation data points
 */
export function predictFutureValues(data: ValuationDataPoint[], years: number): ValuationDataPoint[] {
  if (!data || data.length <= 1 || years <= 0) return [];
  
  // Generate trend line for existing data
  const trendData = generateTrendLineData(data);
  
  // Use the slope from the trend line to predict future values
  const lastYear = parseInt(data[data.length - 1].year);
  const lastTrendValue = trendData[trendData.length - 1].value;
  const secondLastTrendValue = trendData[trendData.length - 2].value;
  const yearlyIncrease = lastTrendValue - secondLastTrendValue;
  
  // Generate predictions
  const predictions: ValuationDataPoint[] = [];
  let previousValue = lastTrendValue;
  
  for (let i = 1; i <= years; i++) {
    const predictedYear = (lastYear + i).toString();
    const predictedValue = previousValue + yearlyIncrease;
    predictions.push({
      year: predictedYear,
      value: predictedValue
    });
    previousValue = predictedValue;
  }
  
  return predictions;
}

/**
 * Normalize various data formats to ValuationDataPoint format
 * @param data - Array of data in various formats
 * @returns Array of normalized ValuationDataPoint objects
 */
export function normalizeValuationData(data: any[]): ValuationDataPoint[] {
  if (!data || data.length === 0) return [];
  
  const normalized = data.map(item => {
    // Extract year from various possible formats
    let year = item.year || item.taxYear || item.period || '';
    if (item.date) {
      // Extract year from date string if present
      const match = item.date.match(/(\d{4})/);
      if (match) year = match[1];
    }
    
    // Convert year to string
    year = year.toString();
    
    // Extract value from various possible formats
    let value = item.value || item.propertyValue || item.assessedValue || item.marketValue || 0;
    
    // Handle string values with currency formatting
    if (typeof value === 'string') {
      value = parseFloat(value.replace(/[$,]/g, ''));
    }
    
    return { year, value };
  });
  
  // Sort by year
  return normalized.sort((a, b) => parseInt(a.year) - parseInt(b.year));
}

/**
 * Format a number as currency
 * @param value - Number to format
 * @returns Formatted currency string
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}

/**
 * Format a percentage
 * @param value - Percentage value
 * @returns Formatted percentage string
 */
export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}