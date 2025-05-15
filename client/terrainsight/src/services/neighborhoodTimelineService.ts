import { apiRequest } from '@/lib/queryClient';
import { NeighborhoodTimeline, NeighborhoodTimelineDataPoint } from '@shared/schema';
import * as neighborhoodService from './neighborhoodService';

/**
 * Re-export neighborhood timeline types from schema for backward compatibility
 */
export type { NeighborhoodTimeline, NeighborhoodTimelineDataPoint };

/**
 * Fetch neighborhood timelines with valuation trend data
 * @param years Number of years to include in the timeline
 * @returns Promise with an array of neighborhood timelines
 */
export async function getNeighborhoodTimelines(years: number = 10): Promise<NeighborhoodTimeline[]> {
  try {
    return await neighborhoodService.getNeighborhoodTimelines(years);
  } catch (error) {
    console.error('Error fetching neighborhood timelines:', error);
    throw error;
  }
}

/**
 * Fetch timeline data for a specific neighborhood
 * @param neighborhoodId Neighborhood ID
 * @param years Number of years to include
 * @returns Promise with neighborhood timeline data
 */
export async function getNeighborhoodTimeline(neighborhoodId: string, years: number = 10): Promise<NeighborhoodTimeline> {
  try {
    return await neighborhoodService.getNeighborhoodTimeline(neighborhoodId, years);
  } catch (error) {
    console.error(`Error fetching timeline for neighborhood ${neighborhoodId}:`, error);
    throw error;
  }
}

/**
 * Calculate average annual growth rate for a timeline
 * @param data Array of timeline data points
 * @returns Average annual growth rate as a decimal
 */
export function calculateAverageGrowthRate(data: NeighborhoodTimelineDataPoint[]): number {
  if (data.length < 2) return 0;
  
  // Calculate total growth over the entire period
  const firstValue = data[0].value;
  const lastValue = data[data.length - 1].value;
  
  if (firstValue === 0) return 0;
  
  const totalGrowth = (lastValue / firstValue) - 1;
  
  // Calculate average annual growth rate (CAGR)
  const years = data.length - 1;
  const averageAnnualGrowthRate = Math.pow(1 + totalGrowth, 1 / years) - 1;
  
  return averageAnnualGrowthRate;
}