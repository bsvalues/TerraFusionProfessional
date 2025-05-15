import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Property } from '@shared/schema';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import EnhancedMapComponent, { MapLayerState } from '@/components/map/EnhancedMapComponent';
import { usePropertySelection, PropertyWithOptionalFields } from '@/components/map/PropertySelectionContext';
import { useParcelData } from '@/services/gis/useParcelData';
import PropertyCard from '@/components/property/PropertyCard';
import { useQuery } from '@tanstack/react-query';

interface MapPanelProps {
  properties: Property[];
  className?: string;
}

// Define the base map layer configuration, viewable layers, and analysis layers
const BASE_LAYERS: MapLayerState[] = [
  { id: 'streets', name: 'Street Map', enabled: true },
  { id: 'imagery', name: 'Satellite', enabled: false },
  { id: 'topo', name: 'Topographic', enabled: false },
  { id: 'light', name: 'Light', enabled: false },
];

const VIEWABLE_LAYERS: MapLayerState[] = [
  { id: 'parcels', name: 'Property Parcels', enabled: true },
  { id: 'zoning', name: 'Zoning Districts', enabled: false },
  { id: 'flood-zones', name: 'Flood Zones', enabled: false },
  { id: 'countyBoundary', name: 'County Boundary', enabled: false },
  { id: 'schools', name: 'School Districts', enabled: false },
];

const ANALYSIS_LAYERS: MapLayerState[] = [
  { id: 'value-heatmap', name: 'Value Heatmap', enabled: false },
  { id: 'market-trends', name: 'Market Trends', enabled: false },
  { id: 'property-clusters', name: 'Property Clusters', enabled: false },
  { id: 'comparables', name: 'Comparable Properties', enabled: false },
];

/**
 * Panel for displaying the interactive property map
 * Modern, Apple-inspired design with enhanced user experience
 */
export const MapPanel: React.FC<MapPanelProps> = ({ 
  properties: apiProperties, 
  className = '' 
}) => {
  // Use actual parcel data from GIS files if available
  const { properties: gisProperties, loading: loadingGisData, error: gisDataError } = useParcelData();
  
  // Use GIS data if available, otherwise fall back to API data
  const properties = gisProperties && gisProperties.length > 0 ? gisProperties : apiProperties;
  
  // Selected property handling
  const { selectedProperties, selectProperty, deselectProperty } = usePropertySelection();
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  // Update selected property when selection changes
  useEffect(() => {
    if (selectedProperties.length > 0) {
      setSelectedProperty(selectedProperties[0]);
    } else {
      setSelectedProperty(null);
    }
  }, [selectedProperties]);

  // Handle property selection from map
  const handlePropertySelect = (property: PropertyWithOptionalFields) => {
    // If property.id === -1, it means we want to deselect
    if (property.id === -1) {
      if (selectedProperty) {
        deselectProperty(selectedProperty);
      }
      setSelectedProperty(null);
    } else {
      // Cast the property to Property since we know it's coming from our dataset
      selectProperty(property);
      setSelectedProperty(property as Property);
    }
  };

  // Fetch property details when a property is selected
  const { data: propertyDetails, isLoading: isLoadingPropertyDetails } = useQuery({
    queryKey: ['property', selectedProperty?.id],
    queryFn: async () => {
      if (!selectedProperty?.id) return null;
      const response = await fetch(`/api/properties/${selectedProperty.id}`);
      if (!response.ok) return selectedProperty; // Fall back to the selected property
      return response.json();
    },
    enabled: !!selectedProperty?.id, // Only run query when we have a selected property
    staleTime: 60000, // Cache for 1 minute
  });

  const [isPropertyCardVisible, setIsPropertyCardVisible] = useState(false);
  
  // Show property card when property is selected
  useEffect(() => {
    if (selectedProperty) {
      setIsPropertyCardVisible(true);
    }
  }, [selectedProperty]);

  return (
    <div className={cn("h-full w-full relative overflow-hidden", className)}>
      {/* Enhanced Map Component */}
      <EnhancedMapComponent
        properties={properties}
        onPropertySelect={handlePropertySelect}
        selectedProperty={selectedProperty}
        baseLayers={BASE_LAYERS}
        viewableLayers={VIEWABLE_LAYERS}
        analysisLayers={ANALYSIS_LAYERS}
      />

      {/* Property Information Panel */}
      <div className={cn(
        "absolute bottom-4 left-4 right-4 transition-all duration-300 transform",
        isPropertyCardVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0 pointer-events-none",
        "sm:left-auto sm:right-4 sm:bottom-4 sm:w-96"
      )}>
        <div className="relative">
          <Button 
            variant="ghost" 
            size="sm" 
            className="absolute -top-10 right-0 bg-white/90 shadow-sm"
            onClick={() => setIsPropertyCardVisible(false)}
          >
            <span className="sr-only">Close</span>
            ✕
          </Button>
          <PropertyCard 
            property={propertyDetails || selectedProperty} 
            isLoading={isLoadingPropertyDetails} 
          />
        </div>
      </div>
    </div>
  );
};