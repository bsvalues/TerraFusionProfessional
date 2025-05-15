import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Property } from '@shared/schema';
import { formatCurrency, formatNumber, formatPercentage } from '@/lib/utils';

interface PropertyComparisonHeatmapProps {
  properties: Property[];
  selectedProperties?: Property[];
}

type HeatmapCell = {
  value: number;
  intensity: number;
  property: Property;
  attribute: string;
  formattedValue: string;
};

type AttributeConfig = {
  label: string;
  key: keyof Property;
  format: (value: any) => string;
  color: string;
  min?: number;
  max?: number;
  inverse?: boolean;
};

export function PropertyComparisonHeatmap({ 
  properties, 
  selectedProperties = []
}: PropertyComparisonHeatmapProps) {
  const [sortAttribute, setSortAttribute] = useState<keyof Property>('value');
  const [highlightSelected, setHighlightSelected] = useState(true);
  const [visualMode, setVisualMode] = useState<'absolute' | 'relative'>('relative');
  
  // Define available attributes for comparison
  const attributeConfigs: Record<string, AttributeConfig> = {
    value: { 
      label: 'Property Value', 
      key: 'value', 
      format: (val) => formatCurrency(parseFloat(val)), 
      color: 'rgb(59, 130, 246)' // blue
    },
    squareFeet: { 
      label: 'Square Feet', 
      key: 'squareFeet', 
      format: (val) => formatNumber(val), 
      color: 'rgb(16, 185, 129)' // green
    },
    yearBuilt: { 
      label: 'Year Built', 
      key: 'yearBuilt', 
      format: (val) => val ? val.toString() : 'N/A',
      color: 'rgb(139, 92, 246)', // purple
      inverse: true // older is worse for condition, typically
    },
    bedrooms: { 
      label: 'Bedrooms', 
      key: 'bedrooms', 
      format: (val) => val ? val.toString() : 'N/A', 
      color: 'rgb(245, 158, 11)' // amber
    },
    bathrooms: { 
      label: 'Bathrooms', 
      key: 'bathrooms', 
      format: (val) => val ? val.toString() : 'N/A', 
      color: 'rgb(236, 72, 153)' // pink
    }
  };
  
  // Helper function to extract numeric value from property
  const getPropertyValue = (property: Property, key: keyof Property): number => {
    if (property[key] === undefined || property[key] === null) return 0;
    
    const value = property[key];
    
    if (typeof value === 'number') return value;
    
    if (typeof value === 'string') {
      // Handle currency strings by removing non-numeric characters
      return parseFloat(value.replace(/[^0-9.-]+/g, '')) || 0;
    }
    
    return 0;
  };
  
  // Generate the heatmap data
  const heatmapData = useMemo(() => {
    if (!properties.length) return [];
    
    // Sort properties by the selected attribute
    const sortedProperties = [...properties].sort((a, b) => {
      const aValue = getPropertyValue(a, sortAttribute);
      const bValue = getPropertyValue(b, sortAttribute);
      
      // If the sort attribute has an inverse flag, reverse the sort order
      const inverseMultiplier = attributeConfigs[sortAttribute as string]?.inverse ? -1 : 1;
      return (bValue - aValue) * inverseMultiplier;
    });
    
    // For each attribute, calculate the min and max values
    const ranges: Record<string, { min: number, max: number }> = {};
    
    Object.keys(attributeConfigs).forEach(attr => {
      const key = attr as keyof Property;
      const values = properties.map(p => getPropertyValue(p, key)).filter(v => v !== 0);
      
      if (values.length) {
        ranges[attr] = {
          min: Math.min(...values),
          max: Math.max(...values)
        };
      } else {
        ranges[attr] = { min: 0, max: 1 }; // Avoid division by zero
      }
    });
    
    // Generate heatmap cells
    return sortedProperties.map(property => {
      // For each property, create a cell for each attribute
      const attrs = Object.keys(attributeConfigs).map(attr => {
        const config = attributeConfigs[attr];
        const key = attr as keyof Property;
        const value = getPropertyValue(property, key);
        
        let intensity = 0;
        
        if (value > 0 && ranges[attr].max !== ranges[attr].min) {
          // Calculate intensity between 0 and 1
          intensity = (value - ranges[attr].min) / (ranges[attr].max - ranges[attr].min);
          
          // If the attribute should be inversed (like yearBuilt where older is lower value)
          if (config.inverse) {
            intensity = 1 - intensity;
          }
        }
        
        // Format the value for display
        const formattedValue = value ? config.format(property[key]) : 'N/A';
        
        return {
          value,
          intensity,
          property,
          attribute: attr,
          formattedValue
        } as HeatmapCell;
      });
      
      return attrs;
    });
  }, [properties, sortAttribute, attributeConfigs]);
  
  // Determine if a property is selected
  const isPropertySelected = (property: Property) => {
    return selectedProperties.some(p => p.id === property.id);
  };
  
  // Return null if we don't have properties
  if (!properties.length) {
    return (
      <div className="flex justify-center items-center h-full">
        <p className="text-muted-foreground">No properties available for comparison</p>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Select 
            value={sortAttribute as string} 
            onValueChange={(val) => setSortAttribute(val as keyof Property)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(attributeConfigs).map(([key, config]) => (
                <SelectItem key={key} value={key}>{config.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select 
            value={visualMode} 
            onValueChange={(val) => setVisualMode(val as 'absolute' | 'relative')}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Comparison Mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relative">Relative</SelectItem>
              <SelectItem value="absolute">Absolute</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto border rounded-md">
        <table className="w-full">
          <thead className="bg-muted/50 sticky top-0">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-sm text-muted-foreground">Property</th>
              {Object.values(attributeConfigs).map(config => (
                <th key={config.key as string} className="px-4 py-2 text-left font-medium text-sm text-muted-foreground">
                  {config.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {heatmapData.map((rowData, rowIndex) => {
              const property = rowData[0].property;
              const selected = isPropertySelected(property);
              const rowClassName = selected && highlightSelected 
                ? 'bg-primary/5 hover:bg-primary/10' 
                : 'hover:bg-muted/50';
                
              return (
                <tr 
                  key={property.id} 
                  className={rowClassName}
                >
                  <td className="px-4 py-3 border-t">
                    <div className="flex flex-col">
                      <span className="font-medium truncate" style={{ maxWidth: '250px' }}>
                        {property.address}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {property.parcelId}
                      </span>
                    </div>
                  </td>
                  
                  {rowData.map((cell, cellIndex) => {
                    const config = attributeConfigs[cell.attribute];
                    
                    // Calculate cell styles based on intensity
                    const opacity = visualMode === 'relative' 
                      ? cell.intensity 
                      : Math.min(1, Math.max(0, cell.value / (config.max || 1)));
                      
                    const bgColor = `rgba(${hexToRgb(config.color)}, ${opacity * 0.15})`;
                    const borderColor = `rgba(${hexToRgb(config.color)}, ${opacity * 0.3})`;
                    
                    return (
                      <td 
                        key={`${property.id}-${cell.attribute}`} 
                        className="px-4 py-3 border-t"
                        style={{ 
                          backgroundColor: bgColor,
                          borderLeft: `3px solid ${borderColor}`
                        }}
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">{cell.formattedValue}</span>
                          {visualMode === 'relative' && cell.value > 0 && (
                            <span className="text-xs text-muted-foreground">
                              {formatPercentage(cell.intensity * 100)} percentile
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Helper function to convert hex color to rgb for opacity settings
function hexToRgb(color: string): string {
  // For predefined rgb colors
  if (color.startsWith('rgb')) {
    return color.replace(/^rgba?\(|\s+|\)$/g, '');
  }
  
  // For hex colors
  // Remove # if present
  let hex = color.charAt(0) === '#' ? color.substring(1) : color;
  
  // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
  if (hex.length === 3) {
    hex = hex.split('').map(char => char + char).join('');
  }
  
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  return `${r}, ${g}, ${b}`;
}