import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Property } from '@/shared/types';
import { 
  NeighborhoodData, 
  neighborhoodService 
} from '@/services/neighborhoodService';

// Define the context type
interface NeighborhoodContextType {
  neighborhoodData: Record<string, NeighborhoodData | null>;
  fetchNeighborhoodData: (property: Property) => Promise<NeighborhoodData | null>;
  isNeighborhoodLoading: (propertyId: string) => boolean;
  getNeighborhoodDataForProperty: (propertyId: string) => NeighborhoodData | null;
  clearNeighborhoodCache: () => void;
}

// Create the neighborhood context
const NeighborhoodContext = createContext<NeighborhoodContextType>({
  neighborhoodData: {},
  fetchNeighborhoodData: async () => null,
  isNeighborhoodLoading: () => false,
  getNeighborhoodDataForProperty: () => null,
  clearNeighborhoodCache: () => {},
});

// Define the provider props
interface NeighborhoodProviderProps {
  children: ReactNode;
}

// Hook to use the neighborhood context
export const useNeighborhood = () => useContext(NeighborhoodContext);

// Provider component
export const NeighborhoodProvider: React.FC<NeighborhoodProviderProps> = ({ children }) => {
  // State to store neighborhood data for properties
  const [neighborhoodData, setNeighborhoodData] = useState<Record<string, NeighborhoodData | null>>({});
  
  // State to track loading status for properties
  const [loadingProperties, setLoadingProperties] = useState<Record<string, boolean>>({});
  
  // Clean up neighborhood data when the component unmounts
  useEffect(() => {
    return () => {
      neighborhoodService.clearCache();
    };
  }, []);
  
  // Check if neighborhood data is being loaded for a property
  const isNeighborhoodLoading = (propertyId: string): boolean => {
    return loadingProperties[propertyId] || false;
  };
  
  // Get neighborhood data for a property
  const getNeighborhoodDataForProperty = (propertyId: string): NeighborhoodData | null => {
    return neighborhoodData[propertyId] || null;
  };
  
  // Fetch neighborhood data for a property
  const fetchNeighborhoodData = async (property: Property): Promise<NeighborhoodData | null> => {
    if (!property || !property.id) return null;
    
    // If we already have the data, return it
    if (neighborhoodData[property.id]) {
      return neighborhoodData[property.id];
    }
    
    // Set loading state
    setLoadingProperties(prev => ({ ...prev, [property.id]: true }));
    
    try {
      // Fetch the neighborhood data from the service
      const data = await neighborhoodService.getNeighborhoodData(property);
      
      // Store the data in state
      setNeighborhoodData(prev => ({ ...prev, [property.id]: data }));
      
      return data;
    } catch (error) {
      console.error('Error fetching neighborhood data:', error);
      setNeighborhoodData(prev => ({ ...prev, [property.id]: null }));
      return null;
    } finally {
      // Clear loading state
      setLoadingProperties(prev => ({ ...prev, [property.id]: false }));
    }
  };
  
  // Clear the neighborhood cache
  const clearNeighborhoodCache = () => {
    setNeighborhoodData({});
    neighborhoodService.clearCache();
  };
  
  // Create the context value
  const value: NeighborhoodContextType = {
    neighborhoodData,
    fetchNeighborhoodData,
    isNeighborhoodLoading,
    getNeighborhoodDataForProperty,
    clearNeighborhoodCache,
  };
  
  return (
    <NeighborhoodContext.Provider value={value}>
      {children}
    </NeighborhoodContext.Provider>
  );
};