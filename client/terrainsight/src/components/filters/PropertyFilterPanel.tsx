import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { FilterX, Search } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { usePropertyFilter } from '@/contexts/PropertyFilterContext';
import { formatCurrency } from '@/lib/utils';
import RangeFilter from './RangeFilter';
import PropertyTypeFilter from './PropertyTypeFilter';
import NeighborhoodFilter from './NeighborhoodFilter';
import QuickFilterButton, { QuickFilter } from './QuickFilterButton';
import { useIsMobile } from '@/hooks/use-mobile';

interface PropertyFilterPanelProps {
  className?: string;
}

// Define quick filters
const QUICK_FILTERS: QuickFilter[] = [
  {
    id: 'high-value',
    name: 'High Value',
    description: 'Properties valued at $500,000 or more',
    filter: {
      valueRange: [500000, 10000000],
      propertyTypes: []
    }
  },
  {
    id: 'new-construction',
    name: 'New Construction',
    description: 'Properties built in the last 5 years',
    filter: {
      yearBuiltRange: [new Date().getFullYear() - 5, new Date().getFullYear()],
      propertyTypes: []
    }
  },
  {
    id: 'large-lots',
    name: 'Large Lots',
    description: 'Properties with 3,000+ square feet',
    filter: {
      squareFeetRange: [3000, 100000],
      propertyTypes: []
    }
  },
  {
    id: 'residential-only',
    name: 'Residential',
    description: 'Only residential properties',
    filter: {
      propertyTypes: ['residential']
    }
  },
  {
    id: 'commercial-only',
    name: 'Commercial',
    description: 'Only commercial properties',
    filter: {
      propertyTypes: ['commercial']
    }
  }
];

