import React, { useState, useRef, useEffect } from 'react';
import { 
  MapContainer, 
  TileLayer, 
  CircleMarker, 
  Tooltip, 
  useMap, 
  Circle,
  Polygon
} from 'react-leaflet';
import { Property } from '@shared/schema';
import { 
  filterProperties, 
  SpatialFilterParams, 
  calculateDistance
} from '@/services/spatialAnalysisService';
import { formatCurrency } from '@/lib/utils';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Slider
} from "@/components/ui/slider";
import { DrawingMode, DrawingControl } from './DrawingControl';
import L from 'leaflet';

interface SpatialFilterPanelProps {
  properties: Property[];
  onFilteredPropertiesChange?: (filteredProperties: Property[]) => void;
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

// Component for drawing tools control
interface DrawingControlProps {
  position: L.ControlPosition;
  onModeChange: (mode: DrawingMode) => void;
  onRadiusChange: (radius: number) => void;
  onCenterChange: (center: [number, number]) => void;
  onPolygonChange: (polygon: Array<[number, number]>) => void;
  onDrawingComplete: () => void;
}

// Implementation of DrawingControl placeholder
export const DrawingControl: React.FC<DrawingControlProps> = ({
  position,
  onModeChange,
  onRadiusChange,
  onCenterChange,
  onPolygonChange,
  onDrawingComplete
}) => {
  // This is a placeholder since we'd need to implement proper Leaflet controls
  // In a real implementation, this would interact with Leaflet.draw or similar
  
  useEffect(() => {
    // Setup would happen here
    return () => {
      // Cleanup would happen here
    };
  }, []);
  
  return null;
};

export const SpatialFilterPanel: React.FC<SpatialFilterPanelProps> = ({ 
  properties,
  onFilteredPropertiesChange,
  className = ''
}) => {
  // Refs
  const mapRef = useRef<L.Map | null>(null);
  
  // Filter state
  const [filterParams, setFilterParams] = useState<SpatialFilterParams>({});
  const [filteredProperties, setFilteredProperties] = useState<Property[]>(properties);
  
  // Drawing state
  const [drawingMode, setDrawingMode] = useState<DrawingMode>('none');
  const [radiusCenter, setRadiusCenter] = useState<[number, number] | null>(null);
  const [radiusSize, setRadiusSize] = useState<number>(2);
  const [polygonPoints, setPolygonPoints] = useState<Array<[number, number]>>([]);
  
  // UI state
  const [activeTab, setActiveTab] = useState<string>('radius');
  const [neighborhood, setNeighborhood] = useState<string>('');
  const [propertyType, setPropertyType] = useState<string>('');
  const [minValue, setMinValue] = useState<string>('');
  const [maxValue, setMaxValue] = useState<string>('');
  const [minYearBuilt, setMinYearBuilt] = useState<string>('');
  const [maxYearBuilt, setMaxYearBuilt] = useState<string>('');
  const [minSqFt, setMinSqFt] = useState<string>('');
  const [maxSqFt, setMaxSqFt] = useState<string>('');
  
  // Set drawing mode based on active tab
  useEffect(() => {
    if (activeTab === 'radius') {
      setDrawingMode('circle');
    } else if (activeTab === 'polygon') {
      setDrawingMode('polygon');
    } else {
      setDrawingMode('none');
    }
  }, [activeTab]);
  
  // Get unique neighborhoods
  const neighborhoods = [...new Set(
    properties
      .filter(p => p.neighborhood)
      .map(p => p.neighborhood)
  )].sort() as string[];
  
  // Get unique property types
  const propertyTypes = [...new Set(
    properties
      .filter(p => p.propertyType)
      .map(p => p.propertyType)
  )].sort() as string[];
  
  // Get min/max year built
  const years = properties
    .filter(p => p.yearBuilt !== null)
    .map(p => p.yearBuilt as number);
  const minYear = Math.min(...years);
  const maxYear = Math.max(...years);
  
  // Get min/max square feet
  const allSqFt = properties.map(p => p.squareFeet);
  const minSquareFeet = Math.min(...allSqFt);
  const maxSquareFeet = Math.max(...allSqFt);
  
  // Handle drawing mode change
  const handleModeChange = (mode: DrawingMode) => {
    setDrawingMode(mode);
  };
  
  // Handle radius center change
  const handleCenterChange = (center: [number, number]) => {
    setRadiusCenter(center);
  };
  
  // Handle radius change
  const handleRadiusChange = (radius: number) => {
    setRadiusSize(radius);
  };
  
  // Handle polygon points change
  const handlePolygonChange = (points: Array<[number, number]>) => {
    setPolygonPoints(points);
  };
  
  // Handle drawing complete
  const handleDrawingComplete = () => {
    if (activeTab === 'radius' && radiusCenter) {
      // Apply radius filter
      setFilterParams(prev => ({
        ...prev,
        centerPoint: {
          lat: radiusCenter[0],
          lng: radiusCenter[1]
        },
        radius: radiusSize
      }));
    } else if (activeTab === 'polygon' && polygonPoints.length >= 3) {
      // Apply polygon filter
      setFilterParams(prev => ({
        ...prev,
        polygon: polygonPoints.map(p => ({ lat: p[0], lng: p[1] }))
      }));
    }
  };
  
  // Simulate drawing by allowing map clicks
  const handleMapClick = (e: L.LeafletMouseEvent) => {
    if (drawingMode === 'circle') {
      setRadiusCenter([e.latlng.lat, e.latlng.lng]);
      handleDrawingComplete();
    } else if (drawingMode === 'polygon') {
      setPolygonPoints(points => {
        const newPoints = [...points, [e.latlng.lat, e.latlng.lng] as [number, number]];
        
        // If we have 3+ points and clicked close to the first point, close the polygon
        if (newPoints.length >= 3) {
          const firstPoint = newPoints[0];
          const lastPoint = newPoints[newPoints.length - 1];
          const distance = calculateDistance(firstPoint[0], firstPoint[1], lastPoint[0], lastPoint[1]);
          
          if (distance < 0.1) { // Within 100 meters
            // Close the polygon by removing the last point (too close to first)
            return newPoints.slice(0, -1);
          }
        }
        
        return newPoints;
      });
    }
  };
  
  // Clear drawing
  const clearDrawing = () => {
    if (activeTab === 'radius') {
      setRadiusCenter(null);
      setFilterParams(prev => {
        const { centerPoint, radius, ...rest } = prev;
        return rest;
      });
    } else if (activeTab === 'polygon') {
      setPolygonPoints([]);
      setFilterParams(prev => {
        const { polygon, ...rest } = prev;
        return rest;
      });
    }
  };
  
  // Apply attribute filters
  const applyAttributeFilters = () => {
    const newParams: SpatialFilterParams = { ...filterParams };
    
    if (neighborhood) newParams.neighborhood = neighborhood;
    if (propertyType) newParams.propertyType = propertyType;
    
    if (minValue) newParams.minValue = parseFloat(minValue);
    if (maxValue) newParams.maxValue = parseFloat(maxValue);
    
    if (minYearBuilt) newParams.minYearBuilt = parseInt(minYearBuilt, 10);
    if (maxYearBuilt) newParams.maxYearBuilt = parseInt(maxYearBuilt, 10);
    
    if (minSqFt) newParams.minSquareFeet = parseFloat(minSqFt);
    if (maxSqFt) newParams.maxSquareFeet = parseFloat(maxSqFt);
    
    setFilterParams(newParams);
  };
  
  // Clear all filters
  const clearAllFilters = () => {
    setFilterParams({});
    setRadiusCenter(null);
    setPolygonPoints([]);
    setNeighborhood('');
    setPropertyType('');
    setMinValue('');
    setMaxValue('');
    setMinYearBuilt('');
    setMaxYearBuilt('');
    setMinSqFt('');
    setMaxSqFt('');
  };
  
  // Apply filtering when filter params change
  useEffect(() => {
    const filtered = filterProperties(properties, filterParams);
    setFilteredProperties(filtered);
    
    if (onFilteredPropertiesChange) {
      onFilteredPropertiesChange(filtered);
    }
  }, [filterParams, properties, onFilteredPropertiesChange]);
  
  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800 mb-2">
          Spatial Property Filter
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Filter properties using spatial queries and property attributes.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Map Section */}
          <Card className="col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Draw Filter Area</CardTitle>
              <CardDescription>
                Click on the map to place a {activeTab === 'radius' ? 'circle center' : 'polygon points'}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 pb-0">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="px-4 pt-0">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="radius">Radius</TabsTrigger>
                  <TabsTrigger value="polygon">Polygon</TabsTrigger>
                </TabsList>
                
                <TabsContent value="radius" className="pt-2">
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Radius: {radiusSize.toFixed(1)} km
                    </label>
                    <Slider
                      min={0.5}
                      max={10}
                      step={0.5}
                      value={[radiusSize]}
                      onValueChange={(values) => setRadiusSize(values[0])}
                      className="py-2"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>0.5 km</span>
                      <span>10 km</span>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="polygon" className="pt-2">
                  <div className="mb-4">
                    <p className="text-sm text-gray-600">
                      Click to add points. Create at least 3 points to form a polygon.
                      {polygonPoints.length > 0 && ` (${polygonPoints.length} points added)`}
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
              
              <div className="h-64 w-full">
                <MapContainer
                  ref={mapRef}
                  style={{ height: '100%', width: '100%' }}
                  zoom={12}
                  center={[46.2, -119.1]} // Default center - will be adjusted by MapBoundsHandler
                  onClick={handleMapClick}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  
                  <MapBoundsHandler properties={properties} />
                  
                  {/* All properties as markers */}
                  {properties.map(property => {
                    if (!property.latitude || !property.longitude) return null;
                    
                    const isFiltered = filteredProperties.some(p => p.id === property.id);
                    
                    return (
                      <CircleMarker
                        key={property.id}
                        center={[property.latitude as number, property.longitude as number]}
                        radius={5}
                        fillOpacity={0.7}
                        weight={1}
                        color="#ffffff"
                        fillColor={isFiltered ? '#4CAF50' : '#bbbbbb'}
                        data-testid={`property-marker-${property.id}`}
                      >
                        <Tooltip>
                          <div>
                            <strong>{property.address}</strong>
                            <div>Value: {property.value || 'N/A'}</div>
                            <div>Type: {property.propertyType || 'N/A'}</div>
                          </div>
                        </Tooltip>
                      </CircleMarker>
                    );
                  })}
                  
