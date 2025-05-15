import React, { createContext, ReactNode, useState, useContext, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Property } from '@/shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

// Define weight factors for property comparison
interface PropertyWeights {
  squareFeet: number;
  yearBuilt: number;
  bedrooms: number;
  bathrooms: number;
  lotSize: number;
  neighborhood: number;
}

// Default weights for property comparison
const defaultWeights: PropertyWeights = {
  squareFeet: 1,
  yearBuilt: 1,
  bedrooms: 1,
  bathrooms: 1,
  lotSize: 1,
  neighborhood: 1
};

/**
 * Maximum number of properties that can be compared at once
 */
export const MAX_COMPARISON_PROPERTIES = 5;

// Define the context type
interface PropertyComparisonContextType {
  // All properties available for comparison
  properties: Property[];
  // Loading state for properties query
  isLoading: boolean;
  // Error from properties query
  error: Error | null;
  // Currently selected property ID
  selectedPropertyId: number | null;
  // Currently selected property object
  selectedProperty: Property | null;
  // Set selected property
  setSelectedProperty: (property: Property | null) => void;
  // Properties selected for comparison
  comparisonProperties: Property[];
  // Add property to comparison
  addToComparison: (property: Property) => void;
  // Remove property from comparison
  removeFromComparison: (propertyId: number | string) => void;
  // Clear all properties from comparison
  clearComparison: () => void;
  // Check if property is in comparison list
  isInComparison: (propertyId: number | string) => boolean;
  // Similar properties based on comparison
  similarProperties: Property[];
  // Find similar properties based on given property and count
  findSimilarProperties: (property: Property, count: number) => void;
  // Current weights used for property scoring
  weights: PropertyWeights;
  // Update weight factors for comparison
  setWeights: (weights: Partial<PropertyWeights>) => void;
}

// Create the context with a default value
export const PropertyComparisonContext = createContext<PropertyComparisonContextType>({
  properties: [],
  isLoading: false,
  error: null,
  selectedPropertyId: null,
  selectedProperty: null,
  setSelectedProperty: () => {},
  comparisonProperties: [],
  addToComparison: () => {},
  removeFromComparison: () => {},
  clearComparison: () => {},
  isInComparison: () => false,
  similarProperties: [],
  findSimilarProperties: () => {},
  weights: defaultWeights,
  setWeights: () => {}
});

/**
 * Provider component for property comparison functionality
 */