export const PropertyFilterPanel: React.FC<PropertyFilterPanelProps> = ({ className }) => {
  const isMobile = useIsMobile();
  const { filters, dispatch, applyFilters } = usePropertyFilter();
  const [expanded, setExpanded] = useState(!isMobile);
  
  // Count active filters
  const activeFilterCount = filters.activeFilterCount;
  
  // Handle toggling the filter active state
  const handleToggleActive = () => {
    dispatch({ type: 'TOGGLE_ACTIVE', payload: !filters.isActive });
  };
  
  // Reset all filters to default values
  const handleResetFilters = () => {
    dispatch({ type: 'RESET_FILTERS' });
  };
  
  // Apply a quick filter
  const handleQuickFilter = (filterState: Partial<typeof filters>) => {
    dispatch({ type: 'SET_QUICK_FILTER', payload: filterState });
  };
  
  // Check if a quick filter is currently active
  const isQuickFilterActive = (quickFilter: QuickFilter): boolean => {
    const { filter } = quickFilter;
    
    // For each property in the quick filter
    for (const key in filter) {
      const typedKey = key as keyof typeof filter;
      
      // If it's an array (like propertyTypes)
      if (Array.isArray(filter[typedKey])) {
        const filterArray = filter[typedKey] as string[];
        const stateArray = filters[typedKey as keyof typeof filters] as string[];
        
        // If arrays don't match in length or content
        if (filterArray.length !== stateArray.length) {
          return false;
        }
        
        for (const item of filterArray) {
          if (!stateArray.includes(item)) {
            return false;
          }
        }
      }
      // If it's a range (like valueRange)
      else if (Array.isArray(filters[typedKey as keyof typeof filters])) {
        // Explicitly cast to the correct type
        const filterRange = filter[typedKey] as [number, number];
        const filtersValue = filters[typedKey as keyof typeof filters];
        
        // Make sure we're dealing with an array that can be treated as a range
        if (Array.isArray(filtersValue) && filtersValue.length === 2 && 
            typeof filtersValue[0] === 'number' && typeof filtersValue[1] === 'number') {
          const stateRange = filtersValue as [number, number];
          
          if (filterRange[0] !== stateRange[0] || filterRange[1] !== stateRange[1]) {
            return false;
          }
        } else {
          // If the format doesn't match, they're definitely not equal
          return false;
        }
      }
    }
    
    return true;
  };
  
  return (
    <Card className={`${className} shadow-md`}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg flex items-center">
            Filters
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFilterCount}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Switch
              id="filter-active"
              checked={filters.isActive}
              onCheckedChange={handleToggleActive}
              aria-label={filters.isActive ? 'Disable filters' : 'Enable filters'}
            />
            <Label htmlFor="filter-active" className="text-sm cursor-pointer">
              {filters.isActive ? 'Active' : 'Inactive'}
            </Label>
          </div>
        </div>
        {isMobile && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="w-full mt-2"
          >
            {expanded ? 'Collapse Filters' : 'Expand Filters'}
          </Button>
        )}
      </CardHeader>
      
      {expanded && (
        <>
          <Separator />
          
          {/* Quick filters */}
          <div className="px-6 py-3">
            <h3 className="text-sm font-medium mb-2">Quick Filters</h3>
            <div className="flex flex-wrap gap-2">
              {QUICK_FILTERS.map((filter) => (
                <QuickFilterButton
                  key={filter.id}
                  filter={filter}
                  onClick={handleQuickFilter}
                  disabled={!filters.isActive}
                  active={isQuickFilterActive(filter)}
                />
              ))}
            </div>
          </div>
          
          <Separator />
          
          {/* Detailed filters */}
          <ScrollArea className="h-[calc(100vh-300px)] max-h-[500px]">
            <CardContent className="pt-4 space-y-5">
              {/* Property Types */}
              <PropertyTypeFilter
                selectedTypes={filters.propertyTypes}
                onChange={(types) => 
                  dispatch({ type: 'SET_PROPERTY_TYPES', payload: types })
                }
                disabled={!filters.isActive}
              />
              
              <Separator />
              
              {/* Value Range */}
              <RangeFilter
                label="Property Value"
                min={100000}
                max={10000000}
                step={10000}
                value={filters.valueRange}
                onChange={(range) => 
                  dispatch({ type: 'SET_VALUE_RANGE', payload: range })
                }
                formatValue={(val) => formatCurrency(val, 'en-US', 'USD', 0)}
                disabled={!filters.isActive}
              />
              
              <Separator />
              
              {/* Year Built Range */}
              <RangeFilter
                label="Year Built"
                min={1900}
                max={new Date().getFullYear()}
                step={1}
                value={filters.yearBuiltRange}
                onChange={(range) => 
                  dispatch({ type: 'SET_YEAR_BUILT_RANGE', payload: range })
                }
                disabled={!filters.isActive}
              />
              
              <Separator />
              
              {/* Square Feet Range */}
              <RangeFilter
                label="Square Feet"
                min={500}
                max={10000}
                step={100}
                value={filters.squareFeetRange}
                onChange={(range) => 
                  dispatch({ type: 'SET_SQUARE_FEET_RANGE', payload: range })
                }
                formatValue={(val) => `${val.toLocaleString()} sq ft`}
                disabled={!filters.isActive}
              />
              
              <Separator />
              
              {/* Neighborhoods */}
              <NeighborhoodFilter
                selectedNeighborhoods={filters.neighborhoods}
                onChange={(neighborhoods) => 
                  dispatch({ type: 'SET_NEIGHBORHOODS', payload: neighborhoods })
                }
                disabled={!filters.isActive}
              />
            </CardContent>
          </ScrollArea>
          
          <Separator />
          
          {/* Filter actions */}
          <div className="p-4 flex justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetFilters}
              disabled={!filters.isActive || activeFilterCount === 0}
              className="flex items-center gap-1"
            >
              <FilterX className="h-4 w-4" />
              Reset Filters
            </Button>
            
            <Button
              variant="default"
              size="sm"
              className="flex items-center gap-1"
              aria-label="Search with filters"
              disabled={!filters.isActive}
            >
              <Search className="h-4 w-4" />
              Apply Filters
            </Button>
          </div>
        </>
      )}
    </Card>
  );
};

export default PropertyFilterPanel;