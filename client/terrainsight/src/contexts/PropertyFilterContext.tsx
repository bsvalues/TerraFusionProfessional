import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { Property } from '@shared/schema';

export interface PropertyFilterState {
  propertyTypes: string[];
  valueRange: [number, number];
  yearBuiltRange: [number, number];
  squareFeetRange: [number, number];
  neighborhoods: string[];
  isActive: boolean;
  activeFilterCount: number;
}

export type FilterAction =
  | { type: 'SET_PROPERTY_TYPES'; payload: string[] }
  | { type: 'SET_VALUE_RANGE'; payload: [number, number] }
  | { type: 'SET_YEAR_BUILT_RANGE'; payload: [number, number] }
  | { type: 'SET_SQUARE_FEET_RANGE'; payload: [number, number] }
  | { type: 'SET_NEIGHBORHOODS'; payload: string[] }
  | { type: 'RESET_FILTERS' }
  | { type: 'SET_QUICK_FILTER'; payload: Partial<PropertyFilterState> }
  | { type: 'TOGGLE_ACTIVE'; payload: boolean };

interface PropertyFilterContextType {
  filters: PropertyFilterState;
  dispatch: React.Dispatch<FilterAction>;
  applyFilters: (properties: Property[]) => Property[];
}

const PropertyFilterContext = createContext<PropertyFilterContextType | undefined>(undefined);

// Initial filter state with defaults
const initialFilterState: PropertyFilterState = {
  propertyTypes: [],
  valueRange: [0, 10000000], // Typical price range for properties
  yearBuiltRange: [1900, new Date().getFullYear()], // From 1900 to current year
  squareFeetRange: [0, 10000], // Typical square footage range
  neighborhoods: [],
  isActive: true,
  activeFilterCount: 0
};

function filterReducer(state: PropertyFilterState, action: FilterAction): PropertyFilterState {
  switch (action.type) {
    case 'SET_PROPERTY_TYPES':
      return {
        ...state,
        propertyTypes: action.payload,
        activeFilterCount: calculateActiveFilterCount({
          ...state,
          propertyTypes: action.payload
        })
      };
    case 'SET_VALUE_RANGE':
      return {
        ...state,
        valueRange: action.payload,
        activeFilterCount: calculateActiveFilterCount({
          ...state,
          valueRange: action.payload
        })
      };
    case 'SET_YEAR_BUILT_RANGE':
      return {
        ...state,
        yearBuiltRange: action.payload,
        activeFilterCount: calculateActiveFilterCount({
          ...state,
          yearBuiltRange: action.payload
        })
      };
    case 'SET_SQUARE_FEET_RANGE':
      return {
        ...state,
        squareFeetRange: action.payload,
        activeFilterCount: calculateActiveFilterCount({
          ...state,
          squareFeetRange: action.payload
        })
      };
    case 'SET_NEIGHBORHOODS':
      return {
        ...state,
        neighborhoods: action.payload,
        activeFilterCount: calculateActiveFilterCount({
          ...state,
          neighborhoods: action.payload
        })
      };
    case 'RESET_FILTERS':
      return {
        ...initialFilterState,
        isActive: state.isActive,
        activeFilterCount: 0
      };
    case 'SET_QUICK_FILTER':
      const newState = { ...state, ...action.payload };
      return {
        ...newState,
        activeFilterCount: calculateActiveFilterCount(newState)
      };
    case 'TOGGLE_ACTIVE':
      return { ...state, isActive: action.payload };
    default:
      return state;
  }
}

// Helper to calculate how many filters are active
function calculateActiveFilterCount(state: PropertyFilterState): number {
  let count = 0;
  
  if (state.propertyTypes.length > 0) count++;
  
  if (state.valueRange[0] > initialFilterState.valueRange[0] || 
      state.valueRange[1] < initialFilterState.valueRange[1]) {
    count++;
  }
  
  if (state.yearBuiltRange[0] > initialFilterState.yearBuiltRange[0] || 
      state.yearBuiltRange[1] < initialFilterState.yearBuiltRange[1]) {
    count++;
  }
  
  if (state.squareFeetRange[0] > initialFilterState.squareFeetRange[0] || 
      state.squareFeetRange[1] < initialFilterState.squareFeetRange[1]) {
    count++;
  }
  
  if (state.neighborhoods.length > 0) count++;
  
  return count;
}

// Helper function to convert string value to number
function getPropertyValueAsNumber(property: Property): number {
  if (!property.value) return 0;
  if (typeof property.value === 'number') return property.value;
  return parseFloat(property.value.replace(/[^0-9.-]+/g, '')) || 0;
}

// PropertyFilterProvider component
export function PropertyFilterProvider({ children }: { children: ReactNode }) {
  const [filters, dispatch] = useReducer(filterReducer, initialFilterState);

  // Function to apply filters to a list of properties
  const applyFilters = (properties: Property[]): Property[] => {
    if (!filters.isActive || filters.activeFilterCount === 0) {
      return properties;
    }

    return properties.filter(property => {
      // Filter by property type
      if (filters.propertyTypes.length > 0 && property.propertyType) {
        if (!filters.propertyTypes.includes(property.propertyType.toLowerCase())) {
          return false;
        }
      }

      // Filter by value range
      const propertyValue = getPropertyValueAsNumber(property);
      if (propertyValue < filters.valueRange[0] || propertyValue > filters.valueRange[1]) {
        return false;
      }

      // Filter by year built
      if (property.yearBuilt) {
        if (property.yearBuilt < filters.yearBuiltRange[0] || property.yearBuilt > filters.yearBuiltRange[1]) {
          return false;
        }
      }

      // Filter by square feet
      if (property.squareFeet) {
        if (property.squareFeet < filters.squareFeetRange[0] || property.squareFeet > filters.squareFeetRange[1]) {
          return false;
        }
      }

      // Filter by neighborhood
      if (filters.neighborhoods.length > 0 && property.neighborhood) {
        if (!filters.neighborhoods.includes(property.neighborhood)) {
          return false;
        }
      }

      return true;
    });
  };

  const value = { filters, dispatch, applyFilters };

  return (
    <PropertyFilterContext.Provider value={value}>
      {children}
    </PropertyFilterContext.Provider>
  );
}

// Custom hook to use property filter context
export function usePropertyFilter() {
  const context = useContext(PropertyFilterContext);
  if (context === undefined) {
    throw new Error('usePropertyFilter must be used within a PropertyFilterProvider');
  }
  return context;
}

export default PropertyFilterContext;