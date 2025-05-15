/**
 * Property Trend Service
 * 
 * Service for fetching property value trend data for heat map visualization
 */

import { PropertyTrendData } from '@shared/interfaces/PropertyHistory';

const API_BASE_URL = '/api/property-trends';

/**
 * Get property value trends for heat map visualization
 * @param analysisYear The analysis/current year
 * @param referenceYear The reference/previous year for comparisons
 * @returns Promise resolving to property trend data array
 */
export async function getPropertyValueTrends(
  analysisYear: string = '2023',
  referenceYear: string = '2022'
): Promise<PropertyTrendData[]> {
  try {
    const url = new URL(API_BASE_URL, window.location.origin);
    url.searchParams.append('analysisYear', analysisYear);
    url.searchParams.append('referenceYear', referenceYear);
    
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch property value trends');
    }
    
    const { trends } = await response.json();
    return trends || [];
  } catch (error) {
    console.error('Error fetching property value trends:', error);
    return [];
  }
}

/**
 * Calculate range of value changes for color scale normalization
 * @param trends Array of property trend data
 * @returns Object with min and max percentage changes
 */
export function calculateValueChangeRange(trends: PropertyTrendData[]): { min: number; max: number } {
  if (!trends.length) {
    return { min: -10, max: 10 }; // Default range if no data
  }
  
  // Extract all percentage changes
  const changes = trends.map(trend => trend.valueChangePercent);
  
  // Find min and max values
  const min = Math.min(...changes);
  const max = Math.max(...changes);
  
  // Apply some padding to the range
  const paddedMin = Math.floor(min * 1.1);
  const paddedMax = Math.ceil(max * 1.1);
  
  return { min: paddedMin, max: paddedMax };
}

/**
 * Calculate range of annual growth rates for color scale normalization
 * @param trends Array of property trend data
 * @returns Object with min and max annual growth rates
 */
export function calculateGrowthRateRange(trends: PropertyTrendData[]): { min: number; max: number } {
  if (!trends.length) {
    return { min: -5, max: 5 }; // Default range if no data
  }
  
  // Extract all growth rates
  const rates = trends.map(trend => trend.annualGrowthRate);
  
  // Find min and max values
  const min = Math.min(...rates);
  const max = Math.max(...rates);
  
  // Apply some padding to the range
  const paddedMin = Math.floor(min * 1.1);
  const paddedMax = Math.ceil(max * 1.1);
  
  return { min: paddedMin, max: paddedMax };
}