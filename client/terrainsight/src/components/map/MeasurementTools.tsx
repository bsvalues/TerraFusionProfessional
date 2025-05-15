import React, { useState, useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { 
  Ruler, 
  Square, 
  X, 
  ArrowUpRight, 
  Trash2,
  MinusCircle,
  Text
} from 'lucide-react';
import { Tooltip } from '@/components/ui/custom-tooltip';

// Units for measurement
const UNITS = {
  FEET: 'feet',
  METERS: 'meters',
  MILES: 'miles',
  KILOMETERS: 'kilometers',
  ACRES: 'acres',
  HECTARES: 'hectares',
  SQUARE_FEET: 'sq. ft.',
  SQUARE_METERS: 'sq. m.',
};

// Conversion factors
const CONVERSION_FACTORS = {
  [UNITS.METERS]: 1,
  [UNITS.FEET]: 3.28084,
  [UNITS.KILOMETERS]: 0.001,
  [UNITS.MILES]: 0.000621371,
  [UNITS.SQUARE_METERS]: 1,
  [UNITS.SQUARE_FEET]: 10.7639,
  [UNITS.HECTARES]: 0.0001,
  [UNITS.ACRES]: 0.000247105,
};

interface MeasurementToolsProps {
  className?: string;
}

interface MeasurementPoint {
  latlng: L.LatLng;
  marker: L.Marker;
}

interface Measurement {
  type: 'distance' | 'area';
  points: MeasurementPoint[];
  value: number;
  line?: L.Polyline;
  polygon?: L.Polygon;
}

export const MeasurementTools: React.FC<MeasurementToolsProps> = ({
  className,
}) => {
  const map = useMap();
  const [isVisible, setIsVisible] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [activeMode, setActiveMode] = useState<'distance' | 'area' | null>(null);
  const [distanceUnit, setDistanceUnit] = useState<string>(UNITS.FEET);
  const [areaUnit, setAreaUnit] = useState<string>(UNITS.ACRES);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [activeMeasurement, setActiveMeasurement] = useState<Measurement | null>(null);
  
  // Create a measurement layer group
  const measurementLayerRef = useRef<L.LayerGroup | null>(null);
  
  // Initialize measurement layer
  useEffect(() => {
    measurementLayerRef.current = L.layerGroup().addTo(map);
    
    return () => {
      if (measurementLayerRef.current) {
        measurementLayerRef.current.clearLayers();
        measurementLayerRef.current.remove();
      }
    };
  }, [map]);
  
  // Set up keyboard handlers for accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ESC key to cancel active measurement
      if (e.key === 'Escape' && activeMode) {
        cancelMeasurement();
      }
      
      // Delete key to remove selected measurement
      if (e.key === 'Delete' && activeMeasurement) {
        removeMeasurement(activeMeasurement);
      }
      
      // M key to toggle the measurement panel
      if (e.key === 'm') {
        setIsVisible(prev => !prev);
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeMode, activeMeasurement]);
  
  // Set up map click handler for adding measurement points
  useEffect(() => {
    if (!isActive || !activeMode || !measurementLayerRef.current) return;
    
    const handleMapClick = (e: L.LeafletMouseEvent) => {
      if (!activeMeasurement) {
        // Start new measurement
        const newMeasurement: Measurement = {
          type: activeMode,
          points: [],
          value: 0,
        };
        
        setActiveMeasurement(newMeasurement);
        setMeasurements(prev => [...prev, newMeasurement]);
      }
      
      // Add point to active measurement
      if (activeMeasurement) {
        const pointMarker = L.marker(e.latlng, {
          icon: L.divIcon({
            className: 'measurement-point',
            html: `<div class="h-2 w-2 bg-blue-500 rounded-full border border-white"></div>`,
            iconSize: [8, 8],
            iconAnchor: [4, 4]
          }),
          draggable: true,
        }).addTo(measurementLayerRef.current!);
        
        // Handle marker drag to update measurements
        pointMarker.on('drag', () => {
          updateMeasurement();
        });
        
        // Add point to active measurement
        const newPoint = {
          latlng: e.latlng,
          marker: pointMarker
        };
        
        activeMeasurement.points.push(newPoint);
        updateMeasurement();
      }
    };
    
    map.on('click', handleMapClick);
    
    return () => {
      map.off('click', handleMapClick);
    };
  }, [isActive, activeMode, activeMeasurement, map]);
  
  // Updates the current measurement visualization and calculation
  const updateMeasurement = () => {
    if (!activeMeasurement || !measurementLayerRef.current) return;
    
    const { type, points, line, polygon } = activeMeasurement;
    
    // Remove old line/polygon
    if (line) measurementLayerRef.current.removeLayer(line);
    if (polygon) measurementLayerRef.current.removeLayer(polygon);
    
    if (points.length < 2) return;
    
    // Get updated coordinates
    const latlngs = points.map(p => p.marker.getLatLng());
    
    if (type === 'distance') {
      // Create or update line
      const newLine = L.polyline(latlngs, {
        color: '#3b82f6',
        weight: 3,
        opacity: 0.8,
        dashArray: '5, 5',
      }).addTo(measurementLayerRef.current);
      
      // Calculate distance
      let totalDistance = 0;
      for (let i = 1; i < latlngs.length; i++) {
        totalDistance += latlngs[i-1].distanceTo(latlngs[i]);
      }
      
      // Update measurement with new line and value
      activeMeasurement.line = newLine;
      activeMeasurement.value = totalDistance;
      
      // Add distance labels
      if (activeMeasurement.line) {
        const midPoint = getMidpoint(latlngs);
        const formattedDistance = formatDistance(totalDistance, distanceUnit);
        
        // Add or update label
        L.marker(midPoint, {
          icon: L.divIcon({
            className: 'measurement-label',
            html: `<div class="px-2 py-1 bg-white rounded shadow text-xs">${formattedDistance}</div>`,
            iconSize: [100, 20],
            iconAnchor: [50, 10]
          })
        }).addTo(measurementLayerRef.current);
      }
    } else if (type === 'area') {
      // For area measurement, we need at least 3 points
      if (latlngs.length >= 3) {
        // Create a closed polygon
        const polygonLatlngs = [...latlngs];
        // Add first point to close the polygon if needed for visualization
        if (!latlngs[0].equals(latlngs[latlngs.length - 1])) {
          polygonLatlngs.push(latlngs[0]);
        }
        
        // Create or update polygon
        const newPolygon = L.polygon(polygonLatlngs, {
          color: '#3b82f6',
          weight: 2,
          opacity: 0.8,
          fillColor: '#93c5fd',
          fillOpacity: 0.2,
        }).addTo(measurementLayerRef.current);
        
        // Calculate area
        const area = L.GeometryUtil.geodesicArea(latlngs);
        
        // Update measurement with new polygon and value
        activeMeasurement.polygon = newPolygon;
        activeMeasurement.value = area;
        
        // Add area label at center of polygon
        const center = newPolygon.getBounds().getCenter();
        const formattedArea = formatArea(area, areaUnit);
        
        L.marker(center, {
          icon: L.divIcon({
            className: 'measurement-label',
            html: `<div class="px-2 py-1 bg-white rounded shadow text-xs">${formattedArea}</div>`,
            iconSize: [100, 20],
            iconAnchor: [50, 10]
          })
        }).addTo(measurementLayerRef.current);
      }
    }
    
    // Force update
    setActiveMeasurement({...activeMeasurement});
    setMeasurements(prev => {
      const index = prev.findIndex(m => m === activeMeasurement);
      if (index >= 0) {
        const newMeasurements = [...prev];
        newMeasurements[index] = {...activeMeasurement};
        return newMeasurements;
      }
      return prev;
    });
  };
  
  // Helper to get midpoint of a line
  const getMidpoint = (points: L.LatLng[]): L.LatLng => {
    if (points.length === 2) {
      return L.latLng(
        (points[0].lat + points[1].lat) / 2,
        (points[0].lng + points[1].lng) / 2
      );
    }
    
    // For multiple segments, return middle segment's midpoint
    const middleIndex = Math.floor(points.length / 2) - 1;
    return L.latLng(
      (points[middleIndex].lat + points[middleIndex + 1].lat) / 2,
      (points[middleIndex].lng + points[middleIndex + 1].lng) / 2
    );
  };
  
  // Format distance based on selected unit
  const formatDistance = (meters: number, unit: string): string => {
    const value = meters * CONVERSION_FACTORS[unit as keyof typeof CONVERSION_FACTORS];
    return `${value.toFixed(2)} ${unit}`;
  };
  
  // Format area based on selected unit
  const formatArea = (squareMeters: number, unit: string): string => {
    const value = squareMeters * CONVERSION_FACTORS[unit as keyof typeof CONVERSION_FACTORS];
    return `${value.toFixed(2)} ${unit}`;
  };
  
  // Start distance measurement
  const startDistanceMeasurement = () => {
    setIsActive(true);
    setActiveMode('distance');
    setActiveMeasurement(null);
    
    // Set cursor to crosshair
    map.getContainer().style.cursor = 'crosshair';
  };
  
  // Start area measurement
  const startAreaMeasurement = () => {
    setIsActive(true);
    setActiveMode('area');
    setActiveMeasurement(null);
    
    // Set cursor to crosshair
    map.getContainer().style.cursor = 'crosshair';
  };
  
  // Finish current measurement
  const finishMeasurement = () => {
    setIsActive(false);
    setActiveMode(null);
    setActiveMeasurement(null);
    
    // Reset cursor
    map.getContainer().style.cursor = '';
  };
  
  // Cancel current measurement
  const cancelMeasurement = () => {
    if (activeMeasurement) {
      // Remove from measurements list
      setMeasurements(prev => prev.filter(m => m !== activeMeasurement));
      
      // Remove all associated markers, lines, polygons
      if (measurementLayerRef.current) {
        activeMeasurement.points.forEach(p => {
          measurementLayerRef.current!.removeLayer(p.marker);
        });
        
        if (activeMeasurement.line) {
          measurementLayerRef.current.removeLayer(activeMeasurement.line);
        }
        
        if (activeMeasurement.polygon) {
          measurementLayerRef.current.removeLayer(activeMeasurement.polygon);
        }
      }
    }
    
    setIsActive(false);
    setActiveMode(null);
    setActiveMeasurement(null);
    
    // Reset cursor
    map.getContainer().style.cursor = '';
  };
  
  // Remove a specific measurement
  const removeMeasurement = (measurement: Measurement) => {
    // Remove all associated markers, lines, polygons
    if (measurementLayerRef.current) {
      measurement.points.forEach(p => {
        measurementLayerRef.current!.removeLayer(p.marker);
      });
      
      if (measurement.line) {
        measurementLayerRef.current.removeLayer(measurement.line);
      }
      
      if (measurement.polygon) {
        measurementLayerRef.current.removeLayer(measurement.polygon);
      }
    }
    
    // Remove from measurements list
    setMeasurements(prev => prev.filter(m => m !== measurement));
    
    if (activeMeasurement === measurement) {
      setActiveMeasurement(null);
    }
  };
  
  // Clear all measurements
  const clearAllMeasurements = () => {
    // Remove all measurement markers and shapes
    if (measurementLayerRef.current) {
      measurementLayerRef.current.clearLayers();
    }
    
    setMeasurements([]);
    setActiveMeasurement(null);
    setIsActive(false);
    setActiveMode(null);
    
    // Reset cursor
    map.getContainer().style.cursor = '';
  };
  
  // Create a tooltip with the measurement value
  const createMeasurementTooltip = (measurement: Measurement) => {
    if (measurement.type === 'distance') {
      return formatDistance(measurement.value, distanceUnit);
    } else {
      return formatArea(measurement.value, areaUnit);
    }
  };
  
  return (
    <>
      <Tooltip
        content="Measurement Tools"
      >
        <Button
          variant="outline"
          size="sm"
          className="absolute top-4 left-[136px] z-10 bg-white p-2"
          onClick={() => setIsVisible(prev => !prev)}
          aria-label="Toggle Measurement Tools"
          data-testid="toggle-measurement-tools"
        >
          <Ruler className="h-4 w-4" />
        </Button>
      </Tooltip>
      
      <Card
        className={cn(
          "absolute top-16 left-4 z-9 rounded-md overflow-hidden w-72",
          "transition-opacity duration-300",
          isVisible ? "opacity-100" : "opacity-0 pointer-events-none",
          className
        )}
        data-testid="measurement-tools-panel"
      >
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-medium">Measurement Tools</h3>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => setIsVisible(false)}
              aria-label="Close Measurement Tools"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex space-x-2 mb-4">
            <Button
              variant={activeMode === 'distance' ? "default" : "outline"}
              size="sm"
              className="flex-1"
              onClick={startDistanceMeasurement}
              disabled={isActive && activeMode !== 'distance'}
              aria-label="Measure Distance"
              data-testid="measure-distance-button"
            >
              <ArrowUpRight className="h-4 w-4 mr-2" />
              Distance
            </Button>
            
            <Button
              variant={activeMode === 'area' ? "default" : "outline"}
              size="sm"
              className="flex-1"
              onClick={startAreaMeasurement}
              disabled={isActive && activeMode !== 'area'}
              aria-label="Measure Area"
              data-testid="measure-area-button"
            >
              <Square className="h-4 w-4 mr-2" />
              Area
            </Button>
          </div>
          
          {isActive && (
            <div className="bg-muted p-2 rounded-md mb-4">
              <p className="text-xs mb-2">
                {activeMode === 'distance' 
                  ? 'Click on the map to add points. Double-click to finish.' 
                  : 'Click to add points. Close the polygon to calculate area.'}
              </p>
              
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={finishMeasurement}
                  aria-label="Finish Measurement"
                >
                  Finish
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={cancelMeasurement}
                  aria-label="Cancel Measurement"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
          
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-xs font-medium">Units</h4>
            </div>
            
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div>
                <p className="text-xs mb-1">Distance</p>
                <select
                  className="w-full text-xs p-1 border rounded"
                  value={distanceUnit}
                  onChange={(e) => setDistanceUnit(e.target.value)}
                  aria-label="Select Distance Unit"
                >
                  <option value={UNITS.FEET}>Feet</option>
                  <option value={UNITS.METERS}>Meters</option>
                  <option value={UNITS.MILES}>Miles</option>
                  <option value={UNITS.KILOMETERS}>Kilometers</option>
                </select>
              </div>
              
              <div>
                <p className="text-xs mb-1">Area</p>
                <select
                  className="w-full text-xs p-1 border rounded"
                  value={areaUnit}
                  onChange={(e) => setAreaUnit(e.target.value)}
                  aria-label="Select Area Unit"
                >
                  <option value={UNITS.ACRES}>Acres</option>
                  <option value={UNITS.HECTARES}>Hectares</option>
                  <option value={UNITS.SQUARE_FEET}>Square Feet</option>
                  <option value={UNITS.SQUARE_METERS}>Square Meters</option>
                </select>
              </div>
            </div>
          </div>
          
          {measurements.length > 0 && (
            <>
              <Separator className="my-2" />
              
              <div className="mt-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-xs font-medium">Measurements</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 p-1"
                    onClick={clearAllMeasurements}
                    aria-label="Clear All Measurements"
                    data-testid="clear-measurements-button"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    <span className="text-xs">Clear All</span>
                  </Button>
                </div>
                
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {measurements.map((measurement, index) => (
                    <div 
                      key={index}
                      className={cn(
                        "flex justify-between items-center p-2 rounded-md text-xs",
                        measurement === activeMeasurement ? "bg-muted" : "hover:bg-muted/50"
                      )}
                    >
                      <div className="flex items-center">
                        {measurement.type === 'distance' ? (
                          <ArrowUpRight className="h-3 w-3 mr-2" />
                        ) : (
                          <Square className="h-3 w-3 mr-2" />
                        )}
                        <span>
                          {createMeasurementTooltip(measurement)}
                        </span>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 w-5 p-0"
                        onClick={() => removeMeasurement(measurement)}
                        aria-label={`Remove ${measurement.type} measurement`}
                      >
                        <MinusCircle className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </>
  );
};

export default MeasurementTools;