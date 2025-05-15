import { Property } from '@/shared/types';
import { apiRequest } from '@/lib/queryClient';

// Declare apiRequest return type to avoid TypeScript errors
declare module '@/lib/queryClient' {
  export function apiRequest<T>(method: string, url: string, body?: any): Promise<T>;
}

/**
 * Property filter parameters
 */
export interface PropertyFilterParams {
  neighborhood?: string;
  minYearBuilt?: number;
  maxYearBuilt?: number;
  minValue?: number;
  maxValue?: number;
  minSquareFeet?: number;
  maxSquareFeet?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

/**
 * Service for handling property data operations
 */
class PropertyService {
  /**
   * Retrieve all properties
   * @returns Promise with array of properties
   */
  async getProperties(): Promise<Property[]> {
    try {
      const response = await apiRequest<Property[]>('GET', '/api/properties');
      return response;
    } catch (error) {
      console.error('Error fetching properties:', error);
      throw error;
    }
  }

  /**
   * Retrieve a single property by ID
   * @param id Property ID
   * @returns Promise with property data
   */
  async getPropertyById(id: string): Promise<Property> {
    try {
      const response = await apiRequest<Property>('GET', `/api/properties/${id}`);
      return response;
    } catch (error) {
      console.error(`Error fetching property with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Retrieve properties with filtering
   * @param filters Filter parameters
   * @returns Promise with filtered array of properties
   */
  async getFilteredProperties(filters: PropertyFilterParams): Promise<Property[]> {
    try {
      // Convert filters to query parameters
      const queryParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
      
      const queryString = queryParams.toString();
      const url = `/api/properties${queryString ? `?${queryString}` : ''}`;
      
      const response = await apiRequest<Property[]>('GET', url);
      return response;
    } catch (error) {
      console.error('Error fetching filtered properties:', error);
      throw error;
    }
  }

  /**
   * Search properties by text
   * @param searchText Text to search for in property data
   * @returns Promise with matching properties
   */
  async searchProperties(searchText: string): Promise<Property[]> {
    try {
      const response = await apiRequest<Property[]>('GET', `/api/properties/search?q=${encodeURIComponent(searchText)}`);
      return response;
    } catch (error) {
      console.error('Error searching properties:', error);
      throw error;
    }
  }

  /**
   * Find similar properties to a reference property
   * @param referencePropertyId ID of the reference property
   * @param limit Maximum number of similar properties to return
   * @returns Promise with array of similar properties
   */
  async findSimilarProperties(referencePropertyId: string, limit: number = 5): Promise<Property[]> {
    try {
      const response = await apiRequest<Property[]>(
        'GET', 
        `/api/properties/similar?referenceId=${referencePropertyId}&limit=${limit}`
      );
      return response;
    } catch (error) {
      console.error('Error finding similar properties:', error);
      throw error;
    }
  }

  /**
   * Get properties within a geographic region
   * @param bounds Geographic bounds [south, west, north, east]
   * @returns Promise with properties in the region
   */
  async getPropertiesInRegion(bounds: [number, number, number, number]): Promise<Property[]> {
    try {
      const [south, west, north, east] = bounds;
      const response = await apiRequest<Property[]>(
        'GET', 
        `/api/properties/region?south=${south}&west=${west}&north=${north}&east=${east}`
      );
      return response;
    } catch (error) {
      console.error('Error fetching properties in region:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const propertyService = new PropertyService();