                  {/* Radius visualization */}
                  {radiusCenter && (
                    <Circle
                      center={radiusCenter}
                      radius={radiusSize * 1000} // Convert km to meters
                      pathOptions={{
                        color: '#1E88E5',
                        fillColor: '#1E88E5',
                        fillOpacity: 0.1,
                        weight: 2
                      }}
                    />
                  )}
                  
                  {/* Polygon visualization */}
                  {polygonPoints.length >= 3 && (
                    <Polygon
                      positions={polygonPoints}
                      pathOptions={{
                        color: '#1E88E5',
                        fillColor: '#1E88E5',
                        fillOpacity: 0.1,
                        weight: 2
                      }}
                    />
                  )}
                  
                  {/* Drawing control - this would be replaced with proper Leaflet.draw implementation */}
                  <DrawingControl
                    position="topright"
                    onModeChange={handleModeChange}
                    onRadiusChange={handleRadiusChange}
                    onCenterChange={handleCenterChange}
                    onPolygonChange={handlePolygonChange}
                    onDrawingComplete={handleDrawingComplete}
                  />
                </MapContainer>
              </div>
              
              <div className="p-4">
                <button
                  onClick={clearDrawing}
                  className="w-full py-1.5 border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
                >
                  Clear Drawing
                </button>
              </div>
            </CardContent>
          </Card>
          
