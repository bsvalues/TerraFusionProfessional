import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from 'react-leaflet';
import { Property } from '@shared/schema';
import { 
  findHotspots, 
  HotspotResults,
  calculateMoransI
} from '@/services/spatialAnalysisService';
import { formatCurrency } from '@/lib/utils';

interface HotspotMapProps {
  properties: Property[];
  valueField: keyof Property;
  significanceLevel?: number;
  distanceThreshold?: number;
  className?: string;
}

// Component to handle map bounds
const MapBoundsHandler: React.FC<{properties: Property[]}> = ({ properties }) => {
  const map = useMap();
  
  useEffect(() => {
    if (properties.length === 0) return;
    
    // Extract valid coordinates
    const validCoords = properties
      .filter(p => p.latitude && p.longitude)
      .map(p => [p.latitude as number, p.longitude as number] as [number, number]);
    
    if (validCoords.length > 0) {
      map.fitBounds(validCoords);
    }
  }, [properties, map]);
  
  return null;
};

export const HotspotMap: React.FC<HotspotMapProps> = ({ 
  properties, 
  valueField, 
  significanceLevel = 0.05,
  distanceThreshold = 5,
  className = ''
}) => {
  const [results, setResults] = useState<HotspotResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [moransI, setMoransI] = useState<number | null>(null);
  
  useEffect(() => {
    if (!properties || properties.length === 0) {
      setError("No property data available for hotspot analysis");
      setLoading(false);
      return;
    }
    
    try {
      // Run hotspot analysis
      const hotspotResults = findHotspots(
        properties, 
        valueField, 
        significanceLevel,
        distanceThreshold
      );
      setResults(hotspotResults);
      
      // Calculate Moran's I for spatial autocorrelation
      const points = properties.map(p => ({ 
        lat: p.latitude as number, 
        lng: p.longitude as number 
      }));
      
      const values = properties.map(p => {
        const val = p[valueField];
        if (typeof val === 'string') {
          return parseFloat(val.replace(/[^0-9.-]+/g, ''));
        } else if (typeof val === 'number') {
          return val;
        }
        return 0;
      });
      
      const moransIValue = calculateMoransI(values, points, distanceThreshold);
      setMoransI(moransIValue);
      
      setLoading(false);
    } catch (err: any) {
      console.error("Error in hotspot analysis:", err);
      setError(err.message || "Failed to perform hotspot analysis");
      setLoading(false);
    }
  }, [properties, valueField, significanceLevel, distanceThreshold]);
  
  // Function to get the marker color based on hotspot type
  const getMarkerColor = (property: Property): string => {
    if (!results) return '#888888';
    
    if (results.hot.some(p => p.id === property.id)) {
      return '#ff4444'; // Red for hotspots
    } else if (results.cold.some(p => p.id === property.id)) {
      return '#4477ff'; // Blue for coldspots
    } else {
      return '#888888'; // Gray for non-significant
    }
  };
  
  // Function to get the marker size based on property value
  const getMarkerSize = (property: Property): number => {
    const baseSize = 8;
    
    if (!property[valueField]) return baseSize;
    
    // Extract numeric value
    let value: number;
    if (typeof property[valueField] === 'string') {
      value = parseFloat((property[valueField] as string).replace(/[^0-9.-]+/g, ''));
    } else if (typeof property[valueField] === 'number') {
      value = property[valueField] as number;
    } else {
      return baseSize;
    }
    
    // Find min and max values for normalization
    const values = properties
      .filter(p => p[valueField])
      .map(p => {
        if (typeof p[valueField] === 'string') {
          return parseFloat((p[valueField] as string).replace(/[^0-9.-]+/g, ''));
        } else if (typeof p[valueField] === 'number') {
          return p[valueField] as number;
        }
        return 0;
      });
    
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const range = maxValue - minValue;
    
    if (range === 0) return baseSize;
    
    // Normalize value between min and max, and calculate size (5-15)
    const normalizedValue = (value - minValue) / range;
    return baseSize + normalizedValue * 10;
  };
  
  // Format field name for display
  const formatFieldName = (field: string): string => {
    return field
      .replace(/([A-Z])/g, ' $1') // Add space before capital letters
      .replace(/^./, str => str.toUpperCase()); // Capitalize first letter
  };
  
  // Format value for display
  const formatValue = (property: Property): string => {
    const value = property[valueField];
    
    if (value === null || value === undefined) {
      return 'N/A';
    }
    
    if (typeof value === 'string' && (valueField === 'value' || valueField === 'salePrice' || valueField === 'landValue')) {
      return value; // Already formatted as currency
    }
    
    if (typeof value === 'number' && (valueField === 'squareFeet' || valueField === 'lotSize')) {
      return `${value.toLocaleString()} sq ft`;
    }
    
    return value.toString();
  };
  
  // Function to interpret Moran's I
  const interpretMoransI = (value: number | null): string => {
    if (value === null) return 'Not calculated';
    
    if (value > 0.3) return 'Strong clustering';
    if (value > 0.1) return 'Moderate clustering';
    if (value > -0.1) return 'Random pattern';
    if (value > -0.3) return 'Moderate dispersion';
    return 'Strong dispersion';
  };
  
  if (loading) {
    return (
      <div className={`bg-white p-4 rounded-lg shadow ${className}`}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-primary/30 border-t-primary rounded-full"></div>
          <span className="ml-3 text-gray-600">Analyzing spatial patterns...</span>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className={`bg-white p-4 rounded-lg shadow ${className}`}>
        <div className="flex flex-col items-center justify-center h-64">
          <div className="text-red-500 mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-gray-700 text-center">{error}</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`bg-white p-4 rounded-lg shadow ${className}`}>
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-2">
          Hotspot Analysis: {formatFieldName(valueField as string)}
        </h2>
        
        {results && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            <div className="bg-red-50 rounded-lg p-3 flex flex-col items-center">
              <span className="text-sm text-gray-500">Hotspots (High)</span>
              <span className="text-xl font-semibold text-red-600">{results.hot.length}</span>
            </div>
            <div className="bg-blue-50 rounded-lg p-3 flex flex-col items-center">
              <span className="text-sm text-gray-500">Coldspots (Low)</span>
              <span className="text-xl font-semibold text-blue-600">{results.cold.length}</span>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 flex flex-col items-center">
              <span className="text-sm text-gray-500">Random</span>
              <span className="text-xl font-semibold text-gray-600">{results.random.length}</span>
            </div>
          </div>
        )}
        
        {moransI !== null && (
          <div className="bg-gray-50 rounded-lg p-3 mb-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Spatial Autocorrelation (Moran's I)</span>
              <span className="text-sm">{interpretMoransI(moransI)}</span>
            </div>
            <div className="mt-2 relative h-2 bg-gray-200 rounded-full">
              <div 
                className={`absolute h-2 top-0 left-1/2 rounded-full ${
                  moransI > 0 ? 'bg-red-500' : 'bg-blue-500'
                }`}
                style={{ 
                  width: `${Math.abs(moransI) * 50}%`, 
                  transform: moransI > 0 ? 'translateX(0)' : 'translateX(-100%)'
                }}
              ></div>
              <div className="absolute h-4 w-1 bg-gray-400 top-1/2 left-1/2 transform -translate-y-1/2"></div>
            </div>
            <div className="flex justify-between mt-1 text-xs text-gray-500">
              <span>Dispersed</span>
              <span>Random</span>
              <span>Clustered</span>
            </div>
          </div>
        )}
      </div>
      
      <div className="h-96 rounded-lg overflow-hidden">
        <MapContainer
          style={{ height: '100%', width: '100%' }}
          zoom={12}
          center={[46.2, -119.1]} // Default center - will be adjusted by MapBoundsHandler
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <MapBoundsHandler properties={properties} />
          
          {properties.map(property => (
            property.latitude && property.longitude ? (
              <CircleMarker
                key={property.id}
                center={[property.latitude as number, property.longitude as number]}
                radius={getMarkerSize(property)}
                fillOpacity={0.7}
                weight={1}
                color="#ffffff"
                fillColor={getMarkerColor(property)}
                data-testid={`hotspot-marker-${property.id}`}
              >
                <Tooltip>
                  <div>
                    <strong>{property.address}</strong>
                    <div>{formatFieldName(valueField as string)}: {formatValue(property)}</div>
                    {results && results.hot.some(p => p.id === property.id) && (
                      <div className="text-red-600 font-semibold">Hotspot (High Value Cluster)</div>
                    )}
                    {results && results.cold.some(p => p.id === property.id) && (
                      <div className="text-blue-600 font-semibold">Coldspot (Low Value Cluster)</div>
                    )}
                  </div>
                </Tooltip>
              </CircleMarker>
            ) : null
          ))}
        </MapContainer>
      </div>
      
      <div className="mt-3 flex justify-center">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <div className="h-3 w-3 rounded-full bg-red-500 mr-1"></div>
            <span className="text-xs text-gray-600">Hotspot</span>
          </div>
          <div className="flex items-center">
            <div className="h-3 w-3 rounded-full bg-blue-500 mr-1"></div>
            <span className="text-xs text-gray-600">Coldspot</span>
          </div>
          <div className="flex items-center">
            <div className="h-3 w-3 rounded-full bg-gray-500 mr-1"></div>
            <span className="text-xs text-gray-600">Not Significant</span>
          </div>
        </div>
      </div>
      
      <div className="mt-4 text-xs text-gray-500">
        <p>
          <strong>Hotspot analysis</strong> identifies statistically significant spatial clusters of high values (hotspots) and low values (coldspots).
          The analysis was performed using Getis-Ord Gi* statistic at p-value &lt; {significanceLevel}.
        </p>
      </div>
    </div>
  );
};

export default HotspotMap;