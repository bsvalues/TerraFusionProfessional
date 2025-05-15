import React, { useState, useCallback } from 'react';
import { X, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { useMapAccessibility } from '@/contexts/MapAccessibilityContext';

interface PropertyType {
  id: string;
  name: string;
  color: string;
  highContrastColor: string;
  description: string;
}

interface MarkerType {
  id: string;
  name: string;
  description: string;
}

export const MapLegend: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(true);
  const { highContrastMode } = useMapAccessibility();

  // Define property types with colors
  const propertyTypes: PropertyType[] = [
    {
      id: 'residential',
      name: 'Residential',
      color: '#4ade80', // Standard green
      highContrastColor: '#2E8540', // Higher contrast green
      description: 'Residential properties including houses, condos, and apartments'
    },
    {
      id: 'commercial',
      name: 'Commercial',
      color: '#3b82f6', // Standard blue
      highContrastColor: '#0071BC', // Higher contrast blue
      description: 'Commercial properties including retail, offices, and services'
    },
    {
      id: 'industrial',
      name: 'Industrial',
      color: '#ef4444', // Standard red
      highContrastColor: '#D83933', // Higher contrast red
      description: 'Industrial properties including manufacturing and warehouses'
    },
    {
      id: 'agricultural',
      name: 'Agricultural',
      color: '#f59e0b', // Standard amber
      highContrastColor: '#FDB81E', // Higher contrast amber
      description: 'Agricultural properties including farms and ranches'
    }
  ];

  // Define marker types
  const markerTypes: MarkerType[] = [
    {
      id: 'default',
      name: 'Default',
      description: 'Standard marker for individual properties'
    },
    {
      id: 'selected',
      name: 'Selected',
      description: 'Indicates the currently selected property'
    },
    {
      id: 'cluster',
      name: 'Cluster',
      description: 'Represents a group of properties in the same area'
    },
    {
      id: 'heatmap',
      name: 'Heatmap',
      description: 'Shows property density with color intensity'
    }
  ];

  // Toggle legend visibility
  const toggleLegend = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  // Handle keyboard interactions
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleLegend();
    }
  }, [toggleLegend]);

  return (
    <div 
      className="absolute bottom-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg z-[1000] max-w-xs w-full border border-gray-200 dark:border-gray-700 overflow-hidden"
      style={{ maxHeight: '80vh' }}
      role="region"
      aria-label="Map legend"
    >
      {/* Legend Header */}
      <div className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
        <h3 className="font-medium text-gray-800 dark:text-gray-100 flex items-center">
          <Info size={16} className="mr-2" />
          Map Legend
        </h3>
        <div className="flex space-x-1">
          <button
            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={toggleLegend}
            onKeyDown={handleKeyDown}
            aria-label="Toggle legend"
            aria-expanded={isExpanded}
            aria-controls="legend-content"
          >
            {isExpanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
        </div>
      </div>

      {/* Legend Content */}
      <div 
        id="legend-content"
        data-testid="legend-content"
        className="overflow-y-auto p-3"
        style={{ 
          display: isExpanded ? 'block' : 'none',
          maxHeight: '60vh' 
        }}
      >
        {/* Property Types */}
        <div className="mb-4">
          <h4 className="font-medium text-sm mb-2 text-gray-700 dark:text-gray-300">Property Types</h4>
          <div className="space-y-2">
            {propertyTypes.map(type => (
              <div key={type.id} className="flex items-center">
                <div 
                  data-testid={`${type.id}-marker`}
                  className="w-5 h-5 rounded-full mr-2 border border-white"
                  style={{ 
                    backgroundColor: highContrastMode ? type.highContrastColor : type.color,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                  }}
                  role="img"
                  aria-label={`${type.name} property marker`}
                />
                <div>
                  <div className="font-medium text-sm text-gray-800 dark:text-gray-200">{type.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{type.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Marker Types */}
        <div>
          <h4 className="font-medium text-sm mb-2 text-gray-700 dark:text-gray-300">Marker Types</h4>
          <div className="space-y-2">
            {markerTypes.map(type => (
              <div key={type.id} className="flex items-start">
                <div className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5">
                  {type.id === 'default' && (
                    <div 
                      className="w-5 h-5 rounded-full bg-blue-500 border-2 border-white"
                      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }}
                    />
                  )}
                  {type.id === 'selected' && (
                    <div 
                      className="w-5 h-5 rounded-full bg-pink-500 border-2 border-gray-800"
                      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }}
                    >
                      <span className="flex items-center justify-center text-white text-xs">✓</span>
                    </div>
                  )}
                  {type.id === 'cluster' && (
                    <div 
                      className="w-6 h-6 rounded-full bg-indigo-500 border-2 border-white text-white flex items-center justify-center"
                      style={{ 
                        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                        fontSize: '10px',
                        fontWeight: 'bold'
                      }}
                    >
                      C
                    </div>
                  )}
                  {type.id === 'heatmap' && (
                    <div 
                      className="w-5 h-5 rounded-full"
                      style={{ 
                        backgroundColor: 'rgba(239, 68, 68, 0.7)',
                        boxShadow: '0 0 8px rgba(239, 68, 68, 0.5)',
                        filter: 'blur(1px)'
                      }}
                    />
                  )}
                </div>
                <div>
                  <div className="font-medium text-sm text-gray-800 dark:text-gray-200">{type.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{type.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapLegend;