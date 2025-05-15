import { NeighborhoodTimeline } from '@shared/schema';
import { Property } from '@/shared/types';

// NeighborhoodData type definition
export interface NeighborhoodData {
  id: string;
  name: string;
  medianHomeValue: number;
  valueChangePercent: number;
  schoolRating: number;
  crimeRate: number;
  walkScore: number;
  transitScore: number;
  amenities: {
    parks: number;
    schools: number;
    restaurants: number;
    shopping: number;
  };
  demographics: {
    population: number;
    medianAge: number;
    medianIncome: number;
    homeownership: number;
  };
}

// Cache for neighborhood data
const neighborhoodDataCache: Record<string, NeighborhoodData> = {};

/**
 * Neighborhood service functions
 */
export const neighborhoodService = {
  /**
   * Fetches all available neighborhoods
   * @returns Array of neighborhood objects with id and name
   */
  async getNeighborhoods(): Promise<{ id: string; name: string }[]> {
    const response = await fetch('/api/neighborhoods');
    
    if (!response.ok) {
      throw new Error('Failed to fetch neighborhoods');
    }
    
    return response.json();
  },

  /**
   * Fetches all neighborhood timelines
   * @param years Number of years of data to retrieve (default: 10)
   * @returns Array of NeighborhoodTimeline objects
   */
  async getNeighborhoodTimelines(years: number = 10): Promise<NeighborhoodTimeline[]> {
    const response = await fetch(`/api/neighborhoods/timelines?years=${years}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch neighborhood timelines');
    }
    
    return response.json();
  },

  /**
   * Fetches timeline data for a specific neighborhood
   * @param id Neighborhood ID
   * @param years Number of years of data to retrieve (default: 10)
   * @returns NeighborhoodTimeline object
   */
  async getNeighborhoodTimeline(id: string, years: number = 10): Promise<NeighborhoodTimeline> {
    const response = await fetch(`/api/neighborhoods/${id}/timeline?years=${years}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Neighborhood ${id} not found`);
      }
      throw new Error('Failed to fetch neighborhood timeline');
    }
    
    return response.json();
  },

  /**
   * Fetches neighborhood data for a property
   * Uses mock data for now
   * @param property Property to get neighborhood data for
   * @returns NeighborhoodData object
   */
  async getNeighborhoodData(property: Property): Promise<NeighborhoodData> {
    // Check cache first
    if (neighborhoodDataCache[property.id]) {
      return neighborhoodDataCache[property.id];
    }
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Create mock neighborhood data
    const mockData: NeighborhoodData = {
      id: property.neighborhood || 'unknown',
      name: property.neighborhood || 'Unknown Neighborhood',
      medianHomeValue: parseInt(property.value || '0', 10) * 0.9,
      valueChangePercent: 5.2,
      schoolRating: 8.1,
      crimeRate: 14.2,
      walkScore: 72,
      transitScore: 65,
      amenities: {
        parks: 4,
        schools: 3,
        restaurants: 12,
        shopping: 8
      },
      demographics: {
        population: 15420,
        medianAge: 34.5,
        medianIncome: 75600,
        homeownership: 0.68
      }
    };
    
    // Cache the data
    neighborhoodDataCache[property.id] = mockData;
    
    return mockData;
  },
  
  /**
   * Clears the neighborhood data cache
   */
  clearCache(): void {
    Object.keys(neighborhoodDataCache).forEach(key => {
      delete neighborhoodDataCache[key];
    });
  }
};

// For backward compatibility
export async function getNeighborhoods(): Promise<{ id: string; name: string }[]> {
  return neighborhoodService.getNeighborhoods();
}

export async function getNeighborhoodTimelines(years: number = 10): Promise<NeighborhoodTimeline[]> {
  return neighborhoodService.getNeighborhoodTimelines(years);
}

export async function getNeighborhoodTimeline(id: string, years: number = 10): Promise<NeighborhoodTimeline> {
  return neighborhoodService.getNeighborhoodTimeline(id, years);
}