          {/* Filters Section */}
          <Card className="col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Property Attributes</CardTitle>
              <CardDescription>
                Filter by property characteristics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Neighborhood */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Neighborhood
                  </label>
                  <Select value={neighborhood} onValueChange={setNeighborhood}>
                    <SelectTrigger>
                      <SelectValue placeholder="Any neighborhood" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any neighborhood</SelectItem>
                      {neighborhoods.map(n => (
                        <SelectItem key={n} value={n}>{n}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Property Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Property Type
                  </label>
                  <Select value={propertyType} onValueChange={setPropertyType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Any type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any type</SelectItem>
                      {propertyTypes.map(t => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Value Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Value Range
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      placeholder="Min value"
                      value={minValue}
                      onChange={(e) => setMinValue(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <input
                      type="number"
                      placeholder="Max value"
                      value={maxValue}
                      onChange={(e) => setMaxValue(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
                
                {/* Year Built Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Year Built Range
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      placeholder="Min year"
                      value={minYearBuilt}
                      onChange={(e) => setMinYearBuilt(e.target.value)}
                      min={minYear}
                      max={maxYear}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <input
                      type="number"
                      placeholder="Max year"
                      value={maxYearBuilt}
                      onChange={(e) => setMaxYearBuilt(e.target.value)}
                      min={minYear}
                      max={maxYear}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
                
                {/* Square Feet Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Square Feet Range
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      placeholder="Min sq ft"
                      value={minSqFt}
                      onChange={(e) => setMinSqFt(e.target.value)}
                      min={minSquareFeet}
                      max={maxSquareFeet}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <input
                      type="number"
                      placeholder="Max sq ft"
                      value={maxSqFt}
                      onChange={(e) => setMaxSqFt(e.target.value)}
                      min={minSquareFeet}
                      max={maxSquareFeet}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
                
                {/* Apply button */}
                <button
                  onClick={applyAttributeFilters}
                  className="w-full py-2 mt-2 bg-primary text-white rounded-md hover:bg-primary/90"
                >
                  Apply Filters
                </button>
                
                {/* Clear button */}
                <button
                  onClick={clearAllFilters}
                  className="w-full py-2 mt-1 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Clear All Filters
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Results Section */}
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-md font-semibold text-gray-800">
            Filtered Results: {filteredProperties.length} properties
          </h3>
          
          <span className="text-sm text-gray-500">
            {filteredProperties.length === properties.length 
              ? 'No filters applied' 
              : `${filteredProperties.length} of ${properties.length} properties match filters`}
          </span>
        </div>
        
        {/* Results grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
          {filteredProperties.slice(0, 6).map(property => (
            <Card key={property.id} className="h-full">
              <CardContent className="p-3">
                <div className="font-medium text-gray-900">{property.address}</div>
                <div className="text-sm text-primary font-semibold mt-1">
                  {property.value || 'Value not available'}
                </div>
                <div className="grid grid-cols-2 gap-1 text-xs text-gray-500 mt-2">
                  <div>Type: {property.propertyType || 'N/A'}</div>
                  <div>Year: {property.yearBuilt || 'N/A'}</div>
                  <div>Sq Ft: {property.squareFeet.toLocaleString()}</div>
                  <div>Neighborhood: {property.neighborhood || 'N/A'}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Show more link */}
        {filteredProperties.length > 6 && (
          <div className="text-center mt-4">
            <span className="text-sm text-primary cursor-pointer hover:underline">
              {filteredProperties.length - 6} more properties match your filters
            </span>
          </div>
        )}
        
        {/* No results message */}
        {filteredProperties.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No properties match the current filters.</p>
            <p className="text-sm mt-1">Try adjusting your filter criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SpatialFilterPanel;