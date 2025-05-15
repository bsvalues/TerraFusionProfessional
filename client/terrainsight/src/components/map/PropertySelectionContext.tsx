import React, { createContext, useContext, useState } from 'react';
import { Property } from '@shared/schema';

// Define PropertyWithOptionalFields type to match EnhancedMapComponent
export type PropertyWithOptionalFields = Omit<Property, 'propertyType'> & {
  propertyType?: string | null;
};

interface PropertySelectionContextType {
  selectedProperties: Property[];
  selectProperty: (property: Property | PropertyWithOptionalFields) => void;
  deselectProperty: (property: Property | PropertyWithOptionalFields) => void;
  togglePropertySelection: (property: Property | PropertyWithOptionalFields) => void;
  clearSelectedProperties: () => void;
}

const PropertySelectionContext = createContext<PropertySelectionContextType>({
  selectedProperties: [],
  selectProperty: () => {},
  deselectProperty: () => {},
  togglePropertySelection: () => {},
  clearSelectedProperties: () => {},
});

export const usePropertySelection = () => useContext(PropertySelectionContext);

export const PropertySelectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedProperties, setSelectedProperties] = useState<Property[]>([]);

  const selectProperty = (property: Property | PropertyWithOptionalFields) => {
    const propertyExists = selectedProperties.some((p) => p.id === property.id);
    if (!propertyExists) {
      // Ensure propertyType is not undefined before adding to selectedProperties
      const propertyToAdd = {
        ...property,
        propertyType: property.propertyType || null
      } as Property;
      
      setSelectedProperties([...selectedProperties, propertyToAdd]);
    }
  };

  const deselectProperty = (property: Property | PropertyWithOptionalFields) => {
    setSelectedProperties(selectedProperties.filter((p) => p.id !== property.id));
  };

  const togglePropertySelection = (property: Property | PropertyWithOptionalFields) => {
    const propertyExists = selectedProperties.some((p) => p.id === property.id);
    if (propertyExists) {
      deselectProperty(property);
    } else {
      selectProperty(property);
    }
  };

  const clearSelectedProperties = () => {
    setSelectedProperties([]);
  };

  const value = {
    selectedProperties,
    selectProperty,
    deselectProperty,
    togglePropertySelection,
    clearSelectedProperties,
  };

  return (
    <PropertySelectionContext.Provider value={value}>
      {children}
    </PropertySelectionContext.Provider>
  );
};