export const PropertyComparisonProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // State for tracking selected property and similar properties
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [comparisonProperties, setComparisonProperties] = useState<Property[]>([]);
  const [similarProperties, setSimilarProperties] = useState<Property[]>([]);
  const [weights, setWeights] = useState<PropertyWeights>(defaultWeights);
  const { toast } = useToast();

  // Fetch all properties for comparison
  const { data: properties = [], isLoading, error } = useQuery({
    queryKey: ['/api/properties'],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  /**
   * Add a property to the comparison list
   */
  const addToComparison = (property: Property) => {
    if (!property) return;
    
    // Check if property is already in the comparison
    if (comparisonProperties.some(p => p.id === property.id)) {
      toast({
        title: "Already in comparison",
        description: `Property at ${property.address} is already in your comparison list.`,
      });
      return;
    }
    
    // Check if we've reached the maximum number of properties
    if (comparisonProperties.length >= MAX_COMPARISON_PROPERTIES) {
      toast({
        title: "Maximum properties reached",
        description: `You can compare up to ${MAX_COMPARISON_PROPERTIES} properties at once. Remove a property before adding another.`,
        variant: "destructive"
      });
      return;
    }
    
    setComparisonProperties(prevProperties => [...prevProperties, property]);
    toast({
      title: "Property added",
      description: `Added ${property.address} to comparison.`
    });
  };
  
  /**
   * Remove a property from the comparison list
   */
  const removeFromComparison = (propertyId: number | string) => {
    setComparisonProperties(prevProperties => 
      prevProperties.filter(p => p.id !== propertyId)
    );
  };
  
  /**
   * Clear all properties from the comparison list
   */
  const clearComparison = () => {
    setComparisonProperties([]);
  };
  
  /**
   * Check if a property is in the comparison list
   */
  const isInComparison = (propertyId: number | string) => {
    return comparisonProperties.some(p => p.id === propertyId);
  };

  /**
   * Update weight factors for property comparison
   */
  const handleSetWeights = (newWeights: Partial<PropertyWeights>) => {
    setWeights(prevWeights => ({
      ...prevWeights,
      ...newWeights
    }));
  };

  /**
   * Calculate property similarity score based on weighted factors
   */
  const calculateSimilarityScore = (base: Property, compare: Property): number => {
    if (!base || !compare) return 0;

    let score = 0;
    let weightSum = 0;

    // Square footage comparison (weight: squareFeet)
    if (base.squareFeet && compare.squareFeet) {
      const sqftFactor = 1 - Math.abs(base.squareFeet - compare.squareFeet) / Math.max(base.squareFeet, 1);
      score += sqftFactor * weights.squareFeet;
      weightSum += weights.squareFeet;
    }

    // Year built comparison (weight: yearBuilt)
    if (base.yearBuilt && compare.yearBuilt) {
      const yearFactor = 1 - Math.abs(base.yearBuilt - compare.yearBuilt) / 100; // Assuming max difference of 100 years
      score += yearFactor * weights.yearBuilt;
      weightSum += weights.yearBuilt;
    }

    // Bedrooms comparison (weight: bedrooms)
    if (base.bedrooms && compare.bedrooms) {
      const bedroomFactor = 1 - Math.abs(base.bedrooms - compare.bedrooms) / 5; // Assuming max difference of 5 bedrooms
      score += bedroomFactor * weights.bedrooms;
      weightSum += weights.bedrooms;
    }

    // Bathrooms comparison (weight: bathrooms)
    if (base.bathrooms && compare.bathrooms) {
      const bathroomFactor = 1 - Math.abs(base.bathrooms - compare.bathrooms) / 5; // Assuming max difference of 5 bathrooms
      score += bathroomFactor * weights.bathrooms;
      weightSum += weights.bathrooms;
    }

    // Lot size comparison (weight: lotSize)
    if (base.lotSize && compare.lotSize) {
      const lotSizeFactor = 1 - Math.abs(base.lotSize - compare.lotSize) / Math.max(base.lotSize, 1);
      score += lotSizeFactor * weights.lotSize;
      weightSum += weights.lotSize;
    }

    // Neighborhood comparison (weight: neighborhood)
    if (base.neighborhood && compare.neighborhood) {
      const neighborhoodFactor = base.neighborhood === compare.neighborhood ? 1 : 0;
      score += neighborhoodFactor * weights.neighborhood;
      weightSum += weights.neighborhood;
    }

    // Normalize the score based on used weights
    return weightSum > 0 ? score / weightSum : 0;
  };

  /**
   * Find similar properties based on the given property
   */
  const findSimilarProperties = (property: Property, count: number = 5) => {
    if (!property || !properties || properties.length === 0) {
      setSimilarProperties([]);
      return;
    }

    // Calculate similarity scores for all properties
    const scoredProperties = properties
      .filter((p: Property) => p.id !== property.id) // Exclude the base property
      .map((p: Property) => ({
        property: p,
        score: calculateSimilarityScore(property, p)
      }))
      .sort((a, b) => b.score - a.score) // Sort by score (descending)
      .slice(0, count) // Take the top N properties
      .map(item => item.property);

    setSimilarProperties(scoredProperties);
  };

  // Clear similar properties when selected property changes
  useEffect(() => {
    if (selectedProperty) {
      findSimilarProperties(selectedProperty);
    } else {
      setSimilarProperties([]);
    }
  }, [selectedProperty, weights]);

  // Context value
  const contextValue: PropertyComparisonContextType = {
    properties,
    isLoading,
    error: error as Error || null,
    selectedPropertyId: selectedProperty?.id || null,
    selectedProperty,
    setSelectedProperty,
    comparisonProperties,
    addToComparison,
    removeFromComparison,
    clearComparison,
    isInComparison,
    similarProperties,
    findSimilarProperties,
    weights,
    setWeights: handleSetWeights
  };

  return (
    <PropertyComparisonContext.Provider value={contextValue}>
      {children}
    </PropertyComparisonContext.Provider>
  );
};

/**
 * Hook to use property comparison functionality
 */
export const usePropertyComparison = () => {
  const context = useContext(PropertyComparisonContext);
  if (!context) {
    throw new Error('usePropertyComparison must be used within a PropertyComparisonProvider');
  }
  return context;
};