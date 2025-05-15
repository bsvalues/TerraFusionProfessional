import React, { useState, useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';
import { Property } from '@shared/schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { formatCurrency } from '@/lib/utils';

// Type definition for heat map variables
type HeatmapVariable = 'value' | 'pricePerSqFt' | 'landValue' | 'squareFeet';

// Interface for component props
interface HeatmapVisualizationProps {
  properties: Property[];
}

/**
 * Component for visualizing property data as a heat map
 */
export const HeatmapVisualization: React.FC<HeatmapVisualizationProps> = ({ properties }) => {
  // Get map instance from react-leaflet
  const map = useMap();

  // State for heat map configuration
  const [intensity, setIntensity] = useState<number>(0.5);
  const [radius, setRadius] = useState<number>(20);
  const [variable, setVariable] = useState<HeatmapVariable>('value');

  // Reference to heat layer
  const heatLayerRef = useRef<L.HeatLayer | null>(null);

  // Convert string values to numbers
  const getPropertyValue = (property: Property, variable: HeatmapVariable): number => {
    if (!property) return 0;

    switch (variable) {
      case 'value':
        return property.value ? parseFloat(property.value.replace(/[^0-9.-]+/g, '')) : 0;
      case 'pricePerSqFt':
        return property.pricePerSqFt ? parseFloat(property.pricePerSqFt.replace(/[^0-9.-]+/g, '')) : 0;
      case 'landValue':
        return property.landValue ? parseFloat(property.landValue.replace(/[^0-9.-]+/g, '')) : 0;
      case 'squareFeet':
        return property.squareFeet || 0;
      default:
        return 0;
    }
  };

  // Calculate max value for normalization
  const getMaxValue = (): number => {
    if (properties.length === 0) return 1;

    return Math.max(
      ...properties.map(property => getPropertyValue(property, variable))
    );
  };

  // Generate heat map points
  const generateHeatMapPoints = (): [number, number, number][] => {
    const validProperties = properties.filter(
      property => property.latitude && property.longitude
    );

    if (validProperties.length === 0) return [];

    const maxValue = getMaxValue();

    return validProperties.map(property => {
      const lat = Number(property.latitude);
      const lng = Number(property.longitude);
      const value = getPropertyValue(property, variable);
      // Normalize value between 0 and 1, then scale by intensity
      const intensityValue = maxValue ? (value / maxValue) * intensity : 0;

      return [lat, lng, intensityValue];
    });
  };

  // Make sure map is properly sized
  useEffect(() => {
    if (!map) return;
    
    // Force a map size recalculation - fixes issues with map container having zero height
    setTimeout(() => {
      map.invalidateSize();
    }, 300);
  }, [map]);

  // Initialize or update heat map
  useEffect(() => {
    if (!map) return;

    // Generate heat points
    const heatPoints = generateHeatMapPoints();
    
    // Ensure map is properly sized
    map.invalidateSize();
    
    // Only create/update heatmap if we have valid points and map is initialized
    if (heatPoints.length > 0 && map.getSize().y > 0) {
      if (heatLayerRef.current) {
        // Update existing layer
        heatLayerRef.current.setLatLngs(heatPoints);
        heatLayerRef.current.setOptions({
          radius: radius,
          maxZoom: 15,
          blur: 15,
          gradient: { 0.4: 'blue', 0.6: 'lime', 0.8: 'yellow', 1.0: 'red' }
        });
      } else {
        // Create new heat map layer with a try-catch to handle potential errors
        try {
          const heatLayer = L.heatLayer(heatPoints, {
            radius: radius,
            maxZoom: 15,
            blur: 15,
            gradient: { 0.4: 'blue', 0.6: 'lime', 0.8: 'yellow', 1.0: 'red' }
          });
          
          // Only add to map if successfully created
          heatLayer.addTo(map);
          heatLayerRef.current = heatLayer;
        } catch (error) {
          console.error("Error creating heat layer:", error);
        }
      }
    } else if (heatLayerRef.current && map) {
      // Remove layer if no points or invalid map size
      map.removeLayer(heatLayerRef.current);
      heatLayerRef.current = null;
    }

    // Cleanup on unmount
    return () => {
      if (heatLayerRef.current && map) {
        map.removeLayer(heatLayerRef.current);
        heatLayerRef.current = null;
      }
    };
  }, [map, properties, variable, intensity, radius]);

  // Handle variable change
  const handleVariableChange = (value: string) => {
    setVariable(value as HeatmapVariable);
  };

  // Handle intensity change
  const handleIntensityChange = (value: number[]) => {
    setIntensity(value[0]);
  };

  // Handle radius change
  const handleRadiusChange = (value: number[]) => {
    setRadius(value[0]);
  };

  // Render component
  return (
    <Card className="w-80 shadow-md absolute top-4 right-4 z-[1000] bg-white bg-opacity-90">
      <CardHeader>
        <CardTitle>Heat Map</CardTitle>
      </CardHeader>
      <CardContent>
        {properties.length === 0 ? (
          <div>No property data available for heat map visualization.</div>
        ) : (
          <>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="variable-select">Variable</Label>
                <Select
                  value={variable}
                  onValueChange={handleVariableChange}
                >
                  <SelectTrigger id="variable-select" aria-label="Variable">
                    <SelectValue placeholder="Select variable" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="value">Property Value</SelectItem>
                    <SelectItem value="pricePerSqFt">Price per Sq Ft</SelectItem>
                    <SelectItem value="landValue">Land Value</SelectItem>
                    <SelectItem value="squareFeet">Square Footage</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="intensity-slider">Intensity</Label>
                  <span className="text-sm">{(intensity * 100).toFixed(0)}%</span>
                </div>
                <Slider
                  id="intensity-slider"
                  min={0.1}
                  max={1}
                  step={0.1}
                  aria-label="Intensity"
                  value={[intensity]}
                  onValueChange={handleIntensityChange}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="radius-slider">Radius</Label>
                  <span className="text-sm">{radius}px</span>
                </div>
                <Slider
                  id="radius-slider"
                  min={5}
                  max={50}
                  step={1}
                  aria-label="Radius"
                  value={[radius]}
                  onValueChange={handleRadiusChange}
                />
              </div>

              <div className="mt-4 text-xs text-gray-600">
                <p>Showing heat map based on {variable === 'value' 
                  ? 'property values' 
                  : variable === 'pricePerSqFt' 
                    ? 'price per square foot' 
                    : variable === 'landValue'
                      ? 'land values'
                      : 'square footage'}.</p>
                <p className="mt-1">
                  Data points: {properties.filter(p => p.latitude && p.longitude).length}
                </p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};