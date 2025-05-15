import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet.heat';
import { type Property } from '@shared/schema';

// Fix TypeScript error for leaflet.heat module
declare module 'leaflet' {
  namespace HeatLayer {
    interface HeatLayerOptions {
      minOpacity?: number;
      maxZoom?: number;
      max?: number;
      radius?: number;
      blur?: number;
      gradient?: {[key: number]: string};
    }
  }
  
  class HeatLayer extends L.Layer {
    constructor(latlngs: Array<[number, number, number?]>, options?: HeatLayer.HeatLayerOptions);
    setLatLngs(latlngs: Array<[number, number, number?]>): this;
    addLatLng(latlng: [number, number, number?]): this;
    setOptions(options: HeatLayer.HeatLayerOptions): this;
    redraw(): this;
  }
  
  function heatLayer(latlngs: Array<[number, number, number?]>, options?: HeatLayer.HeatLayerOptions): HeatLayer;
}

export type MarketTrendMetric = 'value' | 'pricePerSqFt' | 'salesVolume' | 'valueChange' | 'daysOnMarket';

export type HeatMapSettings = {
  metric: MarketTrendMetric;
  radius: number;
  blur: number;
  gradient: {[key: number]: string};
  maxIntensity: number | null;
  intensityProperty: string;
  showLegend: boolean;
};

interface HeatMapLayerProps {
  map: L.Map;
  properties: Property[];
  settings: HeatMapSettings;
  visible: boolean;
}

export const HeatMapLayer: React.FC<HeatMapLayerProps> = ({
  map,
  properties,
  settings,
  visible
}) => {
  const heatLayerRef = useRef<L.HeatLayer | null>(null);
  
  // Helper function to get value for the heat map
  const getPropertyValue = (property: Property, metric: MarketTrendMetric): number => {
    switch(metric) {
      case 'value':
        return property.value ? parseFloat(property.value.replace(/[$,]/g, '')) : 0;
      case 'pricePerSqFt':
        return property.pricePerSqFt ? parseFloat(property.pricePerSqFt.replace(/[$,]/g, '')) : 0;
      case 'salesVolume':
        // This would require aggregation by area, for now we'll use 1 for each property
        return 1;
      case 'valueChange':
        // For demo purposes, generate a value between -10% and +20%
        // In a real implementation, this would come from historical data
        if (property.attributes) {
          const attrs = property.attributes as Record<string, unknown>;
          const valueChange = attrs.valueChange;
          if (valueChange !== undefined) {
            if (typeof valueChange === 'number') {
              return valueChange;
            } else if (typeof valueChange === 'string') {
              return parseFloat(valueChange);
            }
          }
        }
        return 0;
      case 'daysOnMarket':
        // For demo purposes, if we have a lastSaleDate, calculate days
        if (property.lastSaleDate) {
          const saleDate = new Date(property.lastSaleDate);
          const now = new Date();
          const diffTime = Math.abs(now.getTime() - saleDate.getTime());
          return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }
        return 0;
      default:
        return 0;
    }
  };
  
  // Create or update the heat map layer
  useEffect(() => {
    if (!map || !visible) {
      if (heatLayerRef.current) {
        try {
          map.removeLayer(heatLayerRef.current);
        } catch (error) {
          console.error("Error removing heat layer:", error);
        }
        heatLayerRef.current = null;
      }
      return;
    }
    
    // Map properties to heat map points [lat, lng, intensity]
    // Create properly typed points array for heat map
    const points: Array<[number, number, number]> = [];
    
    properties
      .filter(p => p.latitude && p.longitude)
      .forEach(property => {
        const value = getPropertyValue(property, settings.metric);
        const lat = parseFloat(property.latitude!.toString());
        const lng = parseFloat(property.longitude!.toString());
        
        if (!isNaN(lat) && !isNaN(lng) && !isNaN(value)) {
          points.push([lat, lng, value]);
        }
      });
    
    if (points.length === 0) {
      if (heatLayerRef.current) {
        try {
          map.removeLayer(heatLayerRef.current);
        } catch (error) {
          console.error("Error removing heat layer:", error);
        }
        heatLayerRef.current = null;
      }
      return;
    }
    
    // Calculate max value for intensity scaling if not provided
    const maxIntensity = settings.maxIntensity || Math.max(...points.map(p => p[2]));
    
    // Create or update heat layer
    if (heatLayerRef.current) {
      // Update existing layer
      try {
        heatLayerRef.current.setLatLngs(points);
        heatLayerRef.current.setOptions({
          radius: settings.radius,
          blur: settings.blur,
          gradient: settings.gradient,
          max: maxIntensity
        });
      } catch (error) {
        console.error("Error updating heat layer:", error);
        // Try to recover by recreating the layer
        try {
          map.removeLayer(heatLayerRef.current);
          heatLayerRef.current = null;
          
          const heatLayer = L.heatLayer(points, {
            radius: settings.radius,
            blur: settings.blur,
            gradient: settings.gradient,
            max: maxIntensity,
            minOpacity: 0.4,
            maxZoom: 18
          });
          
          heatLayer.addTo(map);
          heatLayerRef.current = heatLayer;
        } catch (recreateError) {
          console.error("Failed to recreate heat layer:", recreateError);
        }
      }
    } else {
      // Create new layer
      try {
        const heatLayer = L.heatLayer(points, {
          radius: settings.radius,
          blur: settings.blur,
          gradient: settings.gradient,
          max: maxIntensity,
          minOpacity: 0.4,
          maxZoom: 18
        });
        
        heatLayer.addTo(map);
        heatLayerRef.current = heatLayer;
      } catch (error) {
        console.error("Error creating heat layer:", error);
      }
    }
    
    // Cleanup function for when component unmounts or dependencies change
    return () => {
      if (heatLayerRef.current && map) {
        try {
          console.log("Removing heat layer");
          map.removeLayer(heatLayerRef.current);
        } catch (error) {
          console.error("Error removing heat layer during cleanup:", error);
        }
        heatLayerRef.current = null;
      }
    };
  }, [map, properties, settings, visible]);
  
  return null; // This is a utility component with no visible output
};

export default HeatMapLayer;